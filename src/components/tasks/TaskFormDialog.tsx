import React, { useEffect, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/hooks/use-toast';
import { useFarmMembers } from '@/hooks/useFarmMembers';
import { supabase } from '@/integrations/supabase/client';
import { PRIORITIES, PRIORITY_LABELS, RECURRENCES, RECURRENCE_LABELS } from '@/lib/tasks';
import type { TaskRow } from './taskApi';

const UNASSIGNED = 'unassigned';

interface TaskFormDialogProps {
  farmId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Task to edit; omit to create a new one. */
  task?: TaskRow | null;
}

const emptyForm = {
  title: '',
  description: '',
  due_date: '',
  priority: 'medium',
  recurrence: 'none',
  assigned_to: UNASSIGNED,
};

const TaskFormDialog: React.FC<TaskFormDialogProps> = ({ farmId, open, onOpenChange, task }) => {
  const queryClient = useQueryClient();
  const { data: members = [] } = useFarmMembers(open ? farmId : null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setForm(
      task
        ? {
            title: task.title,
            description: task.description ?? '',
            due_date: task.due_date ?? '',
            priority: task.priority ?? 'medium',
            recurrence: task.recurrence ?? 'none',
            assigned_to: task.assigned_to ?? UNASSIGNED,
          }
        : emptyForm,
    );
  }, [open, task]);

  const set = (key: keyof typeof emptyForm) => (value: string) => setForm((f) => ({ ...f, [key]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const title = form.title.trim();
    if (!title) {
      toast({ title: 'Title is required', variant: 'destructive' });
      return;
    }
    if (form.recurrence !== 'none' && !form.due_date) {
      toast({ title: 'Add a due date', description: 'Repeating tasks need a first due date.', variant: 'destructive' });
      return;
    }

    const values = {
      title,
      description: form.description.trim() || null,
      due_date: form.due_date || null,
      priority: form.priority,
      recurrence: form.recurrence,
      assigned_to: form.assigned_to === UNASSIGNED ? null : form.assigned_to,
    };

    setSaving(true);
    const { error } = task
      ? await supabase.from('tasks').update(values).eq('id', task.id)
      : await supabase.from('tasks').insert({ ...values, farm_id: farmId, status: 'pending' });
    setSaving(false);

    if (error) {
      toast({ title: 'Could not save task', description: error.message, variant: 'destructive' });
      return;
    }
    queryClient.invalidateQueries({ queryKey: ['tasks'] });
    toast({ title: task ? 'Task updated' : 'Task added' });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{task ? 'Edit task' : 'New task'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="task-title">Title</Label>
            <Input
              id="task-title"
              value={form.title}
              onChange={(e) => set('title')(e.target.value)}
              placeholder="e.g. Irrigate north field"
              maxLength={200}
              autoFocus
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="task-description">Notes</Label>
            <Textarea
              id="task-description"
              value={form.description}
              onChange={(e) => set('description')(e.target.value)}
              rows={3}
            />
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="task-due">Due date</Label>
              <Input id="task-due" type="date" value={form.due_date} onChange={(e) => set('due_date')(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Priority</Label>
              <Select value={form.priority} onValueChange={set('priority')}>
                <SelectTrigger aria-label="Priority"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {PRIORITIES.map((p) => (
                    <SelectItem key={p} value={p}>{PRIORITY_LABELS[p]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Repeat</Label>
              <Select value={form.recurrence} onValueChange={set('recurrence')}>
                <SelectTrigger aria-label="Repeat"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {RECURRENCES.map((r) => (
                    <SelectItem key={r} value={r}>{RECURRENCE_LABELS[r]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Assigned to</Label>
              <Select value={form.assigned_to} onValueChange={set('assigned_to')}>
                <SelectTrigger aria-label="Assigned to"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value={UNASSIGNED}>Unassigned</SelectItem>
                  {members.map((m) => (
                    <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={saving}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {task ? 'Save changes' : 'Add task'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default TaskFormDialog;
