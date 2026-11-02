import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface SetupChecklistProps {
  hasFarm: boolean;
  hasFields: boolean;
  hasCrops: boolean;
  hasTeam: boolean;
  onAddFarm: () => void;
  /** Compact banner once the farm exists; full card for a brand-new account */
  compact?: boolean;
}

/** Four steps that get a new farm useful on the Today screen. */
const SetupChecklist = ({ hasFarm, hasFields, hasCrops, hasTeam, onAddFarm, compact }: SetupChecklistProps) => {
  const { t } = useTranslation();
  const steps = [
    { done: hasFarm, title: t('today.setup.farm', 'Add your farm'), detail: t('today.setup.farm_detail', 'Name, village and total area'), to: null },
    { done: hasFields, title: t('today.setup.fields', 'Draw your fields on the map'), detail: t('today.setup.fields_detail', 'Area and GPS centre are worked out for you'), to: '/dashboard/fields' },
    { done: hasCrops, title: t('today.setup.crops', 'Add what is planted'), detail: t('today.setup.crops_detail', 'Crop, variety and sowing date per field'), to: '/dashboard/crops' },
    { done: hasTeam, title: t('today.setup.team', 'Invite your team'), detail: t('today.setup.team_detail', 'Owner, admin, editor or viewer'), to: '/dashboard/organization' },
  ];
  const next = steps.find((s) => !s.done);

  return (
    <section aria-labelledby="setup-h" className={cn('surface flex flex-wrap gap-6 p-6 md:gap-8 md:p-8', compact && 'md:p-6')}>
      <div className="flex flex-[1_1_300px] flex-col gap-3">
        <h2 id="setup-h" className="text-[26px] font-bold leading-tight">
          {hasFarm ? t('today.setup.title_more', 'Finish setting up') : t('today.setup.title', 'Set up your farm in four steps')}
        </h2>
        <p className="text-base leading-relaxed text-muted-foreground">
          {t('today.setup.body', 'Most people finish in about ten minutes. You can skip any step and come back to it.')}
        </p>
        <div className="mt-2 flex flex-wrap gap-2.5">
          {!hasFarm ? (
            <Button size="lg" onClick={onAddFarm}>{t('today.setup.add_farm', 'Add your farm')}</Button>
          ) : (
            next?.to && (
              <Button size="lg" asChild>
                <Link to={next.to}>{next.title}</Link>
              </Button>
            )
          )}
        </div>
      </div>
      <ol className="flex flex-[1_1_340px] flex-col gap-2.5">
        {steps.map((s, i) => (
          <li key={s.title} className="flex items-center gap-3.5 rounded-xl border px-4 py-3.5">
            <span
              className={cn(
                'flex h-[30px] w-[30px] shrink-0 items-center justify-center rounded-full text-sm font-bold',
                s.done ? 'bg-primary text-primary-foreground' : 'border-2 border-[#C9D1C5] text-muted-foreground',
              )}
            >
              {s.done ? <Check className="h-4 w-4" strokeWidth={3} aria-label={t('today.setup.done', 'Done')} /> : i + 1}
            </span>
            <span className="flex flex-1 flex-col gap-0.5">
              <span className={cn('text-[15px] font-semibold', s.done && 'text-muted-foreground')}>{s.title}</span>
              <span className="text-[13px] text-muted-foreground">{s.detail}</span>
            </span>
          </li>
        ))}
      </ol>
    </section>
  );
};

export default SetupChecklist;
