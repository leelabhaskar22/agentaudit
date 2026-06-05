import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import type { AuditReport } from "./audit-types";

const InputSchema = z.object({
  code: z.string().optional(),
  url: z.string().url().optional(),
}).refine((d) => d.code || d.url, { message: "Provide code or url" });

const SYSTEM_PROMPT = `You are AgentAudit, an expert Solidity smart contract security auditor.
Analyze the provided contract and identify vulnerabilities across these categories:
- Reentrancy
- Integer overflow/underflow
- Access control issues
- Unchecked external calls / return values
- tx.origin misuse
- Gas griefing / DoS
- Front-running / MEV
- Timestamp dependence
- Delegatecall risks
- Uninitialized storage pointers
- Logic errors and business logic flaws

Be thorough but precise. Only report real issues. For each finding include exact line numbers and a concise fix recommendation.
Return ONLY valid JSON matching the schema. No prose, no markdown fences.`;

function toRawGithub(url: string): string {
  // Convert github.com/x/y/blob/main/F.sol -> raw.githubusercontent.com/x/y/main/F.sol
  const m = url.match(/^https?:\/\/github\.com\/([^/]+)\/([^/]+)\/blob\/(.+)$/);
  if (m) return `https://raw.githubusercontent.com/${m[1]}/${m[2]}/${m[3]}`;
  return url;
}

export const auditContract = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => InputSchema.parse(d))
  .handler(async ({ data }): Promise<AuditReport> => {
    const apiKey = process.env.LOVABLE_API_KEY;
    if (!apiKey) throw new Error("LOVABLE_API_KEY not configured");

    let source = data.code ?? "";
    if (!source && data.url) {
      const rawUrl = toRawGithub(data.url);
      const res = await fetch(rawUrl);
      if (!res.ok) throw new Error(`Failed to fetch contract from URL (${res.status})`);
      source = await res.text();
    }
    if (!source || source.length < 10) throw new Error("Contract source is empty");
    if (source.length > 60000) source = source.slice(0, 60000);

    const schema = {
      type: "object",
      properties: {
        summary: { type: "string" },
        riskScore: { type: "number" },
        contractName: { type: "string" },
        findings: {
          type: "array",
          items: {
            type: "object",
            properties: {
              id: { type: "string" },
              title: { type: "string" },
              severity: { type: "string", enum: ["critical", "high", "medium", "low", "informational"] },
              category: { type: "string" },
              lineNumbers: { type: "array", items: { type: "number" } },
              description: { type: "string" },
              recommendation: { type: "string" },
              codeSnippet: { type: "string" },
            },
            required: ["id", "title", "severity", "category", "lineNumbers", "description", "recommendation", "codeSnippet"],
          },
        },
      },
      required: ["summary", "riskScore", "contractName", "findings"],
    };

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Lovable-API-Key": apiKey,
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: `Audit this Solidity contract. Return JSON only.\n\n\`\`\`solidity\n${source}\n\`\`\`` },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "submit_audit_report",
              description: "Submit the final audit report",
              parameters: schema,
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "submit_audit_report" } },
      }),
    });

    if (!response.ok) {
      const text = await response.text();
      if (response.status === 429) throw new Error("AI rate limit exceeded. Try again shortly.");
      if (response.status === 402) throw new Error("AI credits exhausted. Add credits to your workspace.");
      throw new Error(`AI gateway error ${response.status}: ${text.slice(0, 200)}`);
    }

    const payload = await response.json();
    const toolCall = payload?.choices?.[0]?.message?.tool_calls?.[0];
    const args = toolCall?.function?.arguments;
    if (!args) throw new Error("AI returned no audit report");
    const parsed = typeof args === "string" ? JSON.parse(args) : args;

    return { ...parsed, source } as AuditReport;
  });