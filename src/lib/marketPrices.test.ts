import { describe, expect, it } from 'vitest';
import {
  priceBoard,
  sparklinePoints,
  ALL_COMMODITIES,
  ALL_STATES,
  filterMarketPrices,
  summarizeCommodities,
  toMarketPrice,
  type MarketPrice,
} from './marketPrices';

const price = (overrides: Partial<MarketPrice>): MarketPrice => ({
  commodity: 'Onion',
  variety: 'Red',
  market: 'Lasalgaon',
  state: 'Maharashtra',
  district: 'Nashik',
  min_price: 1000,
  max_price: 2000,
  modal_price: 1500,
  date: '2026-11-01',
  ...overrides,
});

describe('toMarketPrice', () => {
  it('falls back to price_per_unit when detailed prices are missing', () => {
    const row = {
      id: '1',
      crop_name: 'Rice',
      price_per_unit: 22.5,
      unit: 'kg',
      market_location: 'Exchange',
      price_date: '2026-11-01',
      source: null,
      created_at: '',
      updated_at: '',
      variety: null,
      state: null,
      district: null,
      min_price: null,
      max_price: null,
      modal_price: null,
    };
    expect(toMarketPrice(row)).toMatchObject({
      commodity: 'Rice',
      market: 'Exchange',
      min_price: 22.5,
      max_price: 22.5,
      modal_price: 22.5,
      date: '2026-11-01',
    });
  });
});

describe('filterMarketPrices', () => {
  const data = [
    price({}),
    price({ commodity: 'Wheat', market: 'Khanna', state: 'Punjab' }),
    price({ commodity: 'Potato', market: 'Indore', state: 'Madhya Pradesh' }),
  ];

  it('treats the "all" select values as no filter', () => {
    expect(filterMarketPrices(data, { commodity: ALL_COMMODITIES, state: ALL_STATES })).toHaveLength(3);
  });

  it('filters by commodity, state and search text', () => {
    expect(filterMarketPrices(data, { commodity: 'Wheat' })).toHaveLength(1);
    expect(filterMarketPrices(data, { state: 'Punjab' })[0].commodity).toBe('Wheat');
    expect(filterMarketPrices(data, { search: 'indo' })[0].commodity).toBe('Potato');
  });
});

describe('summarizeCommodities', () => {
  it('reports the trend between the two most recent dates', () => {
    const [onion] = summarizeCommodities([
      price({ date: '2026-10-31', modal_price: 1000 }),
      price({ date: '2026-11-01', modal_price: 1100 }),
    ]);
    expect(onion.avgPrice).toBe(1100);
    expect(onion.trendPercent).toBeCloseTo(10);
  });

  it('returns a null trend with only one date of data', () => {
    expect(summarizeCommodities([price({})])[0].trendPercent).toBeNull();
  });

  it('limits the number of commodities', () => {
    const many = ['A', 'B', 'C', 'D', 'E'].map((c) => price({ commodity: c }));
    expect(summarizeCommodities(many, 4)).toHaveLength(4);
  });
});

describe('priceBoard', () => {
  const row = (commodity: string, date: string, modal: number, market = 'Kota') => ({
    commodity, variety: '', market, state: 'Rajasthan', district: 'Kota', min_price: modal - 50, max_price: modal + 50, modal_price: modal, date,
  });

  it('gives one row per crop with the latest prices, a trend and the day-on-day change', () => {
    const board = priceBoard(
      [
        row('Wheat', '2026-11-01', 2400),
        row('Wheat', '2026-11-02', 2400),
        row('Wheat', '2026-11-02', 2450, 'Bundi'),
        row('Mustard', '2026-11-02', 5650),
        row('Mustard', '2026-11-01', 5700),
      ],
      ['mustard'],
    );
    expect(board.map((r) => r.commodity)).toEqual(['Mustard', 'Wheat']);
    expect(board[0].pinned).toBe(true);
    expect(board[1]).toMatchObject({ date: '2026-11-02', modal: 2425, markets: 2, series: [2400, 2425] });
    expect(board[1].changePercent).toBeCloseTo(1.0417, 3);
    expect(board[0].changePercent).toBeCloseTo(-0.877, 2);
  });

  it('has no change for a crop seen on one day only', () => {
    expect(priceBoard([row('Potato', '2026-11-02', 1180)])[0].changePercent).toBeNull();
  });
});

describe('sparklinePoints', () => {
  it('scales values into the box, higher values nearer the top', () => {
    const pts = sparklinePoints([1, 3, 2], 100, 20, 0).split(' ').map((p) => p.split(',').map(Number));
    expect(pts[0]).toEqual([0, 20]);
    expect(pts[1]).toEqual([50, 0]);
    expect(pts[2][1]).toBe(10);
    expect(sparklinePoints([])).toBe('');
    expect(sparklinePoints([5, 5], 100, 20, 0)).toBe('0.0,10.0 100.0,10.0');
  });
});
