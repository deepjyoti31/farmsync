import { addDays, addMonths, addWeeks, addYears, differenceInCalendarDays, format, parseISO } from 'date-fns';

export const RECURRENCES = ['none', 'daily', 'weekly', 'monthly', 'yearly'] as const;
export type Recurrence = (typeof RECURRENCES)[number];

export const PRIORITIES = ['low', 'medium', 'high'] as const;
export type Priority = (typeof PRIORITIES)[number];

export const PRIORITY_LABELS: Record<Priority, string> = { low: 'Low', medium: 'Medium', high: 'High' };

export const RECURRENCE_LABELS: Record<Recurrence, string> = {
  none: 'Does not repeat',
  daily: 'Every day',
  weekly: 'Every week',
  monthly: 'Every month',
  yearly: 'Every year',
};

/** Fields of a task row that the helpers below rely on. */
export interface TaskLike {
  id: string;
  title: string;
  due_date: string | null;
  status: string | null;
  priority: string | null;
  recurrence?: string | null;
}

export const isCompleted = (task: Pick<TaskLike, 'status'>) => task.status === 'completed';

/**
 * Due date of the next occurrence of a repeating task, as yyyy-MM-dd.
 * Returns null for non-repeating tasks or tasks without a due date.
 * Monthly tasks due on the 31st fall back to the last day of shorter months.
 */
export function nextDueDate(dueDate: string | null, recurrence: string | null | undefined): string | null {
  if (!dueDate || !recurrence || recurrence === 'none') return null;
  const due = parseISO(dueDate);
  const next = {
    daily: () => addDays(due, 1),
    weekly: () => addWeeks(due, 1),
    monthly: () => addMonths(due, 1),
    yearly: () => addYears(due, 1),
  }[recurrence as Exclude<Recurrence, 'none'>];
  return next ? format(next(), 'yyyy-MM-dd') : null;
}

export type DueState = 'overdue' | 'today' | 'soon' | 'later' | 'none';

/** How urgent a task is relative to `today`. "soon" means within the next 7 days. */
export function dueState(dueDate: string | null, today: Date = new Date()): DueState {
  if (!dueDate) return 'none';
  const days = differenceInCalendarDays(parseISO(dueDate), today);
  if (days < 0) return 'overdue';
  if (days === 0) return 'today';
  if (days <= 7) return 'soon';
  return 'later';
}

const PRIORITY_RANK: Record<string, number> = { high: 0, medium: 1, low: 2 };

/**
 * Open tasks first, ordered by due date (undated last) then priority;
 * completed tasks after, most recently due first.
 */
export function sortTasks<T extends TaskLike>(tasks: T[]): T[] {
  return [...tasks].sort((a, b) => {
    const doneA = isCompleted(a);
    const doneB = isCompleted(b);
    if (doneA !== doneB) return doneA ? 1 : -1;

    if (a.due_date !== b.due_date) {
      if (!a.due_date) return 1;
      if (!b.due_date) return -1;
      return doneA ? b.due_date.localeCompare(a.due_date) : a.due_date.localeCompare(b.due_date);
    }
    const pa = PRIORITY_RANK[a.priority ?? 'medium'] ?? 1;
    const pb = PRIORITY_RANK[b.priority ?? 'medium'] ?? 1;
    if (pa !== pb) return pa - pb;
    return a.title.localeCompare(b.title);
  });
}

export type TaskGroupKey = 'overdue' | 'today' | 'week' | 'later' | 'undated' | 'done';

export const TASK_GROUP_LABELS: Record<TaskGroupKey, string> = {
  overdue: 'Late',
  today: 'Today',
  week: 'Next 7 days',
  later: 'Later',
  undated: 'No date',
  done: 'Done',
};

const GROUP_ORDER: TaskGroupKey[] = ['overdue', 'today', 'week', 'later', 'undated', 'done'];

/**
 * Splits tasks into the sections shown on the Tasks screen, in display order,
 * leaving out empty sections. Each section is sorted with `sortTasks`.
 */
export function groupTasksByDue<T extends TaskLike>(tasks: T[], today: Date = new Date()): { key: TaskGroupKey; tasks: T[] }[] {
  const buckets = new Map<TaskGroupKey, T[]>();
  for (const task of tasks) {
    let key: TaskGroupKey;
    if (isCompleted(task)) key = 'done';
    else {
      const state = dueState(task.due_date, today);
      key = state === 'overdue' ? 'overdue' : state === 'today' ? 'today' : state === 'soon' ? 'week' : state === 'later' ? 'later' : 'undated';
    }
    buckets.set(key, [...(buckets.get(key) ?? []), task]);
  }
  return GROUP_ORDER.filter((k) => buckets.has(k)).map((key) => ({ key, tasks: sortTasks(buckets.get(key)!) }));
}

export type BoardColumn = 'pending' | 'in_progress' | 'completed';

/** Board column for a task. Cancelled and unknown statuses sit with "To do". */
export const boardColumn = (task: Pick<TaskLike, 'status'>): BoardColumn =>
  task.status === 'completed' ? 'completed' : task.status === 'in_progress' ? 'in_progress' : 'pending';
