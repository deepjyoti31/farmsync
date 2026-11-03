import React from 'react';
import { cn } from '@/lib/utils';

interface SegmentedProps<T extends string> {
  /** Names the group for screen readers, e.g. "View" */
  label: string;
  value: T;
  options: { value: NoInfer<T>; label: React.ReactNode }[];
  onChange: (value: NoInfer<T>) => void;
  className?: string;
}

/** Pill-shaped switch between a few views of the same data (List / Board, ha / acre). */
function Segmented<T extends string>({ label, value, options, onChange, className }: SegmentedProps<T>) {
  return (
    <div role="group" aria-label={label} className={cn('inline-flex max-w-full gap-1 overflow-x-auto rounded-xl bg-secondary p-1', className)}>
      {options.map((o) => {
        const on = o.value === value;
        return (
          <button
            key={o.value}
            type="button"
            aria-pressed={on}
            onClick={() => onChange(o.value)}
            className={cn(
              'h-10 whitespace-nowrap rounded-[9px] px-4 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
              on ? 'bg-card text-foreground shadow-[0_1px_2px_rgba(20,37,26,0.12)]' : 'text-muted-foreground hover:text-foreground',
            )}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

export default Segmented;
