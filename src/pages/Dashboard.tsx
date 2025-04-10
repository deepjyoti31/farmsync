
import React from 'react';
import { Map, Sprout, Users, CalendarClock } from 'lucide-react';
import WeatherCard from '@/components/dashboard/WeatherCard';
import StatsCard from '@/components/dashboard/StatsCard';
import TaskList from '@/components/dashboard/TaskList';
import NotificationList from '@/components/dashboard/NotificationList';
import QuickLinks from '@/components/dashboard/QuickLinks';
import CropStatus from '@/components/dashboard/CropStatus';
import { weatherData, fields, crops, tasks, notifications, livestock } from '@/data/mockData';

const Dashboard = () => {
  const upcomingTasks = tasks.filter(task => !task.completed).slice(0, 5);
  const recentNotifications = notifications.slice(0, 5);
  
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Dashboard</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <WeatherCard weatherData={weatherData} />
        <StatsCard 
          title="Total Fields" 
          value={fields.length} 
          icon={Map} 
          iconColor="text-farm-green"
          description="Manage all your land in one place" 
        />
        <StatsCard 
          title="Active Crops" 
          value={crops.filter(c => c.status !== 'harvested').length} 
          icon={Sprout} 
          iconColor="text-farm-lightGreen"
          description="Crops currently growing" 
        />
        <StatsCard 
          title="Livestock" 
          value={livestock.reduce((sum, item) => sum + item.count, 0)} 
          icon={Users} 
          iconColor="text-farm-brown"
          description="Total animals on your farm" 
        />
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <QuickLinks />
          <CropStatus crops={crops} />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <TaskList tasks={upcomingTasks} />
          <NotificationList notifications={recentNotifications} />
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
