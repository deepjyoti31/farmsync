/**
 * Helpers for turning harvest records into per-crop yield figures.
 * All yields are normalised to tonnes per hectare so fields of different sizes
 * and harvests recorded in different units can be compared.
 */

/** Conversion of supported harvest units to tonnes. */
const TONNES_PER_UNIT: Record<string, number> = {
  kg: 0.001,
  quintal: 0.1,
  tonnes: 1,
  t: 1,
};

/**
 * Conversion of supported area units to hectares.
 * Bigha varies by region; 0.25 ha is the common value in north India
 * (Punjab, Haryana, Uttar Pradesh). Adjust here if your region differs.
 */
const HECTARES_PER_UNIT: Record<string, number> = {
  hectares: 1,
  ha: 1,
  acres: 0.404686,
  bigha: 0.25,
};

export const HARVEST_UNITS = ['kg', 'quintal', 'tonnes'] as const;

export function toTonnes(quantity: number, unit: string): number | null {
  const factor = TONNES_PER_UNIT[unit.toLowerCase()];
  return factor === undefined ? null : quantity * factor;
}

export function toHectares(area: number, unit: string): number | null {
  const factor = HECTARES_PER_UNIT[unit.toLowerCase()];
  return factor === undefined ? null : area * factor;
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
