/**
 * Chart colours for the Field Ledger theme.
 *
 * The categorical order passes colour-blind separation for every pair, which
 * pie and donut charts need because every slice touches every other. A fifth
 * category would fail, so anything past four folds into "Other".
 */
export const CHART = {
  income: '#2E7D4F',
  expense: '#E39B34',
  /** A chart with one series */
  single: '#2E7D4F',
  /** The folded "Other" slice, and neutral context marks */
  other: '#A3ACA5',
  grid: '#ECEFE8',
  axis: '#4F5E53',
  water: '#2a78d6',
} as const;

export const CATEGORICAL = ['#2E7D4F', '#E39B34', '#2a78d6', '#e87ba4'] as const;

/** Colour for the i-th category, in fixed order. Never cycles: index 4 and beyond are "Other". */
export const categoryColor = (i: number) => CATEGORICAL[i] ?? CHART.other;

/** Shared recharts props for axes and grid so every chart reads the same. */
export const AXIS_PROPS = {
  stroke: CHART.axis,
  tick: { fill: CHART.axis, fontSize: 12, fontFamily: 'IBM Plex Mono, monospace' },
  tickLine: false,
  axisLine: { stroke: '#A9B5AB' },
} as const;

export const GRID_PROPS = { stroke: CHART.grid, vertical: false } as const;

/**
 * Keep the `max` largest rows and add the rest together as one "Other" row,
 * so a categorical chart never needs more colours than the palette has.
 */
export function foldCategories<T extends Record<string, unknown>>(rows: T[], valueKey: keyof T, nameKey: keyof T, max = CATEGORICAL.length): T[] {
  const sorted = [...rows].sort((a, b) => Number(b[valueKey]) - Number(a[valueKey]));
  if (sorted.length <= max) return sorted;
  const kept = sorted.slice(0, max);
  const rest = sorted.slice(max).reduce((s, r) => s + (Number(r[valueKey]) || 0), 0);
  return [...kept, { ...sorted[max], [nameKey]: 'Other', [valueKey]: rest }];
}

/** Dark tooltip that matches the app's tooltip style. Spread onto recharts' <Tooltip>. */
export const TOOLTIP_PROPS = {
  contentStyle: { background: '#11261A', border: 0, borderRadius: 10, padding: '8px 12px', fontSize: 13, boxShadow: '0 6px 18px rgba(17,38,26,0.25)' },
  labelStyle: { color: '#FFFFFF', fontWeight: 600, marginBottom: 4 },
  itemStyle: { color: '#FFFFFF', padding: 0 },
  cursor: { fill: 'rgba(17,38,26,0.05)' },
} as const;
