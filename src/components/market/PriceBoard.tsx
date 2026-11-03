import React from 'react';
import { format, parseISO } from 'date-fns';
import { Star, TrendingDown, TrendingUp } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { formatMoney } from '@/lib/dashboard';
import { sparklinePoints, type BoardRow } from '@/lib/marketPrices';
import { cn } from '@/lib/utils';

/** One row per crop: latest min / modal / max, a 7-day trend and the change since the day before. */
const PriceBoard = ({ rows }: { rows: BoardRow[] }) => (
  <Table className="min-w-[680px]">
    <TableHeader>
      <TableRow>
        <TableHead className="ps-5">Crop</TableHead>
        <TableHead className="text-end">Min</TableHead>
        <TableHead className="text-end">Modal</TableHead>
        <TableHead className="text-end">Max</TableHead>
        <TableHead>Trend</TableHead>
        <TableHead className="pe-5 text-end">Change</TableHead>
      </TableRow>
    </TableHeader>
    <TableBody>
      {rows.map((r) => {
        const up = (r.changePercent ?? 0) >= 0;
        const points = sparklinePoints(r.series);
        const last = points.split(' ').pop()?.split(',').map(Number);
        return (
          <TableRow key={r.commodity}>
            <TableCell className="ps-5">
              <span className="flex items-center gap-2 font-semibold">
                {r.pinned && <Star className="h-3.5 w-3.5 fill-harvest text-[#B26B00]" aria-label="You grow this" />}
                {r.commodity}
              </span>
              <span className="text-xs text-muted-foreground">
                {format(parseISO(r.date), 'd MMM')} · {r.markets} {r.markets === 1 ? 'market' : 'markets'}
              </span>
            </TableCell>
            <TableCell className="text-end font-mono text-muted-foreground">{formatMoney(r.min)}</TableCell>
            <TableCell className="text-end font-mono font-medium">{formatMoney(r.modal)}</TableCell>
            <TableCell className="text-end font-mono text-muted-foreground">{formatMoney(r.max)}</TableCell>
            <TableCell>
              {r.series.length > 1 ? (
                <svg width="96" height="28" viewBox="0 0 96 28" role="img" aria-label={`${r.commodity} modal price over the last ${r.series.length} days`}>
                  <polyline points={points} fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" className="text-[#34453A] dark:text-muted-foreground" />
                  {last && <circle cx={last[0]} cy={last[1]} r="3" className="fill-foreground" />}
                </svg>
              ) : (
                <span className="text-xs text-muted-foreground">One day only</span>
              )}
            </TableCell>
            <TableCell className={cn('pe-5 text-end font-mono text-[13px]', r.changePercent === null ? 'text-muted-foreground' : up ? 'text-[#1A5C33] dark:text-leaf' : 'text-rust')}>
              {r.changePercent === null ? (
                '·'
              ) : (
                <span className="inline-flex items-center gap-1">
                  {up ? <TrendingUp className="h-3.5 w-3.5" aria-hidden="true" /> : <TrendingDown className="h-3.5 w-3.5" aria-hidden="true" />}
                  <span className="sr-only">{up ? 'up' : 'down'}</span>
                  {Math.abs(r.changePercent).toFixed(1)}%
                </span>
              )}
            </TableCell>
          </TableRow>
        );
      })}
    </TableBody>
  </Table>
);

export default PriceBoard;
