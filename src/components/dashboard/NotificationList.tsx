
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Bell, Info, AlertTriangle, AlertCircle } from 'lucide-react';
import { Notification } from '@/types';

interface NotificationListProps {
  notifications: Notification[];
}

const NotificationList: React.FC<NotificationListProps> = ({ notifications }) => {
  const getIcon = (type: string) => {
    switch (type) {
      case 'info':
        return <Info className="h-4 w-4 text-farm-sky" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-farm-yellow" />;
      case 'alert':
        return <AlertCircle className="h-4 w-4 text-destructive" />;
      default:
        return <Bell className="h-4 w-4" />;
    }
  };

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="text-lg">Notifications</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {notifications.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">No notifications</p>
          ) : (
            notifications.map((notification) => (
              <div key={notification.id} className="flex items-start gap-3 pb-4 border-b last:border-b-0 last:pb-0">
                <div className="mt-0.5">
                  {getIcon(notification.type)}
                </div>
                <div className="grid gap-1">
                  <h4 className="font-medium text-sm">
                    {notification.title}
                    {!notification.read && (
                      <span className="ml-2 inline-block h-2 w-2 rounded-full bg-primary"></span>
                    )}
                  </h4>
                  <p className="text-xs text-muted-foreground">{notification.message}</p>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default NotificationList;
