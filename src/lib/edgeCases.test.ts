/**
 * Edge cases of the pure helpers in src/lib that the per-module tests do not
 * reach: missing values, ties, empty input and boundaries.
 */
import { describe, expect, it } from 'vitest';
import { attentionItems, cropProgress, fieldStage, formatMoney, monthTotals, rainAdvice } from './dashboard';
import { categoryTotals, compactRupees, monthlySeries, niceMax, totalOfType } from './financeSummary';
import { fieldShapes, outerRings } from './fieldShapes';
import { stockState, stockValue } from './inventoryStatus';
import { priceBoard, sparklinePoints, toMarketPrice, type MarketPrice } from './marketPrices';
import { groupTasksByDue, nextDueDate, sortTasks, type TaskLike } from './tasks';
import { plantingSegments, seasonWindow } from './cropTimeline';
import { getDateRange } from './dateRanges';
import { sortByService } from './maintenance';
import { toTelemetrySeries } from './telemetry';
import { avatarPath } from './avatar';
import { foldCategories } from './chartPalette';
import { animalLabel, upcomingHealthDue } from './livestockRecords';

const today = new Date(2026, 10, 5); // 5 Nov 2026

describe('money formatting', () => {
  it('puts the minus sign before the rupee symbol', () => {
    expect(formatMoney(124550)).toBe('₹1,24,550');
    expect(formatMoney(-2000)).toBe('-₹2,000');
    expect(formatMoney(-0.4)).toBe('₹0');
    expect(formatMoney(0)).toBe('₹0');
  });

  it('moves to the next compact unit when rounding reaches it', () => {
    expect(compactRupees(999)).toBe('₹999');
    expect(compactRupees(999.6)).toBe('₹1k');
    expect(compactRupees(99_999)).toBe('₹1L');
    expect(compactRupees(9_999_999)).toBe('₹1Cr');
    expect(compactRupees(25_000_000)).toBe('₹2.5Cr');
    expect(compactRupees(1_250)).toBe('₹1.3k');
  });

  it('handles negatives and tiny values', () => {
    expect(compactRupees(-50_000)).toBe('-₹50k');
    expect(compactRupees(-0.2)).toBe('₹0');
    expect(compactRupees(0.6)).toBe('₹1');
  });

  it('rounds axis maxima up to a nice step', () => {
    expect(niceMax(0.7)).toBeCloseTo(0.8, 9);
    expect(niceMax(95_000)).toBe(100_000);
    expect(niceMax(-5)).toBe(1);
    expect(niceMax(1000)).toBe(1000);
  });
});

describe('finance totals with messy rows', () => {
  const rows = [
    { amount: 'abc', type: 'income', transaction_date: '2026-11-01', category: null },
    { amount: '500', type: 'INCOME', transaction_date: '2026-11-02', category: null },
    { amount: 200, type: null, transaction_date: '2026-11-03', category: { name: null, type: 'expense' } },
    { amount: 50, type: 'transfer', transaction_date: '2026-11-04', category: null },
    { amount: 10, type: 'expense', transaction_date: '2020-01-01', category: null },
  ];

  it('treats unreadable amounts as zero and ignores unknown types', () => {
    expect(totalOfType(rows, 'income')).toBe(500);
    expect(totalOfType(rows, 'expense')).toBe(210);
    expect(monthTotals(rows)).toEqual({ income: 500, expense: 210, net: 290 });
  });

  it('leaves rows outside the months shown out of the series', () => {
    const series = monthlySeries(rows, 2, today);
    expect(series.map((m) => m.key)).toEqual(['2026-10', '2026-11']);
    expect(series[1]).toMatchObject({ income: 500, expense: 200 });
  });

  it('groups rows without a category name as uncategorised', () => {
    expect(categoryTotals(rows, 'expense')).toEqual([{ name: 'Uncategorised', total: 210 }]);
  });
});

describe('cropProgress and fieldStage edge cases', () => {
  it('counts a recorded harvest date as harvested whatever the status', () => {
    expect(cropProgress({ planting_date: '2026-08-01', expected_harvest_date: null, actual_harvest_date: '2026-10-30', status: null }, today).stage).toBe(
      'harvested',
    );
  });

  it('reads status case-insensitively and honours an explicit ready status', () => {
    expect(cropProgress({ planting_date: '2026-10-01', expected_harvest_date: null, status: 'READY' }, today).stage).toBe('ready');
    expect(cropProgress({ planting_date: '2026-10-01', expected_harvest_date: null, status: 'Planned' }, today).stage).toBe('planned');
  });

  it('shows a planting without an expected harvest as growing at 0%', () => {
    expect(cropProgress({ planting_date: '2026-10-01', expected_harvest_date: null, status: 'growing' }, today)).toMatchObject({
      stage: 'growing',
      percent: 0,
      totalDays: null,
      daysToHarvest: null,
    });
  });

  it('is ready once the expected harvest date has passed', () => {
    expect(cropProgress({ planting_date: '2026-01-01', expected_harvest_date: '2026-11-01', status: 'growing' }, today)).toMatchObject({
      stage: 'ready',
      percent: 100,
      daysToHarvest: -4,
    });
  });

  it('ignores finished plantings when describing a field', () => {
    expect(
      fieldStage(
        [
          { planting_date: '2026-01-01', expected_harvest_date: '2026-05-01', status: 'harvested' },
          { planting_date: '2026-12-01', expected_harvest_date: '2027-03-01', status: 'planned' },
        ],
        today,
      ),
    ).toBe('planned');
    expect(fieldStage([{ planting_date: '2026-01-01', expected_harvest_date: null, status: 'failed' }], today)).toBe('empty');
  });

  it('gives no rain advice without a forecast', () => {
    expect(rainAdvice(undefined)).toBeNull();
    expect(rainAdvice([{ date: '2026-11-06', precipitation_chance: 59 }])).toBeNull();
  });
});

describe('attentionItems wording and ordering', () => {
  it('describes stock, expiry and service in plain words', () => {
    const items = attentionItems(
      {
        stock: [
          { name: 'Urea', quantity: 0, minimum_stock: null, unit: null, expiry_date: null },
          { name: 'DAP', quantity: 3, minimum_stock: 5, unit: 'bags', expiry_date: '2026-11-06' },
          { name: 'Seed', quantity: 10, minimum_stock: 5, unit: 'kg', expiry_date: '2026-11-01' },
          { name: 'Lime', quantity: 10, minimum_stock: null, unit: 'kg', expiry_date: '2026-11-05' },
        ],
        equipment: [
          { name: 'Tractor', next_maintenance_date: '2026-11-04' },
          { name: 'Pump', next_maintenance_date: '2026-11-15' },
          { name: 'Tiller', next_maintenance_date: null },
          { name: 'Sprayer', next_maintenance_date: '2027-01-01' },
        ],
      },
      today,
    );
    const titles = items.map((i) => i.title);
    // Equally urgent items keep their input order: stock before equipment.
    expect(titles).toEqual([
      'Seed has expired',
      'Urea is out of stock',
      'Tractor is overdue for service',
      'Lime expires today',
      'DAP expires in 1 day',
      'DAP: 3 bags left',
      'Pump is due for service',
    ]);
    expect(items.find((i) => i.title.startsWith('Urea'))!.detail).toBe('No stock left');
    expect(items.find((i) => i.title.startsWith('Tractor'))).toMatchObject({ tone: 'warning', detail: 'Service 1 day late' });
    expect(items.find((i) => i.title.startsWith('Pump'))).toMatchObject({ tone: 'info', detail: 'Service in 10 days' });
  });

  it('handles empty input', () => {
    expect(attentionItems({}, today)).toEqual([]);
  });
});

describe('outerRings and fieldShapes edge cases', () => {
  it('reads feature collections and multipolygons, and skips junk', () => {
    const ring = [[0, 0], [1, 0], [1, 1], [0, 0]];
    expect(outerRings({ type: 'FeatureCollection', features: [{ type: 'Feature', geometry: { type: 'Polygon', coordinates: [ring] } }] })).toEqual([ring]);
    expect(outerRings({ type: 'FeatureCollection' })).toEqual([]);
    expect(outerRings({ type: 'MultiPolygon', coordinates: [[ring], []] })).toEqual([ring]);
    expect(outerRings({ type: 'MultiPolygon' })).toEqual([]);
    expect(outerRings({ type: 'Polygon', coordinates: 'nope' })).toEqual([]);
    expect(outerRings({ type: 'Point', coordinates: [0, 0] })).toEqual([]);
    expect(outerRings(null)).toEqual([]);
    expect(outerRings('Polygon')).toEqual([]);
  });

  it('draws nothing when no field has a usable boundary', () => {
    expect(fieldShapes([{ id: 'a', boundaries: null }, { id: 'b', boundaries: { type: 'Polygon', coordinates: [[[0, 0], [1, 1]]] } }])).toEqual([]);
  });

  it('copes with a degenerate (zero-width) shape', () => {
    const [shape] = fieldShapes([{ id: 'a', boundaries: { type: 'Polygon', coordinates: [[[5, 5], [5, 5], [5, 5]]] } }], 100, 100, 0);
    expect(Number.isFinite(shape.cx)).toBe(true);
    expect(Number.isFinite(shape.cy)).toBe(true);
  });
});

describe('stock edge cases', () => {
  it('fills the bar fully without a reorder level and empties it when out', () => {
    expect(stockState({ quantity: 4, minimum_stock: null, expiry_date: null }, today).fill).toBe(100);
    expect(stockState({ quantity: 0, minimum_stock: 0, expiry_date: null }, today).fill).toBe(0);
    expect(stockState({ quantity: 40, minimum_stock: 5, expiry_date: null }, today).fill).toBe(100);
  });

  it('values only priced items', () => {
    expect(stockValue([{ quantity: 2, minimum_stock: null, expiry_date: null, purchase_price: 50 }, { quantity: 5, minimum_stock: null, expiry_date: null }])).toBe(100);
  });
});

describe('market price edge cases', () => {
  const price = (overrides: Partial<MarketPrice>): MarketPrice => ({
    commodity: 'Rice',
    variety: '',
    market: 'Guwahati',
    state: 'Assam',
    district: 'Kamrup',
    min_price: 2000,
    max_price: 2400,
    modal_price: 2200,
    date: '2026-11-05',
    ...overrides,
  });

  it('fills missing row fields with blanks and the modal price', () => {
    const p = toMarketPrice({
      crop_name: 'Jute',
      variety: null,
      market_location: null,
      state: null,
      district: null,
      min_price: null,
      max_price: null,
      modal_price: null,
      price_per_unit: 5000,
      price_date: '2026-11-05',
    } as never);
    expect(p).toMatchObject({ commodity: 'Jute', market: '', variety: '', min_price: 5000, max_price: 5000, modal_price: 5000 });
  });

  it('sorts pinned crops first, then by name, and has no change for one day of data', () => {
    const rows = priceBoard([price({ commodity: 'Wheat' }), price({ commodity: 'Maize' }), price({ commodity: 'Rice' })], ['rice']);
    expect(rows.map((r) => r.commodity)).toEqual(['Rice', 'Maize', 'Wheat']);
    expect(rows[0].changePercent).toBeNull();
  });

  it('places a single sparkline point in the middle', () => {
    expect(sparklinePoints([5], 96, 28)).toBe('48.0,14.0');
    expect(sparklinePoints([])).toBe('');
  });
});

describe('task edge cases', () => {
  const t = (overrides: Partial<TaskLike>): TaskLike => ({ id: 'x', title: 'B', due_date: '2026-11-05', status: 'pending', priority: 'medium', ...overrides });

  it('does not repeat an unknown recurrence', () => {
    expect(nextDueDate('2026-11-05', 'hourly')).toBeNull();
  });

  it('breaks ties by priority, then title, treating unknown priorities as medium', () => {
    const sorted = sortTasks([
      t({ id: '1', title: 'Zed', priority: null }),
      t({ id: '2', title: 'Alpha', priority: 'urgent' }),
      t({ id: '3', title: 'Mid', priority: 'low' }),
      t({ id: '4', title: 'Top', priority: 'high' }),
    ]);
    expect(sorted.map((x) => x.id)).toEqual(['4', '2', '1', '3']);
  });

  it('puts undated tasks last among open and done tasks', () => {
    const sorted = sortTasks([t({ id: 'a', due_date: null }), t({ id: 'b' }), t({ id: 'c', status: 'completed', due_date: null }), t({ id: 'd', status: 'completed' })]);
    expect(sorted.map((x) => x.id)).toEqual(['b', 'a', 'd', 'c']);
  });

  it('groups tasks due later than a week', () => {
    expect(groupTasksByDue([t({ due_date: '2026-12-25' })], today).map((g) => g.key)).toEqual(['later']);
  });
});

describe('season timeline edge cases', () => {
  it('draws a harvested planting without a harvest date up to its expected date', () => {
    const p = { planting_date: '2026-09-01', expected_harvest_date: '2026-10-15', status: 'harvested', actual_harvest_date: null };
    // Finished plantings do not widen the window, so open it with a live one.
    const win = seasonWindow([p, { planting_date: '2026-09-01', expected_harvest_date: '2027-01-15', status: 'growing' }], today);
    const segs = plantingSegments(p, win, today);
    expect(segs).toHaveLength(1);
    expect(segs[0].kind).toBe('done');
    expect(segs[0].left).toBe(0);
    expect(segs[0].width).toBeCloseTo((44 / win.days) * 100, 6);
  });

  it('draws a harvested planting without any dates up to today', () => {
    const p = { planting_date: '2026-10-01', expected_harvest_date: null, status: 'failed', actual_harvest_date: null };
    const win = seasonWindow([p], today);
    expect(plantingSegments(p, win, today).map((s) => s.kind)).toEqual(['done']);
  });

  it('draws a growing planting without an expected harvest up to today only', () => {
    const p = { planting_date: '2026-10-01', expected_harvest_date: null, status: 'growing' };
    const win = seasonWindow([p], today);
    expect(plantingSegments(p, win, today).map((s) => s.kind)).toEqual(['grown']);
  });
});

describe('misc helpers', () => {
  it('covers last year whatever the current date', () => {
    expect(getDateRange('last-year', today)).toEqual({ startDate: '2025-01-01', endDate: '2025-12-31' });
    expect(getDateRange('unknown', today)).toEqual({ startDate: '2026-01-01', endDate: '2026-11-05' });
  });

  it('orders machines with the same date by name', () => {
    const sorted = sortByService(
      [
        { name: 'Pump', next_maintenance_date: '2026-11-20' },
        { name: 'Baler', next_maintenance_date: '2026-11-20' },
        { name: 'Auger', next_maintenance_date: null },
      ],
      today,
    );
    expect(sorted.map((m) => m.name)).toEqual(['Baler', 'Pump', 'Auger']);
  });

  it('ignores telemetry payloads that are not objects', () => {
    const { points, metrics } = toTelemetrySeries([
      { timestamp: '2026-11-05T10:00:00Z', data: [1, 2] },
      { timestamp: 'not a date', data: null },
    ]);
    expect(metrics).toEqual([]);
    expect(points[1].time).toBe('not a date');
  });

  it('names avatars of unknown types generically', () => {
    expect(avatarPath('u1', 'image/gif', new Date(0))).toBe('u1/avatar-0.img');
  });

  it('folds small categories into Other, counting unreadable values as zero', () => {
    const rows = ['a', 'b', 'c', 'd', 'e', 'f'].map((name, i) => ({ name, value: i === 5 ? ('x' as unknown as number) : 10 - i }));
    const folded = foldCategories(rows, 'value', 'name');
    expect(folded).toHaveLength(5);
    expect(folded[4]).toMatchObject({ name: 'Other', value: 6 });
  });

  it('labels a missing animal as the whole herd and drops old health reminders', () => {
    expect(animalLabel(null)).toBe('Whole herd / flock');
    expect(animalLabel({ tag_id: null, breed: null, livestock_type: null })).toBe('Animal');
    const due = upcomingHealthDue(
      [
        { id: '1', livestock_id: 'a', record_type: 'vaccination', record_date: '2026-10-01', next_due_date: '2026-11-06' },
        { id: '2', livestock_id: 'a', record_type: 'vaccination', record_date: '2026-09-01', next_due_date: '2026-11-01' },
      ],
      today,
    );
    expect(due.map((d) => d.record.id)).toEqual(['1']);
  });
});
