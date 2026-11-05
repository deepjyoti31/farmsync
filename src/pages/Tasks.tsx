import React, { useMemo, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { format, parseISO } from 'date-fns';
import { ClipboardList, Edit, Loader2, Plus, Repeat, Search } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DeleteButton } from '@/components/common/DeleteButton';
import PageHeader from '@/components/common/PageHeader';
import Segmented from '@/components/common/Segmented';
import FarmSelector from '@/components/farms/FarmSelector';
import TaskFormDialog from '@/components/tasks/TaskFormDialog';
import { setTaskCompleted, setTaskStatus, type TaskRow } from '@/components/tasks/taskApi';
import { toast } from '@/hooks/use-toast';
import { useFarmMembers } from '@/hooks/useFarmMembers';
import { supabase } from '@/integrations/supabase/client';
import { deleteById } from '@/utils/deleteUtils';
import {
  PRIORITY_LABELS,
  RECURRENCE_LABELS,
  TASK_GROUP_LABELS,
  boardColumn,
  dueState,
  groupTasksByDue,
  isCompleted,
  sortTasks,
  type BoardColumn,
  type Priority,
  type Recurrence,
} from '@/lib/tasks';
import { cn } from '@/lib/utils';

type Filter = 'open' | 'completed' | 'all';
type View = 'list' | 'board';
const ANYONE = 'anyone';
const UNASSIGNED = 'unassigned';

const PRIORITY_VARIANT = { high: 'destructive', medium: 'warning', low: 'secondary' } as const;
const BOARD_LABELS: Record<BoardColumn, string> = { pending: 'To do', in_progress: 'In progress', completed: 'Done' };

const initials = (name: string | undefined) =>
  (name || '?')
    .split(/\s+/)
    .map((p) => p.charAt(0))
    .join('')
    .slice(0, 2)
    .toUpperCase();

const dueLabel = (task: TaskRow) => {
  if (!task.due_date) return 'No date';
  const state = dueState(task.due_date);
  if (isCompleted(task)) return format(parseISO(task.due_date), 'd MMM');
  if (state === 'today') return 'Today';
  return format(parseISO(task.due_date), 'EEE d MMM');
};

const Tasks = () => {
  const [selectedFarmId, setSelectedFarmId] = useState<string | null>(null);
  const [filter, setFilter] = useState<Filter>('open');
  const [view, setView] = useState<View>('list');
  const [query, setQuery] = useState('');
  const [assignee, setAssignee] = useState<string>(ANYONE);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<TaskRow | null>(null);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const queryClient = useQueryClient();
  const { data: members = [] } = useFarmMembers(selectedFarmId);

  const { data: tasks = [], isLoading } = useQuery({
    queryKey: ['tasks', selectedFarmId, 'all'],
    enabled: !!selectedFarmId,
    queryFn: async () => {
      const { data, error } = await supabase.from('tasks').select('*').eq('farm_id', selectedFarmId!);
      if (error) throw error;
      return data ?? [];
    },
  });

  const memberName = useMemo(() => new Map(members.map((m) => [m.id, m.name])), [members]);

  // The board always shows every status; the list follows the Open / Done / All filter.
  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return tasks.filter((t) => {
      if (view === 'list' && filter !== 'all' && (filter === 'completed') !== isCompleted(t)) return false;
      if (assignee === UNASSIGNED && t.assigned_to) return false;
      if (assignee !== ANYONE && assignee !== UNASSIGNED && t.assigned_to !== assignee) return false;
      if (q && !`${t.title} ${t.description ?? ''} ${t.task_type ?? ''}`.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [tasks, filter, view, query, assignee]);

  const groups = useMemo(() => groupTasksByDue(visible), [visible]);
  const columns = useMemo(
    () =>
      (['pending', 'in_progress', 'completed'] as BoardColumn[]).map((col) => ({
        col,
        tasks: sortTasks(visible.filter((t) => boardColumn(t) === col)),
      })),
    [visible],
  );

  const openCount = tasks.filter((t) => !isCompleted(t)).length;
  const lateCount = tasks.filter((t) => !isCompleted(t) && dueState(t.due_date) === 'overdue').length;
  const selected = tasks.find((t) => t.id === selectedId) ?? (view === 'list' ? groups[0]?.tasks[0] : columns[0].tasks[0]) ?? null;

  const refresh = () => queryClient.invalidateQueries({ queryKey: ['tasks'] });

  const toggle = async (task: TaskRow, completed: boolean) => {
    setPendingId(task.id);
    try {
      const next = await setTaskCompleted(task, completed);
      refresh();
      if (next) toast({ title: 'Task done', description: `The next one is due ${format(parseISO(next), 'd MMM yyyy')}.` });
    } catch (e) {
      toast({ title: 'Could not update the task', description: (e as Error).message, variant: 'destructive' });
    } finally {
      setPendingId(null);
    }
  };

  const move = async (task: TaskRow, to: BoardColumn) => {
    if (to === boardColumn(task)) return;
    if (to === 'completed') return toggle(task, true);
    // Moving a done task back goes straight to the chosen column; setTaskStatus also clears completed_at.
    setPendingId(task.id);
    try {
      await setTaskStatus(task, to);
      refresh();
    } catch (e) {
      toast({ title: 'Could not move the task', description: (e as Error).message, variant: 'destructive' });
    } finally {
      setPendingId(null);
    }
  };

  const remove = async (task: TaskRow) => {
    const problem = await deleteById('tasks', task.id, 'This task');
    if (problem) {
      toast({ title: 'Could not delete the task', description: problem, variant: 'destructive' });
      return;
    }
    if (selectedId === task.id) setSelectedId(null);
    refresh();
    toast({ title: 'Task deleted' });
  };

  const openForm = (task: TaskRow | null) => {
    setEditing(task);
    setFormOpen(true);
  };

  const prio = (t: TaskRow) => (t.priority || 'medium') as Priority;

  return (
    <div>
      <PageHeader
        title="Tasks"
        description={
          selectedFarmId ? (
            <>
              {openCount} open
              {lateCount > 0 && <span className="font-medium text-rust"> · {lateCount} late</span>}
            </>
          ) : (
            'Plan farm work, assign it to your team and keep routine jobs on schedule.'
          )
        }
        actions={
          <>
            <FarmSelector selectedFarmId={selectedFarmId} onFarmChange={setSelectedFarmId} />
            <Button disabled={!selectedFarmId} onClick={() => openForm(null)}>
              <Plus /> New task
            </Button>
          </>
        }
      />

      <div className="mb-5 flex flex-wrap items-center gap-2.5">
        <label className="flex h-11 min-w-[220px] flex-[1_1_260px] items-center gap-2 rounded-[10px] border border-input bg-card px-3 text-muted-foreground focus-within:border-primary focus-within:ring-4 focus-within:ring-leaf-tint">
          <Search className="h-[18px] w-[18px]" aria-hidden="true" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search tasks"
            aria-label="Search tasks"
            className="min-w-0 flex-1 bg-transparent text-base text-foreground placeholder:text-muted-foreground focus:outline-none"
          />
        </label>
        <Select value={assignee} onValueChange={setAssignee}>
          <SelectTrigger className="w-auto min-w-[170px]" aria-label="Assigned to">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ANYONE}>Anyone</SelectItem>
            <SelectItem value={UNASSIGNED}>Not assigned</SelectItem>
            {members.map((m) => (
              <SelectItem key={m.id} value={m.id}>
                {m.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {view === 'list' && (
          <Segmented
            label="Show"
            value={filter}
            onChange={setFilter}
            options={[
              { value: 'open', label: 'Open' },
              { value: 'completed', label: 'Done' },
              { value: 'all', label: 'All' },
            ]}
          />
        )}
        <Segmented
          label="View"
          value={view}
          onChange={setView}
          className="ms-auto"
          options={[
            { value: 'list', label: 'List' },
            { value: 'board', label: 'Board' },
          ]}
        />
      </div>

      {!selectedFarmId || isLoading ? (
        <div className="flex justify-center p-12" role="status" aria-label="Loading tasks">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : visible.length === 0 ? (
        <div className="surface flex flex-col items-center gap-2 p-12 text-center">
          <ClipboardList className="h-10 w-10 text-muted-foreground/60" aria-hidden="true" />
          <p className="font-semibold">
            {query || assignee !== ANYONE ? 'No tasks match' : filter === 'completed' ? 'Nothing finished yet' : 'Nothing to do'}
          </p>
          {filter !== 'completed' && !query && (
            <Button variant="outline" className="mt-2" onClick={() => openForm(null)}>
              <Plus /> Add a task
            </Button>
          )}
        </div>
      ) : (
        <div className="flex flex-wrap items-start gap-6">
          <div className="flex min-w-0 flex-[2_1_560px] flex-col gap-5">
            {view === 'list' ? (
              groups.map((g) => (
                <section key={g.key} aria-labelledby={`grp-${g.key}`} className="surface overflow-hidden">
                  <h2
                    id={`grp-${g.key}`}
                    className={cn(
                      'flex items-center gap-2 px-5 py-3 font-sans text-sm font-bold',
                      g.key === 'overdue' ? 'bg-rust-tint text-rust' : 'text-foreground',
                    )}
                  >
                    {TASK_GROUP_LABELS[g.key]}
                    <span className="font-mono text-xs font-medium opacity-80">{g.tasks.length}</span>
                  </h2>
                  <ul>
                    {g.tasks.map((task) => {
                      const done = isCompleted(task);
                      const late = !done && dueState(task.due_date) === 'overdue';
                      const isSel = selected?.id === task.id;
                      const who = task.assigned_to ? memberName.get(task.assigned_to) ?? 'Team member' : undefined;
                      return (
                        <li
                          key={task.id}
                          className={cn('flex min-h-16 items-center gap-3.5 border-t border-muted px-5 py-1.5', isSel && 'bg-accent shadow-[inset_3px_0_0_hsl(var(--primary))]')}
                        >
                          <Checkbox
                            checked={done}
                            disabled={pendingId === task.id}
                            onCheckedChange={(c) => toggle(task, c === true)}
                            className="h-[22px] w-[22px]"
                            aria-label={done ? `Mark "${task.title}" as not done` : `Mark "${task.title}" as done`}
                          />
                          <button
                            type="button"
                            onClick={() => setSelectedId(task.id)}
                            aria-current={isSel ? 'true' : undefined}
                            className="flex min-w-0 flex-1 flex-col gap-0.5 py-1.5 text-start"
                          >
                            <span className={cn('text-[15px] font-semibold', done && 'text-muted-foreground line-through')}>{task.title}</span>
                            <span className="flex flex-wrap gap-x-3 gap-y-0.5 text-[13px] text-muted-foreground">
                              {task.task_type && <span className="capitalize">{task.task_type}</span>}
                              {task.recurrence && task.recurrence !== 'none' && (
                                <span className="inline-flex items-center gap-1">
                                  <Repeat className="h-3 w-3" aria-hidden="true" />
                                  {RECURRENCE_LABELS[task.recurrence as Recurrence]}
                                </span>
                              )}
                              {task.description && <span className="max-w-[320px] truncate">{task.description}</span>}
                            </span>
                          </button>
                          {who && (
                            <span title={who} className="hidden h-[30px] w-[30px] shrink-0 items-center justify-center rounded-full bg-leaf-tint text-xs font-bold text-[#1A4D2C] sm:flex dark:text-foreground">
                              <span className="sr-only">Assigned to </span>
                              {initials(who)}
                            </span>
                          )}
                          <span className={cn('w-[72px] shrink-0 text-end font-mono text-[13px]', late ? 'font-medium text-rust' : 'text-muted-foreground')}>
                            {dueLabel(task)}
                          </span>
                          {!done && (
                            <Badge variant={PRIORITY_VARIANT[prio(task)] ?? 'secondary'} className="hidden md:inline-flex">
                              {PRIORITY_LABELS[prio(task)] ?? task.priority}
                            </Badge>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                </section>
              ))
            ) : (
              <div className="grid grid-cols-[repeat(auto-fit,minmax(220px,1fr))] gap-4">
                {columns.map(({ col, tasks: colTasks }) => (
                  <section key={col} aria-labelledby={`col-${col}`} className="flex min-h-[320px] flex-col gap-2.5 rounded-2xl bg-secondary/70 p-3">
                    <h2 id={`col-${col}`} className="m-1 flex justify-between font-sans text-sm font-bold">
                      {BOARD_LABELS[col]}
                      <span className="font-mono font-medium text-muted-foreground">{colTasks.length}</span>
                    </h2>
                    {colTasks.map((task) => {
                      const late = !isCompleted(task) && dueState(task.due_date) === 'overdue';
                      const who = task.assigned_to ? memberName.get(task.assigned_to) : undefined;
                      return (
                        <article
                          key={task.id}
                          className={cn('flex flex-col gap-2.5 rounded-xl border bg-card p-3.5', selected?.id === task.id && 'border-primary ring-2 ring-leaf-tint')}
                        >
                          <button type="button" onClick={() => setSelectedId(task.id)} className="text-start text-[15px] font-semibold hover:underline">
                            {task.title}
                          </button>
                          <div className="flex flex-wrap items-center gap-2">
                            {!isCompleted(task) && <Badge variant={PRIORITY_VARIANT[prio(task)] ?? 'secondary'}>{PRIORITY_LABELS[prio(task)]}</Badge>}
                            <span className={cn('font-mono text-xs', late ? 'font-medium text-rust' : 'text-muted-foreground')}>{dueLabel(task)}</span>
                            {who && (
                              <span title={who} className="ms-auto flex h-[26px] w-[26px] items-center justify-center rounded-full bg-leaf-tint text-[11px] font-bold text-[#1A4D2C] dark:text-foreground">
                                {initials(who)}
                              </span>
                            )}
                          </div>
                          <Select value={col} onValueChange={(v) => move(task, v as BoardColumn)} disabled={pendingId === task.id}>
                            <SelectTrigger className="h-9 text-sm" aria-label={`Move "${task.title}"`}>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {(Object.keys(BOARD_LABELS) as BoardColumn[]).map((c) => (
                                <SelectItem key={c} value={c}>
                                  {BOARD_LABELS[c]}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </article>
                      );
                    })}
                  </section>
                ))}
              </div>
            )}
          </div>

          {selected && (
            <aside aria-labelledby="task-detail-h" className="surface flex min-w-0 flex-[1_1_300px] flex-col gap-4 p-5 md:sticky md:top-24">
              <div className="flex flex-col gap-2">
                {!isCompleted(selected) ? (
                  <Badge variant={PRIORITY_VARIANT[prio(selected)] ?? 'secondary'} className="self-start">
                    {PRIORITY_LABELS[prio(selected)]} priority
                  </Badge>
                ) : (
                  <Badge variant="info" className="self-start">Done</Badge>
                )}
                <h2 id="task-detail-h" className="text-2xl font-bold leading-tight">
                  {selected.title}
                </h2>
              </div>
              <dl className="grid grid-cols-[96px_1fr] gap-x-3 gap-y-2.5 text-sm">
                <dt className="text-muted-foreground">Status</dt>
                <dd>{BOARD_LABELS[boardColumn(selected)]}</dd>
                <dt className="text-muted-foreground">Assigned</dt>
                <dd>{selected.assigned_to ? memberName.get(selected.assigned_to) ?? 'Team member' : 'Nobody yet'}</dd>
                <dt className="text-muted-foreground">Due</dt>
                <dd className="font-mono">{selected.due_date ? format(parseISO(selected.due_date), 'EEE d MMM yyyy') : 'No date'}</dd>
                <dt className="text-muted-foreground">Repeats</dt>
                <dd>{selected.recurrence && selected.recurrence !== 'none' ? RECURRENCE_LABELS[selected.recurrence as Recurrence] : 'No'}</dd>
                {selected.task_type && (
                  <>
                    <dt className="text-muted-foreground">Type</dt>
                    <dd className="capitalize">{selected.task_type}</dd>
                  </>
                )}
              </dl>
              <div className="flex flex-col gap-1.5">
                <span className="eyebrow">Notes</span>
                <p className="whitespace-pre-line text-[15px] leading-relaxed text-[#34453A] dark:text-muted-foreground">{selected.description || 'No notes.'}</p>
              </div>
              <div className="mt-1 flex flex-wrap gap-2.5">
                <Button size="lg" className="flex-[1_1_140px]" disabled={pendingId === selected.id} onClick={() => toggle(selected, !isCompleted(selected))}>
                  {isCompleted(selected) ? 'Mark not done' : 'Mark done'}
                </Button>
                <Button size="lg" variant="outline" className="flex-[1_1_100px]" onClick={() => openForm(selected)}>
                  <Edit /> Edit
                </Button>
                <DeleteButton onDelete={() => remove(selected)} itemName={selected.title} entityType="Task" buttonSize="lg" buttonVariant="ghost" />
              </div>
            </aside>
          )}
        </div>
      )}

      {selectedFarmId && <TaskFormDialog farmId={selectedFarmId} open={formOpen} onOpenChange={setFormOpen} task={editing} />}
    </div>
  );
};

export default Tasks;
