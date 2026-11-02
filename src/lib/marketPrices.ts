import type { Tables } from '@/integrations/supabase/types';

/** A wholesale (mandi) price observation as displayed in the Market page. */
export interface MarketPrice {
  commodity: string;
  variety: string;
  market: string;
  state: string;
  district: string;
  min_price: number;
  max_price: number;
  modal_price: number;
  date: string;
}

export interface CommoditySummary {
  commodity: string;
  avgPrice: number;
  /** Percentage change of the latest day's average versus the previous day's, or null if unknown. */
  trendPercent: number | null;
}

/** Select values that mean "do not filter". */
export const ALL_COMMODITIES = 'all_commodities';
export const ALL_STATES = 'all_states';

/** Convert a `market_data` row into the shape used by the UI. */
export function toMarketPrice(row: Tables<'market_data'>): MarketPrice {
  const modal = Number(row.modal_price ?? row.price_per_unit);
  return {
    commodity: row.crop_name,
    variety: row.variety ?? '',
    market: row.market_location ?? '',
    state: row.state ?? '',
    district: row.district ?? '',
    min_price: Number(row.min_price ?? modal),
    max_price: Number(row.max_price ?? modal),
    modal_price: modal,
    date: row.price_date,
  };
}

export interface MarketFilters {
  search?: string;
  commodity?: string | null;
  state?: string | null;
}

export function filterMarketPrices(prices: MarketPrice[], filters: MarketFilters): MarketPrice[] {
  const search = filters.search?.trim().toLowerCase() ?? '';
  const commodity = filters.commodity && filters.commodity !== ALL_COMMODITIES ? filters.commodity : null;
  const state = filters.state && filters.state !== ALL_STATES ? filters.state : null;

  return prices.filter((p) => {
    if (search && !p.commodity.toLowerCase().includes(search) && !p.market.toLowerCase().includes(search)) {
      return false;
    }
    if (commodity && p.commodity !== commodity) return false;
    if (state && p.state !== state) return false;
    return true;
  });
}

function average(values: number[]): number {
  return values.length === 0 ? 0 : values.reduce((sum, v) => sum + v, 0) / values.length;
}

/**
 * Average modal price per commodity, plus the trend between the two most recent
 * price dates. The trend is null when there is only one date of data.
 */
export function summarizeCommodities(prices: MarketPrice[], limit = 4): CommoditySummary[] {
  const byCommodity = new Map<string, MarketPrice[]>();
  for (const p of prices) {
    const list = byCommodity.get(p.commodity) ?? [];
    list.push(p);
    byCommodity.set(p.commodity, list);
  }

  return Array.from(byCommodity.keys())
    .sort()
    .slice(0, limit)
    .map((commodity) => {
      const items = byCommodity.get(commodity)!;
      const dates = Array.from(new Set(items.map((i) => i.date))).sort().reverse();
      const latest = items.filter((i) => i.date === dates[0]).map((i) => i.modal_price);
      const previous = items.filter((i) => i.date === dates[1]).map((i) => i.modal_price);

      const latestAvg = average(latest);
      const previousAvg = average(previous);
      const trendPercent =
        previous.length > 0 && previousAvg > 0 ? ((latestAvg - previousAvg) / previousAvg) * 100 : null;

      return { commodity, avgPrice: latestAvg, trendPercent };
    });
}
