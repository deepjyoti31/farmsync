import { describe, expect, it } from 'vitest';
import { buildComplianceReport } from '@/lib/complianceReport';
import { renderComplianceReportPdf } from './complianceReportPdf';

describe('renderComplianceReportPdf', () => {
  it('produces a PDF containing the farm and log details', async () => {
    const report = buildComplianceReport(
      [
        { log_date: '2026-06-01', type: 'fertilizer', product_name: 'Vermicompost', quantity: 200, unit: 'kg', fieldName: 'North' },
        { log_date: '2026-06-03', type: 'pesticide', product_name: 'नीम तेल', quantity: 2, unit: 'litres' },
      ],
      [{ usage_date: '2026-06-02', volume: 12000, unit: 'litres', source: 'well', fieldName: 'North' }],
    );

    const blob = renderComplianceReportPdf(
      { name: 'River Farm', village: 'Rampur', district: 'Nashik', state: 'Maharashtra', total_area: 4.5, area_unit: 'acres' },
      report,
      new Date(2026, 10, 2, 10, 0),
    );
    const text = Buffer.from(await blob.arrayBuffer()).toString('latin1');

    expect(text.startsWith('%PDF-')).toBe(true);
    expect(text).toContain('River Farm');
    expect(text).toContain('Vermicompost');
    expect(text).toContain('Rampur, Nashik, Maharashtra');
    expect(text).toContain('01 Jun 2026 to 03 Jun 2026');
    expect(text).toContain('Page 1 of');
  });
});
