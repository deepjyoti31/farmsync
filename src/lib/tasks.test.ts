import { describe, expect, it } from 'vitest';
import { boardColumn, dueState, groupTasksByDue, nextDueDate, sortTasks, type TaskLike } from './tasks';

describe('nextDueDate', () => {
  it('advances by the recurrence interval', () => {
    expect(nextDueDate('2026-11-02', 'daily')).toBe('2026-11-03');
    expect(nextDueDate('2026-11-02', 'weekly')).toBe('2026-11-09');
    expect(nextDueDate('2026-11-02', 'monthly')).toBe('2026-12-02');
    expect(nextDueDate('2026-11-02', 'yearly')).toBe('2027-11-02');
  });

  it('crosses month and year boundaries', () => {
    expect(nextDueDate('2026-12-31', 'daily')).toBe('2027-01-01');
    expect(nextDueDate('2026-12-28', 'weekly')).toBe('2027-01-04');
  });

  it('clamps monthly tasks to the end of shorter months', () => {
    expect(nextDueDate('2026-01-31', 'monthly')).toBe('2026-02-28');
  });

  it('returns null when the task does not repeat or has no date', () => {
    expect(nextDueDate('2026-11-02', 'none')).toBeNull();
    expect(nextDueDate('2026-11-02', null)).toBeNull();
    expect(nextDueDate(null, 'weekly')).toBeNull();
  });
});

describe('dueState', () => {
  const today = new Date(2026, 10, 2, 9, 0);
  it('classifies due dates relative to today', () => {
    expect(dueState('2026-11-01', today)).toBe('overdue');
    expect(dueState('2026-11-02', today)).toBe('today');
    expect(dueState('2026-11-09', today)).toBe('soon');
    expect(dueState('2026-11-10', today)).toBe('later');
    expect(dueState(null, today)).toBe('none');
  });
});

describe('sortTasks', () => {
  const task = (id: string, overrides: Partial<TaskLike>): TaskLike => ({
    id,
    title: id,
    due_date: null,
    status: 'pending',
    priority: 'medium',
    ...overrides,
  });

  it('puts open tasks first, by due date then priority, undated last', () => {
    const sorted = sortTasks([
      task('done', { status: 'completed', due_date: '2026-01-01' }),
      task('undated', {}),
      task('later', { due_date: '2026-11-20' }),
      task('soon-low', { due_date: '2026-11-05', priority: 'low' }),
      task('soon-high', { due_date: '2026-11-05', priority: 'high' }),
    ]);
    expect(sorted.map((t) => t.id)).toEqual(['soon-high', 'soon-low', 'later', 'undated', 'done']);
  });

  it('orders completed tasks most recent first', () => {
    const sorted = sortTasks([
      task('old', { status: 'completed', due_date: '2026-01-01' }),
      task('new', { status: 'completed', due_date: '2026-10-01' }),
    ]);
    expect(sorted.map((t) => t.id)).toEqual(['new', 'old']);
  });
});

describe('groupTasksByDue', () => {
  const today = new Date(2026, 10, 3);
  const t = (id: string, due_date: string | null, status = 'pending'): TaskLike => ({ id, title: id, due_date, status, priority: 'medium' });

  it('puts each task in one section, in display order, without empty sections', () => {
    const groups = groupTasksByDue(
      [t('later', '2026-12-01'), t('late', '2026-11-01'), t('done', '2026-11-03', 'completed'), t('none', null), t('today', '2026-11-03'), t('week', '2026-11-06')],
      today,
    );
    expect(groups.map((g) => g.key)).toEqual(['overdue', 'today', 'week', 'later', 'undated', 'done']);
    expect(groups.map((g) => g.tasks.map((x) => x.id))).toEqual([['late'], ['today'], ['week'], ['later'], ['none'], ['done']]);
    expect(groupTasksByDue([t('a', '2026-11-03')], today).map((g) => g.key)).toEqual(['today']);
  });
});

describe('boardColumn', () => {
  it('maps statuses to board columns', () => {
    expect(boardColumn({ status: 'in_progress' })).toBe('in_progress');
    expect(boardColumn({ status: 'completed' })).toBe('completed');
    expect(boardColumn({ status: 'cancelled' })).toBe('pending');
    expect(boardColumn({ status: null })).toBe('pending');
  });
});
