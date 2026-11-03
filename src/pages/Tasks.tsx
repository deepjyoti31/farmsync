import React, { useMemo, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { format, parseISO } from 'date-fns';
import { CalendarDays, ClipboardList, Edit, Loader2, Plus, Repeat, User } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DeleteButton } from '@/components/common/DeleteButton';
import FarmSelector from '@/components/farms/FarmSelector';
import TaskFormDialog from '@/components/tasks/TaskFormDialog';
import { setTaskCompleted, type TaskRow } from '@/components/tasks/taskApi';
import { toast } from '@/hooks/use-toast';
import { useFarmMembers } from '@/hooks/useFarmMembers';
import { supabase } from '@/integrations/supabase/client';
import { RECURRENCE_LABELS, dueState, isCompleted, sortTasks, type Recurrence } from '@/lib/tasks';
import { cn } from '@/lib/utils';

type Filter = 'open' | 'completed' | 'all';

const DUE_STYLES: Record<string, string> = {
  overdue: 'text-destructive font-medium',
  today: 'text-amber-600 font-medium',
  soon: 'text-foreground',
  later: 'text-muted-foreground',
};

const PRIORITY_VARIANT: Record<string, 'destructive' | 'secondary' | 'outline'> = {
  high: 'destructive',
  medium: 'secondary',
  low: 'outline',
};

const Tasks = () => {
  const [selectedFarmId, setSelectedFarmId] = useState<string | null>(null);
  const [filter, setFilter] = useState<Filter>('open');
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

  const visible = useMemo(() => {
    const filtered = tasks.filter((t) =>
      filter === 'all' ? true : filter === 'completed' ? isCompleted(t) : !isCompleted(t),
    );
    return sortTasks(filtered);
  }, [tasks, filter]);

  const openCount = tasks.filter((t) => !isCompleted(t)).length;
  const overdueCount = tasks.filter((t) => !isCompleted(t) && dueState(t.due_date) === 'overdue').length;

  const toggle = async (task: TaskRow, completed: boolean) => {
    setPendingId(task.id);
    try {
      const next = await setTaskCompleted(task, completed);
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      if (next) {
        toast({ title: 'Task completed', description: `Next one scheduled for ${format(parseISO(next), 'dd MMM yyyy')}.` });
      }
    } catch (e) {
      toast({ title: 'Could not update task', description: (e as Error).message, variant: 'destructive' });
    } finally {
      setPendingId(null);
    }
  };

  const remove = async (task: TaskRow) => {
    const { error } = await supabase.from('tasks').delete().eq('id', task.id);
    if (error) {
      toast({ title: 'Could not delete task', description: error.message, variant: 'destructive' });
      return;
    }
    queryClient.invalidateQueries({ queryKey: ['tasks'] });
    toast({ title: 'Task deleted' });
  };

  const openForm = (task: TaskRow | null) => {
    setEditing(task);
    setFormOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h1 className="page-title">Tasks</h1>
          <p className="mt-1 text-muted-foreground">
            Plan farm work, assign it to your team and keep routine jobs on schedule.
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <FarmSelector selectedFarmId={selectedFarmId} onFarmChange={setSelectedFarmId} />
          <Button className="gap-2" disabled={!selectedFarmId} onClick={() => openForm(null)}>
            <Plus className="h-4 w-4" />
            New task
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader className="flex flex-col gap-3 space-y-0 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle className="text-lg">
            {openCount} open{overdueCount > 0 && <span className="text-destructive"> · {overdueCount} overdue</span>}
          </CardTitle>
          <Tabs value={filter} onValueChange={(v) => setFilter(v as Filter)}>
            <TabsList>
              <TabsTrigger value="open">Open</TabsTrigger>
              <TabsTrigger value="completed">Completed</TabsTrigger>
              <TabsTrigger value="all">All</TabsTrigger>
            </TabsList>
          </Tabs>
        </CardHeader>
        <CardContent>
          {!selectedFarmId || isLoading ? (
            <div className="flex justify-center p-12"><Loader2 className="h-8 w-8 animate-spin" /></div>
          ) : visible.length === 0 ? (
            <div className="flex flex-col items-center gap-2 p-12 text-center">
              <ClipboardList className="h-10 w-10 text-muted-foreground/50" />
              <p className="font-medium">{filter === 'completed' ? 'No completed tasks yet' : 'Nothing to do'}</p>
              {filter !== 'completed' && (
                <Button variant="outline" className="mt-2 gap-2" onClick={() => openForm(null)}>
                  <Plus className="h-4 w-4" /> Add a task
                </Button>
              )}
            </div>
          ) : (
            <ul className="divide-y">
              {visible.map((task) => {
                const done = isCompleted(task);
                const state = dueState(task.due_date);
                return (
                  <li key={task.id} className="flex items-start gap-3 py-3">
                    <Checkbox
                      className="mt-1"
                      checked={done}
                      disabled={pendingId === task.id}
                      onCheckedChange={(checked) => toggle(task, checked === true)}
                      aria-label={done ? `Mark "${task.title}" as not done` : `Mark "${task.title}" as done`}
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={cn('font-medium', done && 'text-muted-foreground line-through')}>
                          {task.title}
                        </span>
                        {!done && task.priority && (
                          <Badge variant={PRIORITY_VARIANT[task.priority] ?? 'secondary'} className="capitalize">
                            {task.priority}
                          </Badge>
                        )}
                      </div>
                      {task.description && (
                        <p className="mt-1 text-sm text-muted-foreground">{task.description}</p>
                      )}
                      <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                        {task.due_date && (
                          <span className={cn('flex items-center gap-1', !done && DUE_STYLES[state])}>
                            <CalendarDays className="h-3 w-3" />
                            {state === 'today' && !done ? 'Today' : format(parseISO(task.due_date), 'dd MMM yyyy')}
                            {state === 'overdue' && !done && ' (overdue)'}
                          </span>
                        )}
                        {task.recurrence && task.recurrence !== 'none' && (
                          <span className="flex items-center gap-1">
                            <Repeat className="h-3 w-3" />
                            {RECURRENCE_LABELS[task.recurrence as Recurrence]}
                          </span>
                        )}
                        {task.assigned_to && (
                          <span className="flex items-center gap-1">
                            <User className="h-3 w-3" />
                            {memberName.get(task.assigned_to) ?? 'Team member'}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex shrink-0 items-center">
                      <Button variant="ghost" size="sm" onClick={() => openForm(task)} aria-label={`Edit "${task.title}"`}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <DeleteButton
                        onDelete={() => remove(task)}
                        itemName={task.title}
                        entityType="Task"
                        buttonSize="sm"
                        buttonVariant="ghost"
                      />
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </CardContent>
      </Card>

      {selectedFarmId && (
        <TaskFormDialog farmId={selectedFarmId} open={formOpen} onOpenChange={setFormOpen} task={editing} />
      )}
    </div>
  );
};

export default Tasks;
