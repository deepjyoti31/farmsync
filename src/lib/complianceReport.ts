/**
 * Builds the data for the audit-ready input and water-use report.
 * Kept free of any PDF code so the numbers can be unit tested.
 */

export interface InputLog {
  log_date: string;
  type: string;
  product_name: string;
  quantity: number | string;
  unit: string;
  method?: string | null;
  notes?: string | null;
  fieldName?: string | null;
}

export interface WaterLog {
  usage_date: string;
  volume: number | string;
  unit: string;
  source?: string | null;
  fieldName?: string | null;
}

export interface Total {
  key: string;
  unit: string;
  quantity: number;
  entries: number;
}

export interface ComplianceReportData {
  periodStart: string | null;
  periodEnd: string | null;
  inputs: InputLog[];
  water: WaterLog[];
  inputTotals: Total[];
  waterTotals: Total[];
}

/** Sum quantities grouped by key and unit (different units are never added together). */
export function totalsBy<T>(rows: T[], key: (r: T) => string, unit: (r: T) => string, qty: (r: T) => number): Total[] {
  const map = new Map<string, Total>();
  for (const r of rows) {
    const k = key(r) || 'unspecified';
    const u = unit(r);
    const id = `${k}\u0000${u}`;
    const t = map.get(id) ?? { key: k, unit: u, quantity: 0, entries: 0 };
    t.quantity = Math.round((t.quantity + qty(r)) * 100) / 100;
    t.entries += 1;
    map.set(id, t);
  }
  return Array.from(map.values()).sort((a, b) => a.key.localeCompare(b.key) || a.unit.localeCompare(b.unit));
}

export function buildComplianceReport(inputs: InputLog[], water: WaterLog[]): ComplianceReportData {
  const sortedInputs = [...inputs].sort((a, b) => a.log_date.localeCompare(b.log_date));
  const sortedWater = [...water].sort((a, b) => a.usage_date.localeCompare(b.usage_date));
  const dates = [...sortedInputs.map((i) => i.log_date), ...sortedWater.map((w) => w.usage_date)].sort();

  return {
    periodStart: dates[0] ?? null,
    periodEnd: dates[dates.length - 1] ?? null,
    inputs: sortedInputs,
    water: sortedWater,
    inputTotals: totalsBy(sortedInputs, (i) => i.type, (i) => i.unit, (i) => Number(i.quantity)),
    waterTotals: totalsBy(sortedWater, (w) => w.source ?? '', (w) => w.unit, (w) => Number(w.volume)),
  };
}
