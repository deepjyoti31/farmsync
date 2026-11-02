import { describe, expect, it } from 'vitest';
import { escapeCsvValue, toCsv } from './csv';

describe('escapeCsvValue', () => {
  it('leaves simple values alone and blanks null/undefined', () => {
    expect(escapeCsvValue('Urea')).toBe('Urea');
    expect(escapeCsvValue(12.5)).toBe('12.5');
    expect(escapeCsvValue(null)).toBe('');
    expect(escapeCsvValue(undefined)).toBe('');
  });

  it('quotes values containing commas, quotes or newlines', () => {
    expect(escapeCsvValue('NPK 10,26,26')).toBe('"NPK 10,26,26"');
    expect(escapeCsvValue('say "hi"')).toBe('"say ""hi"""');
    expect(escapeCsvValue('line1\nline2')).toBe('"line1\nline2"');
  });

  it('neutralises spreadsheet formulas in text', () => {
    expect(escapeCsvValue('=HYPERLINK("x")')).toBe(`"'=HYPERLINK(""x"")"`);
    expect(escapeCsvValue(-5)).toBe('-5');
  });
});

describe('toCsv', () => {
  it('joins headers and rows with CRLF', () => {
    expect(toCsv(['Date', 'Qty'], [['2026-11-01', 5]])).toBe('Date,Qty\r\n2026-11-01,5');
  });
});
