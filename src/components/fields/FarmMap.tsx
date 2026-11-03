import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { fieldShapes } from '@/lib/fieldShapes';
import type { CropStage } from '@/lib/dashboard';
import { cn } from '@/lib/utils';

export type FieldStage = CropStage | 'empty';

export interface MapField {
  id: string;
  name: string;
  boundaries: unknown;
  stage: FieldStage;
  /** Hover text, e.g. "Mustard · day 21" */
  summary?: string;
}

export const STAGE_FILL: Record<FieldStage, string> = {
  growing: '#2E7D4F',
  ready: '#E39B34',
  planned: '#D5DED3',
  harvested: '#C9D7E8',
  empty: 'url(#fm-prep)',
};

/** CSS background for a stage swatch in lists and legends (the hatch cannot come from an SVG pattern there). */
export const stageSwatch = (stage: FieldStage) =>
  stage === 'empty' ? 'repeating-linear-gradient(45deg,#EFE7D6 0 3px,#C9B994 3px 5px)' : STAGE_FILL[stage];

export const STAGE_LABEL: Record<FieldStage, string> = {
  growing: 'Growing',
  ready: 'Ready to harvest',
  planned: 'Planned',
  harvested: 'Harvested',
  empty: 'Nothing planted',
};

interface FarmMapProps {
  fields: MapField[];
  width?: number;
  height?: number;
  selectedId?: string | null;
  /** Clicking a shape selects it. The list beside the map is the keyboard route, so shapes are not focusable. */
  onSelect?: (id: string) => void;
  label: string;
  className?: string;
}

/** Fields drawn from their saved boundaries, coloured by crop stage. Works offline: no map tiles needed. */
const FarmMap = ({ fields, width = 640, height = 280, selectedId, onSelect, label, className }: FarmMapProps) => {
  const shapes = useMemo(() => fieldShapes(fields, width, height, 16), [fields, width, height]);
  const byId = useMemo(() => new Map(fields.map((f) => [f.id, f])), [fields]);
  if (shapes.length === 0) return null;

  return (
    <svg viewBox={`0 0 ${width} ${height}`} role="img" aria-label={label} className={cn('block h-auto w-full rounded-xl bg-[#EEF1E8] dark:bg-muted', className)}>
      <defs>
        <pattern id="fm-prep" width="8" height="8" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
          <rect width="8" height="8" fill="#EFE7D6" />
          <line x1="0" y1="0" x2="0" y2="8" stroke="#C9B994" strokeWidth="2" />
        </pattern>
      </defs>
      {/* Draw the selected field last so its outline sits on top */}
      {[...shapes]
        .sort((a, b) => Number(a.id === selectedId) - Number(b.id === selectedId))
        .map((s) => {
          const f = byId.get(s.id)!;
          const selected = s.id === selectedId;
          return (
            <g key={s.id} onClick={onSelect ? () => onSelect(s.id) : undefined} className={cn(onSelect && 'cursor-pointer')}>
              <title>{f.summary ? `${f.name}: ${f.summary}` : f.name}</title>
              <path d={s.d} fill={STAGE_FILL[f.stage]} stroke={selected ? '#E9A23B' : '#FFFFFF'} strokeWidth={selected ? 5 : 3} strokeLinejoin="round" />
              <text
                x={s.cx}
                y={s.cy}
                textAnchor="middle"
                dominantBaseline="middle"
                fontFamily="Figtree, sans-serif"
                fontSize="13"
                fontWeight="700"
                fill={f.stage === 'growing' ? '#FFFFFF' : '#14251A'}
                pointerEvents="none"
              >
                {f.name}
              </text>
            </g>
          );
        })}
    </svg>
  );
};

/** Colour key for the map. */
export const StageLegend = ({ stages = ['growing', 'ready', 'planned', 'empty'] as FieldStage[] }: { stages?: FieldStage[] }) => {
  const { t } = useTranslation();
  return (
  <ul aria-label={t('today.fields.legend', 'Legend')} className="flex flex-wrap gap-x-5 gap-y-2 text-[13px] text-[#34453A] dark:text-muted-foreground">
    {stages.map((s) => (
      <li key={s} className="flex items-center gap-2">
        <span aria-hidden="true" className="h-3.5 w-3.5 rounded border border-black/10" style={{ background: stageSwatch(s) }} />
        {t(`today.fields.${s}`, STAGE_LABEL[s])}
      </li>
    ))}
  </ul>
  );
};

export default FarmMap;
