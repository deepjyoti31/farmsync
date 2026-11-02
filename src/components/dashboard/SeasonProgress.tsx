import React from 'react';
import { useTranslation } from 'react-i18next';
import { format, parseISO } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import type { CropProgress } from '@/lib/dashboard';
import DashboardCard from './DashboardCard';

export interface SeasonRow {
  id: string;
  name: string;
  where: string;
  plantingDate: string;
  expectedHarvest: string | null;
  progress: CropProgress;
}

/** One progress bar per live planting, from sowing to expected harvest. */
const SeasonProgress = ({ rows }: { rows: SeasonRow[] }) => {
  const { t } = useTranslation();

  const dayText = (r: SeasonRow) => {
    const p = r.progress;
    if (p.stage === 'planned') return t('today.season.not_sown', 'Not sown yet');
    return p.totalDays
      ? t('today.season.day_of', { day: p.day, total: p.totalDays, defaultValue: 'Day {{day}} of {{total}}' })
      : t('today.season.day', { day: p.day, defaultValue: 'Day {{day}}' });
  };

  const nextText = (r: SeasonRow) => {
    const p = r.progress;
    if (p.stage === 'planned') return t('today.season.sowing', { date: format(parseISO(r.plantingDate), 'd MMM'), defaultValue: 'Sowing {{date}}' });
    if (!r.expectedHarvest) return t('today.season.no_harvest_date', 'Add an expected harvest date');
    if (p.daysToHarvest !== null && p.daysToHarvest <= 0) return t('today.season.harvest_now', 'Harvest window is open');
    return t('today.season.harvest_on', { date: format(parseISO(r.expectedHarvest), 'd MMM'), defaultValue: 'Harvest from {{date}}' });
  };

  return (
    <DashboardCard title={t('today.season.title', 'Season progress')} link={{ to: '/dashboard/crops', label: t('today.season.plan', 'Crop plan') }}>
      {rows.length === 0 ? (
        <p className="py-6 text-center text-muted-foreground">{t('today.season.none', 'No crops in the ground. Plan a planting to follow it here.')}</p>
      ) : (
        <div className="pt-1">
          {rows.map((r) => (
            <div key={r.id} className="flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-muted py-3.5 first:border-t-0">
              <div className="flex min-w-[180px] flex-[1_1_200px] flex-col gap-0.5">
                <span className="flex items-center gap-2 text-[15px] font-semibold">
                  {r.name}
                  {r.progress.stage === 'ready' && <Badge variant="warning">{t('today.fields.ready', 'Ready to harvest')}</Badge>}
                </span>
                <span className="text-[13px] text-muted-foreground">{r.where}</span>
              </div>
              <div className="flex min-w-[220px] flex-[2_1_260px] flex-col gap-1.5">
                <div
                  role="progressbar"
                  aria-label={t('today.season.bar', { name: r.name, defaultValue: '{{name}} season' })}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-valuenow={r.progress.percent}
                  className="h-2 overflow-hidden rounded bg-muted"
                  title={dayText(r)}
                >
                  <div className="h-full rounded bg-chart-income" style={{ width: `${r.progress.percent}%` }} />
                </div>
                <div className="flex justify-between gap-3 text-[13px]">
                  <span className="font-mono text-[#34453A] dark:text-muted-foreground">{dayText(r)}</span>
                  <span className="text-muted-foreground">{nextText(r)}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </DashboardCard>
  );
};

export default SeasonProgress;
