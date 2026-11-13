import { supabase } from '@/integrations/supabase/client';
import type { Tables } from '@/integrations/supabase/types';
import { nextDueDate, nextRecurrenceDay } from '@/lib/tasks';
import { updateByIdOrThrow } from '@/utils/deleteUtils';

export type TaskRow = Tables<'tasks'>;

/**
 * Mark a task done or open again. Completing a repeating task also creates
 * its next occurrence, so routine work (feeding, cleaning, servicing) keeps
 * appearing without being re-entered.
 *
 * @returns the next occurrence's due date when one was created
 */
export async function setTaskCompleted(task: TaskRow, completed: boolean): Promise<string | null> {
  // Throws when the change was not saved (a viewer, or a deleted task), so a
  // repeating task never moves on without its current occurrence being done.
  await updateByIdOrThrow(
    'tasks',
    task.id,
    { status: completed ? 'completed' : 'pending', completed_at: completed ? new Date().toISOString() : null },
    'This task',
  );

  // Only a task that was open moves the series on. Ticking an already-done
  // task again changes nothing.
  if (!completed || task.status === 'completed') return null;

  const next = nextDueDate(task.due_date, task.recurrence, task.recurrence_day);
  if (!next) return null;

  // Unticking and re-ticking a repeating task must not create the next one twice.
  const { data: existing, error: lookupError } = await supabase
    .from('tasks')
    .select('id')
    .eq('farm_id', task.farm_id)
    .eq('title', task.title)
    .eq('recurrence', task.recurrence ?? 'none')
    .eq('due_date', next)
    .limit(1);
  if (lookupError) throw lookupError;
  if (existing && existing.length > 0) return next;

  const occurrence = {
    farm_id: task.farm_id,
    title: task.title,
    description: task.description,
    priority: task.priority,
    task_type: task.task_type,
    related_id: task.related_id,
    assigned_to: task.assigned_to,
    recurrence: task.recurrence,
    due_date: next,
    status: 'pending',
  };
  // Remember the day the series aims for when a short month moved this
  // occurrence earlier (31 Jan, 28 Feb, then 31 Mar again, not 28 Mar).
  const anchor = nextRecurrenceDay(task.due_date, task.recurrence, task.recurrence_day);
  let { error: insertError } = await supabase.from('tasks').insert(anchor ? { ...occurrence, recurrence_day: anchor } : occurrence);
  // A database without the recurrence_day column (migration not applied yet)
  // must still get its next occurrence.
  if (insertError && anchor && (insertError.code === 'PGRST204' || insertError.code === '42703')) {
    ({ error: insertError } = await supabase.from('tasks').insert(occurrence));
  }
  if (insertError) throw insertError;
  return next;
}

/** Move a task to "To do" or "In progress" on the board (reopening it if it was done). */
export async function setTaskStatus(task: TaskRow, status: 'pending' | 'in_progress'): Promise<void> {
  await updateByIdOrThrow('tasks', task.id, { status, completed_at: null }, 'This task');
}
