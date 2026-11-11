import { addDays, addMonths, addWeeks, addYears, differenceInCalendarDays, format, getDaysInMonth, parseISO, setDate } from 'date-fns';

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
  /** Day of the month a monthly or yearly series aims for, when a short month moved this occurrence earlier. */
  recurrence_day?: number | null;
}

export const isCompleted = (task: Pick<TaskLike, 'status'>) => task.status === 'completed';

/**
 * Due date of the next occurrence of a repeating task, as yyyy-MM-dd.
 * Returns null for non-repeating tasks or tasks without a due date.
 *
 * Monthly tasks due on the 31st fall back to the last day of shorter months.
 * `anchorDay` is the day of the month the series was set up for: without it a
 * task due on the 31st would move to the 28th in February and then stay on the
 * 28th for good (and a yearly task due on 29 February would never return to it).
 */
export function nextDueDate(dueDate: string | null, recurrence: string | null | undefined, anchorDay?: number | null): string | null {
  if (!dueDate || !recurrence || recurrence === 'none') return null;
  const due = parseISO(dueDate);
  // addMonths and addYears already clamp to the end of a shorter month.
  const onAnchor = (d: Date) => setDate(d, Math.min(anchorDay && anchorDay >= 1 && anchorDay <= 31 ? anchorDay : due.getDate(), getDaysInMonth(d)));
  const next = {
    daily: () => addDays(due, 1),
    weekly: () => addWeeks(due, 1),
    monthly: () => onAnchor(addMonths(due, 1)),
    yearly: () => onAnchor(addYears(due, 1)),
  }[recurrence as Exclude<Recurrence, 'none'>];
  return next ? format(next(), 'yyyy-MM-dd') : null;
}

/**
 * The `recurrence_day` to store on the next occurrence: the day of the month
 * the series aims for, or null when the next occurrence already falls on it.
 */
export function nextRecurrenceDay(
  dueDate: string | null,
  recurrence: string | null | undefined,
  anchorDay?: number | null,
): number | null {
  if (recurrence !== 'monthly' && recurrence !== 'yearly') return null;
  const next = nextDueDate(dueDate, recurrence, anchorDay);
  if (!dueDate || !next) return null;
  const anchor = anchorDay && anchorDay >= 1 && anchorDay <= 31 ? anchorDay : parseISO(dueDate).getDate();
  return parseISO(next).getDate() === anchor ? null : anchor;
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
