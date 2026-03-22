import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import type { JobCostEntry } from "@/lib/api";
import { formatCurrency, formatDate } from "@/lib/formatters";

const SOURCE_LABEL: Record<string, string> = {
  OBRA: "Gastos da obra (materiais e serviços)",
  LEGAL: "Custos legais",
  LABOR: "Mão de obra",
};

function num(n: unknown): number {
  const x = typeof n === "number" ? n : Number(n);
  return Number.isFinite(x) ? x : 0;
}

function truncate(s: string, max: number): string {
  if (s.length <= max) return s;
  return `${s.slice(0, max - 1)}…`;
}

type JsPdfWithTable = jsPDF & { lastAutoTable?: { finalY: number } };

/** Exporta todos os lançamentos (obras + legais + mão de obra) agrupados por fonte e categoria. */
export function exportJobCostsToPdf(opts: {
  obraTitle: string;
  obraAddress?: string;
  entries: JobCostEntry[];
}): void {
  const { obraTitle, obraAddress, entries } = opts;
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  let y = 16;

  doc.setFontSize(15);
  doc.setFont("helvetica", "bold");
  doc.text("Relatório de gastos", 14, y);
  y += 8;

  doc.setFontSize(12);
  doc.text(truncate(obraTitle, 90), 14, y);
  y += 6;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(70);
  if (obraAddress) {
    doc.text(truncate(obraAddress, 120), 14, y);
    y += 5;
  }
  doc.text(`Gerado em ${formatDate(new Date().toISOString())}`, 14, y);
  doc.setTextColor(0);
  y += 10;

  if (!entries.length) {
    doc.setFontSize(10);
    doc.text("Nenhum lançamento registado nesta obra.", 14, y);
    const safe = obraTitle.replace(/[^\w\s\-]/g, "").trim().slice(0, 40) || "obra";
    doc.save(`gastos-${safe}.pdf`);
    return;
  }

  const sources = ["OBRA", "LEGAL", "LABOR"] as const;
  let grandTotal = 0;

  for (const source of sources) {
    const items = entries.filter((e) => e.source === source);
    if (!items.length) continue;

    grandTotal += items.reduce((s, i) => s + num(i.totalAmount), 0);

    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(20);
    doc.text(SOURCE_LABEL[source] ?? source, 14, y);
    y += 6;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(0);

    const categories = [...new Set(items.map((i) => (i.category || "Sem categoria").trim() || "Sem categoria"))].sort((a, b) =>
      a.localeCompare(b, "pt-BR"),
    );

    for (const cat of categories) {
      const catItems = items
        .filter((i) => ((i.category || "Sem categoria").trim() || "Sem categoria") === cat)
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

      const catSum = catItems.reduce((s, i) => s + num(i.totalAmount), 0);

      if (y > 255) {
        doc.addPage();
        y = 16;
      }

      doc.setFont("helvetica", "bold");
      doc.setFontSize(9.5);
      doc.text(`${cat}  ·  ${formatCurrency(catSum)}`, 14, y);
      y += 4;
      doc.setFont("helvetica", "normal");

      const body: string[][] = catItems.map((row) => [
        formatDate(row.date),
        truncate(row.description, 55),
        truncate(String(row.costType ?? "—"), 14),
        String(row.payer ?? "—"),
        truncate(String(row.paymentMethod ?? "—"), 12),
        truncate(String(row.supplier ?? "—"), 22),
        formatCurrency(num(row.totalAmount)),
      ]);

      autoTable(doc, {
        startY: y,
        head: [["Data", "Descrição", "Tipo", "Pagador", "Pag.", "Fornecedor", "Valor"]],
        body,
        styles: { fontSize: 7, cellPadding: 1.2 },
        headStyles: { fillColor: [55, 55, 55], fontSize: 7 },
        columnStyles: {
          0: { cellWidth: 22 },
          1: { cellWidth: 58 },
          2: { cellWidth: 16 },
          3: { cellWidth: 18 },
          4: { cellWidth: 16 },
          5: { cellWidth: 28 },
          6: { cellWidth: 22, halign: "right" },
        },
        margin: { left: 14, right: 14 },
      });

      const d = doc as JsPdfWithTable;
      y = (d.lastAutoTable?.finalY ?? y) + 8;
    }

    y += 4;
  }

  if (y > 270) {
    doc.addPage();
    y = 20;
  }
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text(`Total geral: ${formatCurrency(grandTotal)}`, 14, y);

  const safe = obraTitle.replace(/[^\w\s\-]/g, "").trim().slice(0, 40) || "obra";
  doc.save(`gastos-${safe}.pdf`);
}
