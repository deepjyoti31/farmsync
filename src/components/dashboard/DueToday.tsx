import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { format, parseISO } from 'date-fns';
import { Plus, Repeat } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { dueState, PRIORITY_LABELS, RECURRENCE_LABELS, type Priority, type Recurrence } from '@/lib/tasks';
import type { TaskRow } from '@/components/tasks/taskApi';
import { cn } from '@/lib/utils';
import DashboardCard from './DashboardCard';

interface DueTodayProps {
  tasks: TaskRow[];
  memberNames: Map<string, string>;
  onToggle: (task: TaskRow, completed: boolean) => void;
}

const priorityVariant = { high: 'destructive', medium: 'warning', low: 'secondary' } as const;

/** Open work that is late, due today, or coming up in the next few days. */
const DueToday = ({ tasks, memberNames, onToggle }: DueTodayProps) => {
  const { t } = useTranslation();
  const open = tasks.filter((task) => task.status !== 'completed' && task.status !== 'cancelled');
  const late = open.filter((task) => dueState(task.due_date) === 'overdue').length;

  const meta = [
    t('today.due.open', { count: open.length, defaultValue: '{{count}} open' }),
    late > 0 ? t('today.due.late', { count: late, defaultValue: '{{count}} late' }) : null,
  ]
    .filter(Boolean)
    .join(' · ');

  return (
    <DashboardCard title={t('today.due.title', 'Due today and next')} meta={meta} link={{ to: '/dashboard/tasks', label: t('today.due.all', 'All tasks') }} flush>
      {tasks.length === 0 ? (
        <p className="px-5 py-8 text-center text-muted-foreground md:px-6">{t('today.due.none', 'Nothing due. Enjoy the quiet, or plan the week ahead.')}</p>
      ) : (
        <ul>
          {tasks.map((task) => {
            const done = task.status === 'completed';
            const state = dueState(task.due_date);
            const prio = (task.priority || 'medium') as Priority;
            const who = task.assigned_to ? memberNames.get(task.assigned_to) : undefined;
            const repeat = task.recurrence && task.recurrence !== 'none' ? RECURRENCE_LABELS[task.recurrence as Recurrence] : null;
            const when = done
              ? t('today.due.done', 'Done')
              : state === 'overdue'
                ? t('today.due.overdue', 'Late')
                : state === 'today'
                  ? t('today.due.today', 'Today')
                  : task.due_date
                    ? format(parseISO(task.due_date), 'EEE d MMM')
                    : '';
            const id = `due-${task.id}`;
            return (
              <li key={task.id} className="flex min-h-16 items-center gap-3.5 border-b border-muted px-5 py-3 md:px-6">
                <Checkbox id={id} checked={done} onCheckedChange={(v) => onToggle(task, v === true)} className="h-[22px] w-[22px]" />
                <label htmlFor={id} className="flex min-w-0 flex-1 cursor-pointer flex-col gap-0.5">
                  <span className={cn('text-[15px] font-semibold', done && 'text-muted-foreground line-through')}>{task.title}</span>
                  <span className="flex flex-wrap gap-x-3 gap-y-0.5 text-[13px] text-muted-foreground">
                    {who && <span>{who}</span>}
                    {task.task_type && <span className="capitalize">{task.task_type}</span>}
                    {repeat && (
                      <span className="inline-flex items-center gap-1">
                        <Repeat className="h-3 w-3" aria-hidden="true" />
                        {repeat}
                      </span>
                    )}
                  </span>
                </label>
                <span className={cn('whitespace-nowrap font-mono text-[13px]', state === 'overdue' && !done ? 'font-medium text-rust' : 'text-muted-foreground')}>
                  {when}
                </span>
                <Badge variant={priorityVariant[prio] ?? 'secondary'} className="hidden sm:inline-flex">
                  {PRIORITY_LABELS[prio] ?? prio}
                </Badge>
              </li>
            );
          })}
        </ul>
      )}
      <Link
        to="/dashboard/tasks"
        className="flex h-12 items-center justify-center gap-1.5 bg-background/60 text-sm font-semibold text-primary hover:bg-accent"
      >
        <Plus className="h-4 w-4" aria-hidden="true" /> {t('today.due.add', 'Add a task')}
      </Link>
    </DashboardCard>
  );
};

export default DueToday;
