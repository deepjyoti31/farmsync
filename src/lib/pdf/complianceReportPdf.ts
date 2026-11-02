import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format, parseISO } from 'date-fns';
import type { ComplianceReportData } from '@/lib/complianceReport';

export interface ReportFarm {
  name: string;
  village?: string | null;
  district?: string | null;
  state?: string | null;
  total_area?: number | null;
  area_unit?: string | null;
}

const GREEN: [number, number, number] = [22, 101, 52];
const fmtDate = (d: string | null) => (d ? format(parseISO(d), 'dd MMM yyyy') : '-');
const num = (n: number | string) => Number(n).toLocaleString('en-IN', { maximumFractionDigits: 2 });

// The built-in PDF fonts cover Latin text only. Characters outside that range
// (for example Devanagari product names) are replaced so the PDF stays legible.
const latin = (s: string | null | undefined) => (s ?? '').replace(/[^ -ÿ]/g, '?');

/**
 * Render the input and water-use record as a PDF and return it as a Blob.
 * Loaded on demand so jsPDF is not part of the main bundle.
 */
export function renderComplianceReportPdf(farm: ReportFarm, report: ComplianceReportData, generatedAt = new Date()): Blob {
  const doc = new jsPDF({ unit: 'pt', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 40;
  let y = margin;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.setTextColor(...GREEN);
  doc.text('Farm Input and Water Use Record', margin, y);
  y += 22;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(60);
  const location = [farm.village, farm.district, farm.state].filter(Boolean).join(', ');
  const lines = [
    `Farm: ${latin(farm.name)}`,
    location ? `Location: ${latin(location)}` : null,
    farm.total_area ? `Area: ${num(farm.total_area)} ${farm.area_unit ?? ''}` : null,
    `Period covered: ${fmtDate(report.periodStart)} to ${fmtDate(report.periodEnd)}`,
    `Generated: ${format(generatedAt, 'dd MMM yyyy, HH:mm')}`,
  ].filter((l): l is string => !!l);
  for (const line of lines) {
    doc.text(line, margin, y);
    y += 14;
  }
  y += 6;

  const section = (title: string) => {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(30);
    doc.text(title, margin, y);
    y += 8;
  };
  const after = () => {
    // jspdf-autotable records where the last table ended.
    y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 20;
  };
  const tableStyle = {
    margin: { left: margin, right: margin },
    styles: { fontSize: 8, cellPadding: 4 },
    headStyles: { fillColor: GREEN, textColor: 255 },
  };

  section('Summary of inputs');
  autoTable(doc, {
    ...tableStyle,
    startY: y,
    head: [['Input type', 'Entries', 'Total', 'Unit']],
    body: report.inputTotals.length
      ? report.inputTotals.map((t) => [latin(t.key), t.entries, num(t.quantity), latin(t.unit)])
      : [['No inputs recorded', '', '', '']],
  });
  after();

  section('Summary of water use');
  autoTable(doc, {
    ...tableStyle,
    startY: y,
    head: [['Source', 'Entries', 'Total', 'Unit']],
    body: report.waterTotals.length
      ? report.waterTotals.map((t) => [latin(t.key), t.entries, num(t.quantity), latin(t.unit)])
      : [['No water use recorded', '', '', '']],
  });
  after();

  section('Input log');
  autoTable(doc, {
    ...tableStyle,
    startY: y,
    head: [['Date', 'Field', 'Type', 'Product', 'Quantity', 'Method', 'Notes']],
    body: report.inputs.map((i) => [
      fmtDate(i.log_date),
      latin(i.fieldName),
      latin(i.type),
      latin(i.product_name),
      `${num(i.quantity)} ${latin(i.unit)}`,
      latin(i.method),
      latin(i.notes),
    ]),
    columnStyles: { 6: { cellWidth: 110 } },
  });
  after();

  section('Water use log');
  autoTable(doc, {
    ...tableStyle,
    startY: y,
    head: [['Date', 'Field', 'Source', 'Volume']],
    body: report.water.map((w) => [fmtDate(w.usage_date), latin(w.fieldName), latin(w.source), `${num(w.volume)} ${latin(w.unit)}`]),
  });
  after();

  // Declaration block, kept together on one page.
  if (y > doc.internal.pageSize.getHeight() - 110) {
    doc.addPage();
    y = margin;
  }
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(30);
  doc.text('I declare that the records above are complete and accurate.', margin, y);
  y += 40;
  doc.line(margin, y, margin + 200, y);
  doc.line(pageWidth - margin - 150, y, pageWidth - margin, y);
  y += 12;
  doc.setFontSize(8);
  doc.text('Signature of farm operator', margin, y);
  doc.text('Date', pageWidth - margin - 150, y);

  const pages = doc.getNumberOfPages();
  for (let p = 1; p <= pages; p++) {
    doc.setPage(p);
    doc.setFontSize(8);
    doc.setTextColor(120);
    const bottom = doc.internal.pageSize.getHeight() - 20;
    doc.text(`Generated with FarmSync`, margin, bottom);
    doc.text(`Page ${p} of ${pages}`, pageWidth - margin, bottom, { align: 'right' });
  }

  return doc.output('blob');
}
