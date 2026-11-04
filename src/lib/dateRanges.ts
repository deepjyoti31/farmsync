import { format } from 'date-fns';

export type ReportPeriod =
  | 'this-month'
  | 'last-month'
  | 'this-quarter'
  | 'last-quarter'
  | 'this-year'
  | 'last-year';

export interface DateRange {
  /** Inclusive start, yyyy-MM-dd in local time. */
  startDate: string;
  /** Inclusive end, yyyy-MM-dd in local time. */
  endDate: string;
}

// Format in local time. toISOString() would shift dates to UTC, which moves
// midnight on the 1st back to the previous day for users east of UTC (e.g. India).
const ymd = (d: Date) => format(d, 'yyyy-MM-dd');

/**
 * A Date as a yyyy-MM-dd value for a DATE column, in local time.
 * Use this instead of toISOString().split('T')[0], which gives the previous
 * day for a date picked at local midnight anywhere east of UTC.
 */
export const toDateValue = (d: Date): string => ymd(d);

/** Date range covered by a report period, relative to `now`. Unknown periods mean year to date. */
export function getDateRange(period: string, now: Date = new Date()): DateRange {
  const year = now.getFullYear();
  const month = now.getMonth();
  const today = ymd(now);

  switch (period as ReportPeriod) {
    case 'this-month':
      return { startDate: ymd(new Date(year, month, 1)), endDate: today };
    case 'last-month':
      return {
        startDate: ymd(new Date(year, month - 1, 1)),
        endDate: ymd(new Date(year, month, 0)),
      };
    case 'this-quarter': {
      const quarter = Math.floor(month / 3);
      return { startDate: ymd(new Date(year, quarter * 3, 1)), endDate: today };
    }
    case 'last-quarter': {
      // Month arithmetic rolls over into the previous year automatically.
      const startMonth = Math.floor(month / 3) * 3 - 3;
      return {
        startDate: ymd(new Date(year, startMonth, 1)),
        endDate: ymd(new Date(year, startMonth + 3, 0)),
      };
    }
    case 'last-year':
      return { startDate: `${year - 1}-01-01`, endDate: `${year - 1}-12-31` };
    case 'this-year':
    default:
      return { startDate: `${year}-01-01`, endDate: today };
  }
}
