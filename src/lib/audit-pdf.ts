import { jsPDF } from "jspdf";
import type { AuditReport, Severity } from "./audit-types";

const SEV_COLORS: Record<Severity, [number, number, number]> = {
  critical: [185, 28, 28],
  high: [194, 65, 12],
  medium: [161, 98, 7],
  low: [29, 78, 216],
  informational: [82, 82, 91],
};

export function generateAuditPdf(report: AuditReport) {
  const doc = new jsPDF({ unit: "pt", format: "letter" });
  const margin = 48;
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const usableWidth = pageWidth - margin * 2;
  let y = margin;

  const ensure = (h: number) => {
    if (y + h > pageHeight - margin) {
      doc.addPage();
      y = margin;
    }
  };

  doc.setFont("helvetica", "bold");
  doc.setFontSize(22);
  doc.text("AgentAudit Report", margin, y);
  y += 28;

  doc.setFontSize(12);
  doc.setFont("helvetica", "normal");
  doc.text(`Contract: ${report.contractName || "Unnamed"}`, margin, y);
  y += 16;
  doc.text(`Risk Score: ${report.riskScore}/100`, margin, y);
  y += 16;
  doc.text(`Findings: ${report.findings.length}`, margin, y);
  y += 24;

  doc.setFont("helvetica", "bold");
  doc.text("Summary", margin, y);
  y += 14;
  doc.setFont("helvetica", "normal");
  const summaryLines = doc.splitTextToSize(report.summary || "—", usableWidth);
  ensure(summaryLines.length * 14);
  doc.text(summaryLines, margin, y);
  y += summaryLines.length * 14 + 16;

  report.findings.forEach((f, i) => {
    ensure(80);
    const [r, g, b] = SEV_COLORS[f.severity] ?? [0, 0, 0];
    doc.setFillColor(r, g, b);
    doc.rect(margin, y - 10, 6, 14, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(13);
    doc.setTextColor(0, 0, 0);
    doc.text(`${i + 1}. ${f.title}`, margin + 14, y);
    y += 16;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(r, g, b);
    doc.text(`${f.severity.toUpperCase()} • ${f.category} • Lines: ${f.lineNumbers.join(", ") || "—"}`, margin + 14, y);
    doc.setTextColor(0, 0, 0);
    y += 16;

    const writeBlock = (label: string, text: string) => {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      const lines = doc.splitTextToSize(text || "—", usableWidth - 14);
      ensure(14 + lines.length * 12 + 6);
      doc.text(label, margin + 14, y);
      y += 12;
      doc.setFont("helvetica", "normal");
      doc.text(lines, margin + 14, y);
      y += lines.length * 12 + 6;
    };

    writeBlock("Description", f.description);
    writeBlock("Recommendation", f.recommendation);

    if (f.codeSnippet) {
      doc.setFont("courier", "normal");
      doc.setFontSize(9);
      const lines = doc.splitTextToSize(f.codeSnippet, usableWidth - 14);
      ensure(lines.length * 11 + 8);
      doc.setFillColor(245, 245, 245);
      doc.rect(margin + 14, y - 9, usableWidth - 14, lines.length * 11 + 6, "F");
      doc.text(lines, margin + 18, y);
      y += lines.length * 11 + 12;
    }
    y += 8;
  });

  doc.save(`agentaudit-${(report.contractName || "report").replace(/\W+/g, "-")}.pdf`);
}