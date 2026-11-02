/** Minimal RFC 4180 CSV helpers for client-side report exports. */

export type CsvValue = string | number | boolean | null | undefined;

export function escapeCsvValue(value: CsvValue): string {
  if (value === null || value === undefined) return '';
  let text = String(value);
  // Prevent spreadsheet formula injection from user-entered text.
  if (/^[=+\-@\t\r]/.test(text) && typeof value === 'string') {
    text = `'${text}`;
  }
  return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

export function toCsv(headers: string[], rows: CsvValue[][]): string {
  return [headers, ...rows].map((row) => row.map(escapeCsvValue).join(',')).join('\r\n');
}

/** Trigger a browser download of CSV text. */
export function downloadCsv(filename: string, csv: string): void {
  // The BOM makes Excel open UTF-8 (e.g. Hindi product names) correctly.
  const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
