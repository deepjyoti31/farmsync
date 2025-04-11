
import React, { useState, useEffect } from 'react';
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
  Bird,
  Loader2
} from "lucide-react";
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { Field, Farm, FieldCrop, Crop, Task, Notification } from '@/types';

const Dashboard = () => {
  const [selectedFarmId, setSelectedFarmId] = useState<string | null>(null);

  // Fetch farms for the logged in user
  const { 
    data: farms = [], 
    isLoading: isLoadingFarms,
    error: farmsError
  } = useQuery({
    queryKey: ['farms'],
    queryFn: async () => {
      const { data: userFarms, error } = await supabase
        .from('farms')
        .select('*');
      
      if (error) throw error;
      
      // Transform the data to match our Farm type
      return (userFarms || []).map((farm: any): Farm => ({
        id: farm.id,
        name: farm.name,
        location: farm.address || '',
        village: farm.village,
        district: farm.district,
        state: farm.state,
        totalArea: farm.total_area,
        total_area: farm.total_area,
        areaUnit: farm.area_unit,
        area_unit: farm.area_unit,
        fields: [], // We'll fetch fields separately
        user_id: farm.user_id,
        gps_latitude: farm.gps_latitude,
        gps_longitude: farm.gps_longitude,
        created_at: farm.created_at,
        updated_at: farm.updated_at
      }));
    },
  });

  // Set the first farm as selected if none is selected
  useEffect(() => {
    if (farms.length > 0 && !selectedFarmId) {
      setSelectedFarmId(farms[0].id);
    }
  }, [farms, selectedFarmId]);

  // Fetch fields for the selected farm
  const { 
    data: fields = [], 
    isLoading: isLoadingFields,
    error: fieldsError 
  } = useQuery({
    queryKey: ['fields', selectedFarmId],
    queryFn: async () => {
      if (!selectedFarmId) return [];
      
      const { data, error } = await supabase
        .from('fields')
        .select('*')
        .eq('farm_id', selectedFarmId);
      
      if (error) throw error;
      
      // Transform the data to match our Field type
      return (data || []).map((field: any): Field => ({
        id: field.id,
        name: field.name,
        area: field.area,
        areaUnit: field.area_unit,
        area_unit: field.area_unit,
        location: '',
        soilType: field.soil_type || '',
        soil_type: field.soil_type || '',
        soilPH: field.soil_ph || 0,
        soil_ph: field.soil_ph || 0,
        images: [],
        crops: [], // We'll fetch crops separately
        farm_id: field.farm_id,
        created_at: field.created_at,
        updated_at: field.updated_at
      }));
    },
    enabled: !!selectedFarmId,
  });

  // Fetch crops data
  const { 
    data: fieldCrops = [], 
    isLoading: isLoadingCrops,
    error: cropsError 
  } = useQuery({
    queryKey: ['field_crops', selectedFarmId],
    queryFn: async () => {
      if (!selectedFarmId) return [];
      
      // First get all fields for this farm
      const { data: fieldData, error: fieldError } = await supabase
        .from('fields')
        .select('id')
        .eq('farm_id', selectedFarmId);
      
      if (fieldError) throw fieldError;
      if (!fieldData || fieldData.length === 0) return [];
      
      const fieldIds = fieldData.map(field => field.id);
      
      // Then get all field_crops that link to these fields
      const { data: fieldCropsData, error: cropError } = await supabase
        .from('field_crops')
        .select(`
          *,
          crop:crops(*)
        `)
        .in('field_id', fieldIds);
      
      if (cropError) throw cropError;
      return fieldCropsData || [];
    },
    enabled: !!selectedFarmId,
  });

  // Fetch tasks for the selected farm
  const { 
    data: tasks = [], 
    isLoading: isLoadingTasks,
    error: tasksError 
  } = useQuery({
    queryKey: ['tasks', selectedFarmId],
    queryFn: async () => {
      if (!selectedFarmId) return [];
      
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('farm_id', selectedFarmId)
        .order('due_date', { ascending: true })
        .limit(5);
      
      if (error) throw error;
      
      return (data || []).map(task => ({
        id: task.id,
        title: task.title,
        description: task.description || '',
        dueDate: task.due_date,
        priority: task.priority || 'medium',
        status: task.status || 'pending',
        assignedTo: task.assigned_to || '',
        completed: task.status === 'completed'
      }));
    },
    enabled: !!selectedFarmId,
  });

  // Fetch notifications
  const { 
    data: notifications = [], 
    isLoading: isLoadingNotifications,
    error: notificationsError 
  } = useQuery({
    queryKey: ['notifications'],
    queryFn: async () => {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) return [];
      
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.user.id)
        .order('created_at', { ascending: false })
        .limit(5);
      
      if (error) {
        console.error('Error fetching notifications:', error);
        // If the table doesn't exist yet, return empty array without error
        if (error.code === '42P01') return [];
        throw error;
      }
      
      return (data || []).map(notification => ({
        id: notification.id,
        title: notification.title,
        message: notification.message,
        type: notification.type,
        read: notification.read,
        date: notification.created_at,
        createdAt: notification.created_at
      }));
    },
  });

  // Convert field_crops to the format expected by CropStatus component
  const cropsList = fieldCrops.map((fieldCrop) => {
    return {
      id: fieldCrop.id,
      name: fieldCrop.crop?.name || 'Unknown Crop',
      variety: fieldCrop.crop?.variety || '',
      status: fieldCrop.status || 'planned',
      plantingDate: fieldCrop.planting_date,
      harvestDate: fieldCrop.expected_harvest_date || '',
      fieldId: fieldCrop.field_id
    } as Crop;
  });

  // Handle errors
  useEffect(() => {
    if (farmsError) {
      toast({
        title: 'Error loading farms',
        description: (farmsError as Error).message,
        variant: 'destructive',
      });
    }
    
    if (fieldsError) {
      toast({
        title: 'Error loading fields',
        description: (fieldsError as Error).message,
        variant: 'destructive',
      });
    }
    
    if (cropsError) {
      toast({
        title: 'Error loading crops',
        description: (cropsError as Error).message,
        variant: 'destructive',
      });
    }

    if (tasksError) {
      toast({
        title: 'Error loading tasks',
        description: (tasksError as Error).message,
        variant: 'destructive',
      });
    }

    if (notificationsError) {
      toast({
        title: 'Error loading notifications',
        description: (notificationsError as Error).message,
        variant: 'destructive',
      });
    }
  }, [farmsError, fieldsError, cropsError, tasksError, notificationsError]);

  const isLoading = isLoadingFarms || isLoadingFields || isLoadingCrops || isLoadingTasks || isLoadingNotifications;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Calculate active crops count
  const activeCropsCount = cropsList.filter(c => c.status === 'growing' || c.status === 'planted').length;

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <FarmSelector
          selectedFarmId={selectedFarmId}
          onFarmChange={setSelectedFarmId}
        />
      </div>

      {farms.length === 0 ? (
        <Card className="p-8 text-center">
          <CardTitle className="mb-4">Welcome to FarmSync</CardTitle>
          <CardDescription className="mb-6">
            You don't have any farms yet. Add your first farm to get started managing your agricultural operations.
          </CardDescription>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <StatsCard 
                title="Fields" 
                value={fields.length.toString()} 
                description="Total fields" 
                trend={fields.length > 0 ? "up" : "neutral"} 
                trendValue={fields.length > 0 ? fields.length.toString() : "0"}
                icon={MapPin}
              />
              <StatsCard 
                title="Crops" 
                value={activeCropsCount.toString()} 
                description="Currently growing" 
                trend={cropsList.length > 0 ? "up" : "neutral"} 
                trendValue={cropsList.length.toString()}
                icon={Sprout}
              />
              <StatsCard 
                title="Livestock" 
                value="0" 
                description="Total animals" 
                trend="neutral" 
                trendValue="0"
                icon={Bird}
              />
              <StatsCard 
                title="Revenue" 
                value="₹0" 
                description="This month" 
                trend="neutral" 
                trendValue="0%"
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
                    <CropStatus crops={cropsList} />
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
                <NotificationList notifications={notifications as Notification[]} />
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
      )}
    </div>
  );
};

export default Dashboard;
