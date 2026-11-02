import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { CalendarClock, HeartPulse, Package, Tractor, TrendingDown, TrendingUp } from 'lucide-react';
import { formatMoney, type AttentionItem, type MonthTotals } from '@/lib/dashboard';
import type { CommoditySummary } from '@/lib/marketPrices';
import { cn } from '@/lib/utils';
import DashboardCard from './DashboardCard';

/** Small number tile: label, big value, a line of context. */
export const KpiTile = ({ label, value, note }: { label: string; value: string; note?: string }) => (
  <div className="surface flex flex-col gap-1 rounded-[14px] p-4">
    <span className="text-[13px] text-muted-foreground">{label}</span>
    <span className="font-display text-[32px] font-bold leading-[1.1]">{value}</span>
    {note && <span className="text-[13px] text-muted-foreground">{note}</span>}
  </div>
);

/** Net, income and expenses for the current month, with a split bar and its legend. */
export const MoneyThisMonth = ({ totals, monthLabel }: { totals: MonthTotals; monthLabel: string }) => {
  const { t } = useTranslation();
  const sum = totals.income + totals.expense;
  return (
    <DashboardCard title={t('today.money.title', { month: monthLabel, defaultValue: '{{month}} so far' })} link={{ to: '/dashboard/finances', label: t('nav.finances') }}>
      <div className="flex flex-col gap-3.5 pt-2">
        <div className="flex flex-col">
          <span className="text-[13px] text-muted-foreground">{t('today.money.net', 'Net')}</span>
          <span className={cn('font-display text-4xl font-bold leading-[1.1]', totals.net < 0 && 'text-rust')}>
            {totals.net < 0 ? '−' : ''}
            {formatMoney(Math.abs(totals.net))}
          </span>
        </div>
        {sum > 0 && (
          <div aria-hidden="true" className="flex h-3 gap-0.5">
            {totals.income > 0 && <div className="rounded-s bg-chart-income" style={{ flex: `${totals.income} 1 0` }} title={formatMoney(totals.income)} />}
            {totals.expense > 0 && <div className="rounded-e bg-chart-expense" style={{ flex: `${totals.expense} 1 0` }} title={formatMoney(totals.expense)} />}
          </div>
        )}
        <dl className="grid grid-cols-[1fr_auto] gap-x-3 gap-y-2 text-sm">
          <dt className="flex items-center gap-2 text-[#34453A] dark:text-muted-foreground">
            <span aria-hidden="true" className="h-2.5 w-2.5 rounded-[3px] bg-chart-income" />
            {t('today.money.income', 'Income')}
          </dt>
          <dd className="font-mono">{formatMoney(totals.income)}</dd>
          <dt className="flex items-center gap-2 text-[#34453A] dark:text-muted-foreground">
            <span aria-hidden="true" className="h-2.5 w-2.5 rounded-[3px] bg-chart-expense" />
            {t('today.money.expenses', 'Expenses')}
          </dt>
          <dd className="font-mono">{formatMoney(totals.expense)}</dd>
        </dl>
      </div>
    </DashboardCard>
  );
};

const ATTENTION_ICON = { stock: Package, expiry: CalendarClock, service: Tractor, health: HeartPulse };

/** Low stock, expiring inputs, machines due for service and animal health reminders. */
export const NeedsAttention = ({ items }: { items: AttentionItem[] }) => {
  const { t } = useTranslation();
  const kindLabel: Record<AttentionItem['kind'], string> = {
    stock: t('today.attention.stock', 'Low stock'),
    expiry: t('today.attention.expiry', 'Expiry'),
    service: t('today.attention.service', 'Service'),
    health: t('today.attention.health', 'Animal health'),
  };
  return (
    <DashboardCard title={t('today.attention.title', 'Needs attention')} meta={items.length > 0 ? String(items.length) : undefined}>
      {items.length === 0 ? (
        <p className="py-4 text-sm text-muted-foreground">{t('today.attention.none', 'Stock, machines and animals all look fine for the next two weeks.')}</p>
      ) : (
        <ul className="pt-1">
          {items.slice(0, 6).map((item, i) => {
            const Icon = ATTENTION_ICON[item.kind];
            return (
              <li key={`${item.kind}-${i}`} className="border-t border-muted first:border-t-0">
                <Link to={item.href} className="group flex items-center gap-3 py-3">
                  <span
                    className={cn(
                      'flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px]',
                      item.tone === 'warning' ? 'bg-warning-tint text-warning' : 'bg-info-tint text-info',
                    )}
                  >
                    <Icon className="h-[18px] w-[18px]" aria-hidden="true" />
                  </span>
                  <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                    <span className="eyebrow text-[11px]">{kindLabel[item.kind]}</span>
                    <span className="text-sm font-semibold group-hover:underline">{item.title}</span>
                    <span className="text-[13px] text-muted-foreground">{item.detail}</span>
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </DashboardCard>
  );
};

/** Latest mandi modal prices with the change from the previous day. */
export const MandiToday = ({ prices }: { prices: CommoditySummary[] }) => {
  const { t } = useTranslation();
  if (prices.length === 0) return null;
  return (
    <DashboardCard title={t('today.mandi.title', 'Mandi prices')} meta={t('today.mandi.unit', 'latest, per quintal')} link={{ to: '/dashboard/market', label: t('nav.market') }}>
      <table className="w-full border-collapse text-sm">
        <caption className="sr-only">{t('today.mandi.title', 'Mandi prices')}</caption>
        <tbody>
          {prices.map((p) => {
            const up = (p.trendPercent ?? 0) >= 0;
            return (
              <tr key={p.commodity} className="border-t border-muted first:border-t-0">
                <th scope="row" className="py-2.5 text-start font-medium">{p.commodity}</th>
                <td className="px-3 py-2.5 text-end font-mono">{formatMoney(p.avgPrice)}</td>
                <td className={cn('whitespace-nowrap py-2.5 text-end font-mono text-[13px]', p.trendPercent === null ? 'text-muted-foreground' : up ? 'text-[#1A5C33] dark:text-leaf' : 'text-rust')}>
                  {p.trendPercent === null ? (
                    '·'
                  ) : (
                    <span className="inline-flex items-center gap-1">
                      {up ? <TrendingUp className="h-3.5 w-3.5" aria-hidden="true" /> : <TrendingDown className="h-3.5 w-3.5" aria-hidden="true" />}
                      <span className="sr-only">{up ? t('today.mandi.up', 'up') : t('today.mandi.down', 'down')}</span>
                      {Math.abs(p.trendPercent).toFixed(1)}%
                    </span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </DashboardCard>
  );
};
