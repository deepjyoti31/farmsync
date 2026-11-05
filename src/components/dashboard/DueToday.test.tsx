// @vitest-environment jsdom
import React from 'react';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { format } from 'date-fns';
import type { TaskRow } from '@/components/tasks/taskApi';

// Resolve translations to their English defaults, with {{placeholders}} filled in.
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, opts?: string | Record<string, unknown>) => {
      if (typeof opts === 'string') return opts;
      const text = String(opts?.defaultValue ?? key);
      return text.replace(/\{\{(\w+)\}\}/g, (_, k) => String(opts?.[k] ?? ''));
    },
  }),
}));

import DueToday from './DueToday';

const NOW = new Date(2026, 10, 5, 9, 0);
const day = (offset: number) => format(new Date(2026, 10, 5 + offset), 'yyyy-MM-dd');

let n = 0;
const task = (overrides: Partial<TaskRow>): TaskRow =>
  ({
    id: `t${++n}`,
    farm_id: 'f1',
    title: `Task ${n}`,
    description: null,
    priority: 'medium',
    task_type: null,
    related_id: null,
    assigned_to: null,
    recurrence: 'none',
    due_date: day(0),
    status: 'pending',
    completed_at: null,
    created_at: '',
    updated_at: '',
    ...overrides,
  }) as TaskRow;

const renderCard = (props: Partial<React.ComponentProps<typeof DueToday>>) =>
  render(
    <MemoryRouter>
      <DueToday tasks={[]} memberNames={new Map()} onToggle={() => {}} {...props} />
    </MemoryRouter>,
  );

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(NOW);
});
afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

describe('DueToday', () => {
  it('counts every task but lists only up to the limit', () => {
    const tasks = [
      ...Array.from({ length: 10 }, () => task({ due_date: day(-2) })),
      task({ due_date: day(0) }),
      task({ due_date: day(0), status: 'completed' }),
    ];
    renderCard({ tasks, limit: 8 });

    expect(screen.getByText('11 open · 10 late')).toBeTruthy();
    expect(screen.getAllByRole('listitem')).toHaveLength(8);
  });

  it('lists everything without a limit', () => {
    renderCard({ tasks: [task({}), task({}), task({})] });
    expect(screen.getAllByRole('listitem')).toHaveLength(3);
    expect(screen.getByText('3 open')).toBeTruthy();
  });

  it('labels each task by when it is due, who does it and how it repeats', () => {
    renderCard({
      tasks: [
        task({ title: 'Late one', due_date: day(-1), assigned_to: 'u1', task_type: 'irrigation', recurrence: 'weekly' }),
        task({ title: 'Upcoming', due_date: day(2), priority: 'high' }),
        task({ title: 'Finished', status: 'completed' }),
        task({ title: 'Cancelled', status: 'cancelled' }),
      ],
      memberNames: new Map([['u1', 'Anita']]),
    });

    const row = (title: string) => screen.getByText(title).closest('li')!;
    expect(row('Late one').textContent).toContain('Late');
    expect(row('Late one').textContent).toContain('Anita');
    expect(row('Late one').textContent).toContain('irrigation');
    expect(row('Late one').textContent).toContain('Every week');
    expect(row('Upcoming').textContent).toContain(format(new Date(2026, 10, 7), 'EEE d MMM'));
    expect(row('Upcoming').textContent).toContain('High');
    expect(row('Finished').textContent).toContain('Done');
    // Cancelled work is not counted as open.
    expect(screen.getByText('2 open · 1 late')).toBeTruthy();
  });

  it('reports ticking a task', () => {
    const onToggle = vi.fn();
    const t = task({ title: 'Milk cows' });
    renderCard({ tasks: [t], onToggle });
    fireEvent.click(screen.getByRole('checkbox'));
    expect(onToggle).toHaveBeenCalledWith(t, true);
  });

  it('says so when nothing is due', () => {
    renderCard({ tasks: [] });
    expect(screen.getByText(/Nothing due/)).toBeTruthy();
  });
});
