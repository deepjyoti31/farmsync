/**
 * What changing a planting's status writes to the database, kept apart from
 * the form so the rules can be tested.
 */

export interface CropStatusChangeInput {
  currentStatus: string;
  status: string;
  /** Harvested quantity as typed; blank means "not recorded". */
  harvestQuantity: string;
  harvestUnit: string;
  /** yyyy-MM-dd */
  today: string;
}

export interface CropStatusUpdate {
  status: string;
  actual_harvest_date?: string | null;
  yield_amount?: number;
  yield_unit?: string;
}

export type CropStatusChange =
  | { ok: false; reason: 'unchanged' | 'invalid_quantity' }
  | { ok: true; update: CropStatusUpdate; harvest: { quantity: number; unit: string; harvest_date: string } | null };

export function planCropStatusChange(input: CropStatusChangeInput): CropStatusChange {
  const { currentStatus, status, harvestQuantity, harvestUnit, today } = input;
  if (status === currentStatus) return { ok: false, reason: 'unchanged' };

  const harvesting = status === 'harvested';
  const quantityText = harvestQuantity.trim();
  const quantity = Number(quantityText);
  const recordHarvest = harvesting && quantityText !== '';
  if (recordHarvest && (!Number.isFinite(quantity) || quantity <= 0)) return { ok: false, reason: 'invalid_quantity' };

  const update: CropStatusUpdate = { status };
  if (harvesting) update.actual_harvest_date = today;
  // A recorded harvest date marks a planting as finished everywhere (dashboard,
  // season timeline, calendar), so undoing a harvest must clear it.
  else if (currentStatus === 'harvested') update.actual_harvest_date = null;
  if (recordHarvest) {
    update.yield_amount = quantity;
    update.yield_unit = harvestUnit;
  }

  return {
    ok: true,
    update,
    harvest: recordHarvest ? { quantity, unit: harvestUnit, harvest_date: today } : null,
  };
}
