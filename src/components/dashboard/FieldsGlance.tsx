import React from 'react';
import { useTranslation } from 'react-i18next';
import FarmMap, { StageLegend, stageSwatch, type FieldStage } from '@/components/fields/FarmMap';
import DashboardCard from './DashboardCard';

export interface GlanceField {
  id: string;
  name: string;
  area: number;
  areaUnit: string;
  boundaries: unknown;
  stage: FieldStage;
  /** e.g. "Mustard · day 21" */
  summary: string;
}

/** Farm map drawn from field boundaries, coloured by crop stage, with every field listed below it. */
const FieldsGlance = ({ fields }: { fields: GlanceField[] }) => {
  const { t } = useTranslation();

  return (
    <DashboardCard title={t('today.fields.title', 'Fields at a glance')} link={{ to: '/dashboard/fields', label: t('today.fields.open', 'Open map') }}>
      <div className="flex flex-col gap-4 pt-3">
        <FarmMap fields={fields} height={260} label={t('today.fields.map_label', 'Map of your fields coloured by crop stage')} />
        <StageLegend />
        <ul className="divide-y divide-muted">
          {fields.map((f) => (
            <li key={f.id} className="flex items-center gap-3 py-2.5">
              <span aria-hidden="true" className="h-3.5 w-3.5 shrink-0 rounded" style={{ background: stageSwatch(f.stage) }} />
              <span className="flex min-w-0 flex-1 flex-col">
                <span className="truncate text-[15px] font-semibold">{f.name}</span>
                <span className="truncate text-[13px] text-muted-foreground">{f.summary}</span>
              </span>
              <span className="whitespace-nowrap font-mono text-[13px] text-[#34453A] dark:text-muted-foreground">
                {f.area} {f.areaUnit}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </DashboardCard>
  );
};

export default FieldsGlance;
