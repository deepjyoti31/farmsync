
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import StatsCard from "@/components/dashboard/StatsCard";
import FarmSelector from "@/components/farms/FarmSelector";
import WeatherWidget from "@/components/dashboard/WeatherWidget";
import QuickLinks from "@/components/dashboard/QuickLinks";
import TaskList from "@/components/dashboard/TaskList";
import NotificationList from "@/components/dashboard/NotificationList";
import CropStatus from "@/components/dashboard/CropStatus";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Tractor, 
  MapPin,
  Sprout, 
  PiggyBank,
  Bird
} from "lucide-react";
import { crops, tasks, notifications } from '@/data/mockData';

const Dashboard = () => {
  const [selectedFarmId, setSelectedFarmId] = useState<string | null>(null);

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <FarmSelector
          selectedFarmId={selectedFarmId}
          onFarmChange={setSelectedFarmId}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <StatsCard 
              title="Fields" 
              value="5" 
              description="Total fields" 
              trend="up" 
              trendValue="2"
              icon={MapPin}
            />
            <StatsCard 
              title="Crops" 
              value="12" 
              description="Currently growing" 
              trend="up" 
              trendValue="4"
              icon={Sprout}
            />
            <StatsCard 
              title="Livestock" 
              value="28" 
              description="Total animals" 
              trend="up" 
              trendValue="3"
              icon={Bird}
            />
            <StatsCard 
              title="Revenue" 
              value="₹45,000" 
              description="This month" 
              trend="up" 
              trendValue="12%"
              icon={PiggyBank}
            />
          </div>

          <Tabs defaultValue="overview" className="mb-6">
            <TabsList className="mb-4">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="crops">Crops</TabsTrigger>
              <TabsTrigger value="tasks">Tasks</TabsTrigger>
            </TabsList>
            
            <TabsContent value="overview">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <WeatherWidget farmId={selectedFarmId} />
                <QuickLinks />
              </div>
            </TabsContent>
            
            <TabsContent value="crops">
              <Card>
                <CardHeader>
                  <CardTitle>Crop Status</CardTitle>
                  <CardDescription>Current status of your crops</CardDescription>
                </CardHeader>
                <CardContent>
                  <CropStatus crops={crops} />
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="tasks">
              <Card>
                <CardHeader>
                  <CardTitle>Upcoming Tasks</CardTitle>
                  <CardDescription>Tasks scheduled for the next 7 days</CardDescription>
                </CardHeader>
                <CardContent>
                  <TaskList tasks={tasks} />
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
        
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Recent Activities</CardTitle>
              <CardDescription>Latest updates from your farm</CardDescription>
            </CardHeader>
            <CardContent>
              <NotificationList notifications={notifications} />
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Upcoming Tasks</CardTitle>
              <CardDescription>Tasks scheduled for the next 7 days</CardDescription>
            </CardHeader>
            <CardContent>
              <TaskList tasks={tasks} />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
