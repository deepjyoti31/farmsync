import { AREA_UNITS } from './yieldAnalytics';

export { AREA_UNITS };

/** Soil types offered when adding or editing a field. */
export const SOIL_TYPES = ['Clay', 'Sandy', 'Loamy', 'Silty', 'Peaty', 'Chalky', 'Black', 'Red', 'Alluvial'] as const;

export interface Option {
  value: string;
  label: string;
}

/**
 * Options for a select, plus the record's current value when it is not one of
 * them (saved by an older version of the app), so editing never shows a blank
 * select or silently changes the stored value.
 */
export function withCurrent(options: readonly Option[], current: string | null | undefined): Option[] {
  const list = [...options];
  if (current && !list.some((o) => o.value === current)) list.push({ value: current, label: current.replace(/_/g, ' ') });
  return list;
}

export const SOIL_TYPE_OPTIONS: readonly Option[] = SOIL_TYPES.map((s) => ({ value: s, label: s }));
