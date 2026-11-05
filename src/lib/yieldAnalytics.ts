/**
 * Helpers for turning harvest records into per-crop yield figures.
 * All yields are normalised to tonnes per hectare so fields of different sizes
 * and harvests recorded in different units can be compared.
 */

/** Conversion of supported harvest units to tonnes. */
const TONNES_PER_UNIT: Record<string, number> = {
  kg: 0.001,
  kgs: 0.001,
  quintal: 0.1,
  quintals: 0.1,
  tonne: 1,
  tonnes: 1,
  t: 1,
};

/**
 * Conversion of supported area units to hectares.
 * Bigha varies by region; 0.25 ha is the common value in north India
 * (Punjab, Haryana, Uttar Pradesh). Adjust here if your region differs.
 * Square metres and feet are accepted because older versions of the field
 * edit form could save them.
 */
const HECTARES_PER_UNIT: Record<string, number> = {
  hectares: 1,
  hectare: 1,
  ha: 1,
  acres: 0.404686,
  acre: 0.404686,
  bigha: 0.25,
  bighas: 0.25,
  sq_meters: 0.0001,
  square_meters: 0.0001,
  sq_feet: 0.0000092903,
};

export const HARVEST_UNITS = ['kg', 'quintal', 'tonnes'] as const;

/** Area units offered when adding or editing a farm or field. */
export const AREA_UNITS = [
  { value: 'acres', label: 'Acres' },
  { value: 'hectares', label: 'Hectares' },
  { value: 'bigha', label: 'Bigha' },
] as const;

const factorOf = (table: Record<string, number>, unit: string | null | undefined): number | undefined =>
  unit ? table[unit.trim().toLowerCase()] : undefined;

export function toTonnes(quantity: number, unit: string | null | undefined): number | null {
  const factor = factorOf(TONNES_PER_UNIT, unit);
  return factor === undefined ? null : quantity * factor;
}

export function toHectares(area: number, unit: string | null | undefined): number | null {
  const factor = factorOf(HECTARES_PER_UNIT, unit);
  return factor === undefined ? null : area * factor;
}

/** Area in `unit` for a value in hectares, or null for an unknown unit. */
export function fromHectares(hectares: number, unit: string | null | undefined): number | null {
  const factor = factorOf(HECTARES_PER_UNIT, unit);
  return factor === undefined ? null : hectares / factor;
}

/**
 * Total area of several plots expressed in `unit`, converting each plot from
 * its own unit first, so a field in acres and one in bigha add up correctly.
 * Plots in an unknown unit are left out. Returns null when `unit` is unknown.
 */
export function totalAreaIn(
  plots: { area: number | string | null; area_unit: string | null | undefined }[],
  unit: string | null | undefined,
): number | null {
  if (factorOf(HECTARES_PER_UNIT, unit) === undefined) return null;
  const hectares = plots.reduce((sum, p) => sum + (toHectares(Number(p.area) || 0, p.area_unit) ?? 0), 0);
  return fromHectares(hectares, unit);
}

export interface HarvestRecord {
  cropName: string;
  quantity: number;
  unit: string;
  fieldCropId: string;
  fieldArea: number;
  fieldAreaUnit: string;
  revenue?: number | null;
}

export interface CropYield {
  name: string;
  /** Total harvested, in tonnes. */
  totalTonnes: number;
  /** Tonnes per hectare across all plantings of this crop. */
  yieldPerHectare: number;
  revenue: number;
}

/**
 * Aggregate harvests by crop. Each planting's field area is counted once even
 * if it was harvested several times. Records with unknown units are skipped.
 */
export function aggregateYieldByCrop(records: HarvestRecord[]): CropYield[] {
  const crops = new Map<string, { tonnes: number; revenue: number; plantings: Map<string, number> }>();

  for (const r of records) {
    const tonnes = toTonnes(Number(r.quantity), r.unit);
    const hectares = toHectares(Number(r.fieldArea), r.fieldAreaUnit);
    if (tonnes === null || hectares === null || hectares <= 0) continue;

    const entry = crops.get(r.cropName) ?? { tonnes: 0, revenue: 0, plantings: new Map() };
    entry.tonnes += tonnes;
    entry.revenue += Number(r.revenue ?? 0);
    entry.plantings.set(r.fieldCropId, hectares);
    crops.set(r.cropName, entry);
  }

  return Array.from(crops.entries())
    .map(([name, e]) => {
      const hectares = Array.from(e.plantings.values()).reduce((a, b) => a + b, 0);
      return {
        name,
        totalTonnes: round(e.tonnes),
        yieldPerHectare: round(e.tonnes / hectares),
        revenue: round(e.revenue),
      };
    })
    .sort((a, b) => b.yieldPerHectare - a.yieldPerHectare);
}

function round(n: number): number {
  return Math.round(n * 100) / 100;
}
