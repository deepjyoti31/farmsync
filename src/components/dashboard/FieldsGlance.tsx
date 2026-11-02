import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { fieldShapes } from '@/lib/fieldShapes';
import type { CropStage } from '@/lib/dashboard';
import DashboardCard from './DashboardCard';

export interface GlanceField {
  id: string;
  name: string;
  area: number;
  areaUnit: string;
  boundaries: unknown;
  stage: CropStage | 'empty';
  /** e.g. "Mustard · day 21" */
  summary: string;
}

const STAGE_FILL: Record<CropStage | 'empty', string> = {
  growing: '#2E7D4F',
  ready: '#E39B34',
  planned: '#D5DED3',
  harvested: '#C9D7E8',
  empty: 'url(#fs-prep)',
};
const DARK_FILL = new Set(['growing']);

const W = 640;
const H = 260;

/** Farm map drawn from field boundaries, coloured by crop stage, with a list for fields that have no boundary. */
const FieldsGlance = ({ fields }: { fields: GlanceField[] }) => {
  const { t } = useTranslation();
  const shapes = useMemo(() => fieldShapes(fields, W, H, 14), [fields]);
  const byId = new Map(fields.map((f) => [f.id, f]));
  const legend: { stage: CropStage | 'empty'; label: string }[] = [
    { stage: 'growing', label: t('today.fields.growing', 'Growing') },
    { stage: 'ready', label: t('today.fields.ready', 'Ready to harvest') },
    { stage: 'planned', label: t('today.fields.planned', 'Planned') },
    { stage: 'empty', label: t('today.fields.empty', 'Nothing planted') },
  ];

  return (
    <DashboardCard title={t('today.fields.title', 'Fields at a glance')} link={{ to: '/dashboard/fields', label: t('today.fields.open', 'Open map') }}>
      <div className="flex flex-col gap-4 pt-3">
        {shapes.length > 0 && (
          <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={t('today.fields.map_label', 'Map of your fields coloured by crop stage')} className="block h-auto w-full rounded-xl bg-[#EEF1E8] dark:bg-muted">
            <defs>
              <pattern id="fs-prep" width="8" height="8" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
                <rect width="8" height="8" fill="#EFE7D6" />
                <line x1="0" y1="0" x2="0" y2="8" stroke="#C9B994" strokeWidth="2" />
              </pattern>
            </defs>
            {shapes.map((s) => {
              const f = byId.get(s.id)!;
              const dark = DARK_FILL.has(f.stage);
              return (
                <g key={s.id}>
                  <title>{`${f.name}: ${f.summary}`}</title>
                  <path d={s.d} fill={STAGE_FILL[f.stage]} stroke="#FFFFFF" strokeWidth="3" strokeLinejoin="round" />
                  <text x={s.cx} y={s.cy} textAnchor="middle" fontFamily="Figtree, sans-serif" fontSize="13" fontWeight="700" fill={dark ? '#FFFFFF' : '#14251A'}>
                    {f.name}
                  </text>
                </g>
              );
            })}
          </svg>
        )}

        <ul aria-label={t('today.fields.legend', 'Legend')} className="flex flex-wrap gap-x-5 gap-y-2 text-[13px] text-[#34453A] dark:text-muted-foreground">
          {legend.map((l) => (
            <li key={l.stage} className="flex items-center gap-2">
              <span
                aria-hidden="true"
                className="h-3.5 w-3.5 rounded border border-black/10"
                style={{ background: l.stage === 'empty' ? 'repeating-linear-gradient(45deg,#EFE7D6 0 3px,#C9B994 3px 5px)' : STAGE_FILL[l.stage] }}
              />
              {l.label}
            </li>
          ))}
        </ul>

        <ul className="divide-y divide-muted">
          {fields.map((f) => (
            <li key={f.id} className="flex items-center gap-3 py-2.5">
              <span
                aria-hidden="true"
                className="h-3.5 w-3.5 shrink-0 rounded"
                style={{ background: f.stage === 'empty' ? 'repeating-linear-gradient(45deg,#EFE7D6 0 3px,#C9B994 3px 5px)' : STAGE_FILL[f.stage] }}
              />
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
