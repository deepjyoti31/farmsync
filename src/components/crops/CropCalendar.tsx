import React, { useMemo, useState } from 'react';
import { addMonths, format, parseISO } from 'date-fns';
import { CalendarRange, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { cropEvents, groupByDate, monthGrid, type CropEventKind, type PlantingLike } from '@/lib/cropCalendar';

const KIND_STYLES: Record<CropEventKind, { chip: string; dot: string; label: string }> = {
  planting: { chip: 'bg-leaf-tint text-[#1A4D2C]', dot: 'bg-leaf', label: 'Sowing' },
  expected_harvest: { chip: 'bg-warning-tint text-[#6E4600]', dot: 'bg-harvest', label: 'Expected harvest' },
  harvest: { chip: 'bg-stone-200 text-stone-800 dark:bg-stone-800 dark:text-stone-200', dot: 'bg-stone-600', label: 'Harvested' },
};

const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

interface CropCalendarProps {
  plantings: PlantingLike[];
  fieldNames: Map<string, string>;
  onSelectPlanting?: (id: string) => void;
}

/** Month view of sowing and harvest dates, with an agenda list underneath for small screens. */
const CropCalendar: React.FC<CropCalendarProps> = ({ plantings, fieldNames, onSelectPlanting }) => {
  const [month, setMonth] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });

  const events = useMemo(() => cropEvents(plantings, fieldNames), [plantings, fieldNames]);
  const byDate = useMemo(() => groupByDate(events), [events]);
  const weeks = useMemo(() => monthGrid(month.getFullYear(), month.getMonth()), [month]);
  const monthKey = format(month, 'yyyy-MM');
  const monthEvents = events.filter((e) => e.date.startsWith(monthKey));
  const today = format(new Date(), 'yyyy-MM-dd');

  return (
    <Card>
      <CardHeader className="flex flex-col gap-3 space-y-0 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <CardTitle>Crop Calendar</CardTitle>
          <CardDescription>Sowing and harvest dates across your fields</CardDescription>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={() => setMonth((m) => addMonths(m, -1))} aria-label="Previous month">
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="w-32 text-center font-medium">{format(month, 'MMMM yyyy')}</span>
          <Button variant="outline" size="icon" onClick={() => setMonth((m) => addMonths(m, 1))} aria-label="Next month">
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setMonth(new Date(new Date().getFullYear(), new Date().getMonth(), 1))}
          >
            Today
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
          {(Object.keys(KIND_STYLES) as CropEventKind[]).map((k) => (
            <span key={k} className="flex items-center gap-1.5">
              <span className={cn('h-2 w-2 rounded-full', KIND_STYLES[k].dot)} />
              {KIND_STYLES[k].label}
            </span>
          ))}
        </div>

        <div className="overflow-hidden rounded-md border">
          <div className="grid grid-cols-7 bg-muted/50 text-center text-xs font-medium text-muted-foreground">
            {WEEKDAYS.map((d) => <div key={d} className="py-2">{d}</div>)}
          </div>
          {weeks.map((week) => (
            <div key={week[0].date} className="grid grid-cols-7 border-t">
              {week.map((day) => {
                const dayEvents = byDate.get(day.date) ?? [];
                return (
                  <div
                    key={day.date}
                    className={cn(
                      'min-h-14 border-l p-1 first:border-l-0 sm:min-h-24',
                      !day.inMonth && 'bg-muted/30 text-muted-foreground',
                    )}
                  >
                    <div
                      className={cn(
                        'mb-1 flex h-6 w-6 items-center justify-center rounded-full text-xs',
                        day.date === today && 'bg-primary font-semibold text-primary-foreground',
                      )}
                    >
                      {day.dayOfMonth}
                    </div>
                    {/* Dots on phones, labelled chips on wider screens */}
                    <div className="flex flex-wrap gap-0.5 sm:hidden">
                      {dayEvents.map((e) => (
                        <span key={`${e.plantingId}-${e.kind}`} className={cn('h-1.5 w-1.5 rounded-full', KIND_STYLES[e.kind].dot)} />
                      ))}
                    </div>
                    <div className="hidden space-y-0.5 sm:block">
                      {dayEvents.slice(0, 3).map((e) => (
                        <button
                          type="button"
                          key={`${e.plantingId}-${e.kind}`}
                          onClick={() => onSelectPlanting?.(e.plantingId)}
                          title={`${KIND_STYLES[e.kind].label}: ${e.cropName} (${e.fieldName})`}
                          className={cn('block w-full truncate rounded px-1 text-left text-[11px] leading-4', KIND_STYLES[e.kind].chip)}
                        >
                          {e.cropName}
                        </button>
                      ))}
                      {dayEvents.length > 3 && (
                        <span className="block px-1 text-[11px] text-muted-foreground">+{dayEvents.length - 3} more</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ))}
        </div>

        {monthEvents.length === 0 ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <CalendarRange className="h-4 w-4" />
            No sowing or harvests in {format(month, 'MMMM')}.
          </div>
        ) : (
          <ul className="divide-y text-sm">
            {monthEvents.map((e) => (
              <li key={`${e.plantingId}-${e.kind}`}>
                <button
                  type="button"
                  onClick={() => onSelectPlanting?.(e.plantingId)}
                  className="flex w-full items-center gap-3 py-2 text-left hover:bg-muted/50"
                >
                  <span className="w-14 shrink-0 text-muted-foreground">{format(parseISO(e.date), 'dd MMM')}</span>
                  <span className={cn('h-2 w-2 shrink-0 rounded-full', KIND_STYLES[e.kind].dot)} />
                  <span className="flex-1">
                    {KIND_STYLES[e.kind].label}: <strong>{e.cropName}</strong>
                    <span className="text-muted-foreground"> · {e.fieldName}</span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
};

export default CropCalendar;
