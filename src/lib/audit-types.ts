export type Severity = "critical" | "high" | "medium" | "low" | "informational";

export interface Finding {
  id: string;
  title: string;
  severity: Severity;
  category: string;
  lineNumbers: number[];
  description: string;
  recommendation: string;
  codeSnippet: string;
}

export interface AuditReport {
  summary: string;
  riskScore: number; // 0-100
  contractName: string;
  findings: Finding[];
  source: string;
}