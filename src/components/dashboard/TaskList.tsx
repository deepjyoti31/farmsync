
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Calendar } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { dueState } from '@/lib/tasks';
import { Link } from 'react-router-dom';
import { Task } from '@/types';

interface TaskListProps {
  tasks: Task[];
  /** Called when a task's checkbox is toggled. Without it the checkboxes are read-only. */
  onToggle?: (taskId: string, completed: boolean) => void;
}

const TaskList: React.FC<TaskListProps> = ({ tasks, onToggle }) => {
  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="text-lg">Upcoming Tasks</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {tasks.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">No upcoming tasks</p>
          ) : (
            tasks.map((task) => (
              <div key={task.id} className="flex items-start gap-2 pb-4 border-b last:border-b-0 last:pb-0">
                <Checkbox
                  id={`task-${task.id}`}
                  checked={task.completed}
                  disabled={!onToggle}
                  onCheckedChange={(checked) => onToggle?.(task.id, checked === true)}
                />
                <div className="grid gap-1">
                  <label
                    htmlFor={`task-${task.id}`}
                    className={`font-medium peer-checked:line-through ${task.completed ? 'text-muted-foreground line-through' : ''}`}
                  >
                    {task.title}
                  </label>
                  {task.dueDate && (
                    <div className="flex items-center text-xs text-muted-foreground">
                      <Calendar className="h-3 w-3 mr-1" />
                      <span className={dueState(task.dueDate) === 'overdue' ? 'text-destructive' : ''}>
                        {dueState(task.dueDate) === 'today' ? 'Today' : format(parseISO(task.dueDate), 'dd MMM yyyy')}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
        <div className="mt-4 text-right">
          <Link to="/dashboard/tasks" className="text-sm font-medium text-primary hover:underline">
            View all tasks
          </Link>
        </div>
      </CardContent>
    </Card>
  );
};

export default TaskList;
