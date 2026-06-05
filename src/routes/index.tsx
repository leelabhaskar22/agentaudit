import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";
import { auditContract } from "@/lib/audit.functions";
import type { AuditReport, Severity } from "@/lib/audit-types";
import { generateAuditPdf } from "@/lib/audit-pdf";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Shield, AlertTriangle, Download, Loader2, FileCode, Github } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "AgentAudit — AI Smart Contract Security Auditor" },
      { name: "description", content: "Audit Solidity smart contracts with AI. Detect reentrancy, access control, overflow, and more in seconds." },
      { property: "og:title", content: "AgentAudit — AI Smart Contract Security Auditor" },
      { property: "og:description", content: "Audit Solidity smart contracts with AI. Detect reentrancy, access control, overflow, and more in seconds." },
    ],
  }),
  component: Index,
});

const SEVERITY_STYLES: Record<Severity, { badge: string; border: string; label: string }> = {
  critical: { badge: "bg-red-600 text-white", border: "border-l-red-600", label: "Critical" },
  high: { badge: "bg-orange-600 text-white", border: "border-l-orange-600", label: "High" },
  medium: { badge: "bg-yellow-500 text-black", border: "border-l-yellow-500", label: "Medium" },
  low: { badge: "bg-blue-600 text-white", border: "border-l-blue-600", label: "Low" },
  informational: { badge: "bg-zinc-500 text-white", border: "border-l-zinc-500", label: "Info" },
};

const SAMPLE = `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract Vault {
    mapping(address => uint) public balances;

    function deposit() external payable {
        balances[msg.sender] += msg.value;
    }

    function withdraw() external {
        uint bal = balances[msg.sender];
        (bool ok, ) = msg.sender.call{value: bal}("");
        require(ok);
        balances[msg.sender] = 0;
    }
}`;

function Index() {
  const audit = useServerFn(auditContract);
  const [code, setCode] = useState("");
  const [url, setUrl] = useState("");
  const [tab, setTab] = useState("code");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [report, setReport] = useState<AuditReport | null>(null);

  const run = async () => {
    setError(null);
    setReport(null);
    setLoading(true);
    try {
      const payload = tab === "code" ? { code } : { url };
      const result = await audit({ data: payload });
      setReport(result);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Audit failed");
    } finally {
      setLoading(false);
    }
  };

  const counts = report?.findings.reduce<Record<Severity, number>>((acc, f) => {
    acc[f.severity] = (acc[f.severity] ?? 0) + 1;
    return acc;
  }, { critical: 0, high: 0, medium: 0, low: 0, informational: 0 });

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="mx-auto max-w-6xl px-6 py-5 flex items-center gap-3">
          <div className="h-9 w-9 rounded-md bg-primary text-primary-foreground grid place-items-center">
            <Shield className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-lg font-semibold leading-tight">AgentAudit</h1>
            <p className="text-xs text-muted-foreground">AI-powered smart contract security</p>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-10 space-y-8">
        <section className="text-center space-y-3">
          <h2 className="text-4xl font-bold tracking-tight">Audit Solidity contracts in seconds</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Paste a contract or a GitHub URL. An AI security agent checks for reentrancy, access control, overflow,
            gas griefing, and more — then generates a professional report.
          </p>
        </section>

        <Card>
          <CardHeader>
            <CardTitle>New Audit</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs value={tab} onValueChange={setTab}>
              <TabsList className="mb-4">
                <TabsTrigger value="code"><FileCode className="h-4 w-4 mr-2" />Paste code</TabsTrigger>
                <TabsTrigger value="url"><Github className="h-4 w-4 mr-2" />GitHub URL</TabsTrigger>
              </TabsList>
              <TabsContent value="code" className="space-y-3">
                <Textarea
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="// SPDX-License-Identifier: MIT&#10;pragma solidity ^0.8.0;&#10;&#10;contract MyContract { ... }"
                  className="font-mono text-sm min-h-[260px]"
                />
                <Button variant="ghost" size="sm" onClick={() => setCode(SAMPLE)}>Load sample vulnerable contract</Button>
              </TabsContent>
              <TabsContent value="url" className="space-y-3">
                <Input
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://github.com/owner/repo/blob/main/contracts/Token.sol"
                />
                <p className="text-xs text-muted-foreground">GitHub blob URLs and raw .sol files supported.</p>
              </TabsContent>
            </Tabs>

            <div className="flex items-center gap-3 mt-4">
              <Button onClick={run} disabled={loading || (tab === "code" ? !code.trim() : !url.trim())}>
                {loading ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Auditing…</> : "Run Audit"}
              </Button>
              {error && (
                <span className="text-sm text-destructive flex items-center gap-1">
                  <AlertTriangle className="h-4 w-4" />{error}
                </span>
              )}
            </div>
          </CardContent>
        </Card>

        {report && counts && (
          <section className="space-y-6">
            <Card>
              <CardHeader className="flex flex-row items-start justify-between gap-4">
                <div>
                  <CardTitle className="text-2xl">{report.contractName || "Audit Results"}</CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">{report.summary}</p>
                </div>
                <Button variant="outline" onClick={() => generateAuditPdf(report)}>
                  <Download className="h-4 w-4 mr-2" />Download PDF
                </Button>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
                  <div className="col-span-2 md:col-span-1 rounded-lg border p-4">
                    <div className="text-3xl font-bold">{report.riskScore}</div>
                    <div className="text-xs text-muted-foreground">Risk score</div>
                  </div>
                  {(["critical", "high", "medium", "low", "informational"] as Severity[]).map((s) => (
                    <div key={s} className="rounded-lg border p-4">
                      <div className="text-2xl font-bold">{counts[s]}</div>
                      <div className="text-xs text-muted-foreground">{SEVERITY_STYLES[s].label}</div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {report.findings.length === 0 ? (
              <Card><CardContent className="py-12 text-center text-muted-foreground">No issues detected.</CardContent></Card>
            ) : (
              <div className="space-y-4">
                {report.findings.map((f) => {
                  const sty = SEVERITY_STYLES[f.severity];
                  return (
                    <Card key={f.id} className={`border-l-4 ${sty.border}`}>
                      <CardHeader>
                        <div className="flex items-start justify-between gap-3 flex-wrap">
                          <CardTitle className="text-lg">{f.title}</CardTitle>
                          <div className="flex items-center gap-2">
                            <Badge className={sty.badge}>{sty.label}</Badge>
                            <Badge variant="outline">{f.category}</Badge>
                            {f.lineNumbers.length > 0 && (
                              <Badge variant="outline">L{f.lineNumbers.join(", ")}</Badge>
                            )}
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div>
                          <h4 className="text-sm font-semibold mb-1">Description</h4>
                          <p className="text-sm text-muted-foreground">{f.description}</p>
                        </div>
                        <div>
                          <h4 className="text-sm font-semibold mb-1">Recommendation</h4>
                          <p className="text-sm text-muted-foreground">{f.recommendation}</p>
                        </div>
                        {f.codeSnippet && (
                          <div className="rounded-md overflow-hidden text-xs">
                            <SyntaxHighlighter language="solidity" style={oneDark} customStyle={{ margin: 0, fontSize: "0.8rem" }}>
                              {f.codeSnippet}
                            </SyntaxHighlighter>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </section>
        )}
      </main>

      <footer className="border-t mt-16">
        <div className="mx-auto max-w-6xl px-6 py-6 text-xs text-muted-foreground">
          AI-generated audits are a starting point, not a substitute for a professional manual review.
        </div>
      </footer>
    </div>
  );
}
