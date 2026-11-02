import { supabase } from '@/integrations/supabase/client';
import type { Tables } from '@/integrations/supabase/types';
import { nextDueDate } from '@/lib/tasks';

export type TaskRow = Tables<'tasks'>;

/**
 * Mark a task done or open again. Completing a repeating task also creates
 * its next occurrence, so routine work (feeding, cleaning, servicing) keeps
 * appearing without being re-entered.
 *
 * @returns the next occurrence's due date when one was created
 */
export async function setTaskCompleted(task: TaskRow, completed: boolean): Promise<string | null> {
  const { error } = await supabase
    .from('tasks')
    .update({
      status: completed ? 'completed' : 'pending',
      completed_at: completed ? new Date().toISOString() : null,
    })
    .eq('id', task.id);
  if (error) throw error;

  if (!completed) return null;

  const next = nextDueDate(task.due_date, task.recurrence);
  if (!next) return null;

  const { error: insertError } = await supabase.from('tasks').insert({
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
  });
  if (insertError) throw insertError;
  return next;
}
