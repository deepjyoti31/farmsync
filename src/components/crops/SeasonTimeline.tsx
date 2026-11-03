import React, { useMemo } from 'react';
import { format, parseISO } from 'date-fns';
import { plantingSegments, seasonWindow, todayOffset, type Segment } from '@/lib/cropTimeline';
import { cropProgress, type PlantingLike } from '@/lib/dashboard';
import { cn } from '@/lib/utils';

export interface TimelinePlanting extends PlantingLike {
  id: string;
  field_id: string;
  label: string;
  where: string;
}

const SEG_CLASS: Record<Segment['kind'], string> = {
  grown: 'bg-chart-income',
  expected: 'bg-[#BCD7C3] dark:bg-leaf/40',
  harvest: 'bg-chart-expense',
  planned: 'border-2 border-dashed border-[#7C8C80]',
  done: 'bg-info/30',
};

const LEGEND: { kind: Segment['kind']; label: string }[] = [
  { kind: 'grown', label: 'Growing so far' },
  { kind: 'expected', label: 'Expected growth' },
  { kind: 'harvest', label: 'Expected harvest' },
  { kind: 'planned', label: 'Planned' },
  { kind: 'done', label: 'Harvested' },
];

const LABEL_W = 220;

/** Gantt-style season plan: one row per planting, months across, a line for today. */
const SeasonTimeline = ({ plantings, onSelect }: { plantings: TimelinePlanting[]; onSelect?: (id: string) => void }) => {
  const now = useMemo(() => new Date(), []);
  const win = useMemo(() => seasonWindow(plantings, now), [plantings, now]);
  const today = todayOffset(win, now);
  const rows = useMemo(
    () =>
      [...plantings]
        .map((p) => ({ p, segs: plantingSegments(p, win, now), stage: cropProgress(p, now).stage }))
        .filter((r) => r.segs.length > 0)
        .sort((a, b) => a.p.planting_date.localeCompare(b.p.planting_date)),
    [plantings, win, now],
  );

  const describe = (p: TimelinePlanting) =>
    [
      `Sown ${format(parseISO(p.planting_date), 'd MMM yyyy')}`,
      p.expected_harvest_date ? `harvest expected ${format(parseISO(p.expected_harvest_date), 'd MMM yyyy')}` : 'no harvest date yet',
      p.actual_harvest_date ? `harvested ${format(parseISO(p.actual_harvest_date), 'd MMM yyyy')}` : null,
    ]
      .filter(Boolean)
      .join(', ');

  return (
    <section aria-labelledby="timeline-h" className="surface flex flex-col gap-4 p-5 md:p-6">
      <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
        <h2 id="timeline-h" className="text-xl font-bold">
          {format(win.start, 'MMMM yyyy')} to {format(win.end, 'MMMM yyyy')}
        </h2>
        <ul aria-label="Legend" className="ms-auto flex flex-wrap gap-x-4 gap-y-2 text-[13px] text-[#34453A] dark:text-muted-foreground">
          {LEGEND.map((l) => (
            <li key={l.kind} className="flex items-center gap-2">
              <span aria-hidden="true" className={cn('h-2.5 w-[18px] rounded-[3px]', SEG_CLASS[l.kind])} />
              {l.label}
            </li>
          ))}
        </ul>
      </div>

      {rows.length === 0 ? (
        <p className="py-6 text-center text-muted-foreground">No plantings in this season yet.</p>
      ) : (
        <div className="overflow-x-auto">
          <div className="min-w-[760px]">
            <div className="flex font-mono text-xs text-muted-foreground" style={{ paddingInlineStart: LABEL_W }} aria-hidden="true">
              <div className="relative h-6 flex-1">
                {win.months.map((m) => (
                  <span key={`${m.label}-${m.offset}`} className="absolute top-0 ps-1.5" style={{ insetInlineStart: `${m.offset}%`, width: `${m.width}%` }}>
                    {m.label}
                  </span>
                ))}
              </div>
            </div>
            <div className="relative">
              <div aria-hidden="true" className="pointer-events-none absolute inset-y-0 end-0" style={{ insetInlineStart: LABEL_W }}>
                {win.months.map((m) => (
                  <span key={`l-${m.offset}`} className="absolute inset-y-0 w-px bg-muted" style={{ insetInlineStart: `${m.offset}%` }} />
                ))}
                {today !== null && (
                  <>
                    <span className="absolute inset-y-0 z-[1] w-0.5 bg-sidebar" style={{ insetInlineStart: `${today}%` }} />
                    <span
                      className="absolute top-1 z-[2] rounded-md bg-sidebar px-2 py-0.5 font-mono text-[11px] text-white"
                      style={{ insetInlineStart: `calc(${today}% + 6px)` }}
                    >
                      Today
                    </span>
                  </>
                )}
              </div>
              <ul>
                {rows.map(({ p, segs, stage }) => (
                  <li key={p.id} className="flex min-h-16 items-center border-t border-muted">
                    <div className="flex shrink-0 flex-col gap-0.5 pe-4" style={{ width: LABEL_W }}>
                      {onSelect ? (
                        <button type="button" onClick={() => onSelect(p.id)} className="text-start text-[15px] font-semibold hover:underline">
                          {p.label}
                        </button>
                      ) : (
                        <span className="text-[15px] font-semibold">{p.label}</span>
                      )}
                      <span className="text-[13px] text-muted-foreground">{p.where}</span>
                    </div>
                    <div className="relative h-[22px] flex-1" title={describe(p)}>
                      <span className="sr-only">
                        {stage === 'planned' ? 'Planned. ' : stage === 'harvested' ? 'Harvested. ' : ''}
                        {describe(p)}
                      </span>
                      {segs.map((s) => (
                        <span
                          key={s.kind}
                          aria-hidden="true"
                          className={cn('absolute top-[3px] h-4 rounded box-border', SEG_CLASS[s.kind], s.kind !== 'harvest' && 'me-0.5')}
                          style={{ insetInlineStart: `${s.left}%`, width: `calc(${s.width}% - ${s.kind === 'harvest' ? 0 : 2}px)` }}
                        />
                      ))}
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

export default SeasonTimeline;
