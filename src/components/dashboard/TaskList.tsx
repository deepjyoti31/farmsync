
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Calendar, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { Task } from '@/types';

interface TaskListProps {
  tasks: Task[];
}

const TaskList: React.FC<TaskListProps> = ({ tasks }) => {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return format(date, 'dd MMM yyyy');
  };

  const isOverdue = (dateString: string) => {
    const dueDate = new Date(dateString);
    const today = new Date();
    return dueDate < today && !isToday(dueDate);
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear();
  };

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
                <Checkbox id={`task-${task.id}`} checked={task.completed} />
                <div className="grid gap-1">
                  <label
                    htmlFor={`task-${task.id}`}
                    className={`font-medium peer-checked:line-through ${task.completed ? 'text-muted-foreground line-through' : ''}`}
                  >
                    {task.title}
                  </label>
                  <div className="flex items-center text-xs text-muted-foreground">
                    <Calendar className="h-3 w-3 mr-1" />
                    <span className={isOverdue(task.dueDate) ? 'text-destructive' : ''}>
                      {isToday(new Date(task.dueDate)) ? 'Today' : formatDate(task.dueDate)}
                    </span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default TaskList;
