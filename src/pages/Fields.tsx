
import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import FieldsList from '@/components/fields/FieldsList';
import FarmSelector from '@/components/farms/FarmSelector';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { supabase } from '@/integrations/supabase/client';
import { Loader2 } from 'lucide-react';

const Fields = () => {
  const [selectedFarmId, setSelectedFarmId] = useState<string | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);

  // Fetch farms to ensure we have data before rendering
  const { data: farms = [], isLoading: isLoadingFarms } = useQuery({
    queryKey: ['farms'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('farms')
        .select('id, name');

      if (error) throw error;
      return data || [];
    },
  });

  // Set the first farm as selected if none is selected
  useEffect(() => {
    if (farms.length > 0) {
      if (!selectedFarmId) {
        setSelectedFarmId(farms[0].id);
      }
      setIsInitializing(false);
    } else if (!isLoadingFarms) {
      setIsInitializing(false);
    }
  }, [farms, selectedFarmId, isLoadingFarms]);

  // Show loading state while initializing
  if (isInitializing || isLoadingFarms) {
    return (
      <div className="container mx-auto p-6 max-w-7xl">
        <div className="flex items-center justify-center h-[50vh]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <h1 className="text-3xl font-bold">Field Management</h1>
        <FarmSelector
          selectedFarmId={selectedFarmId}
          onFarmChange={setSelectedFarmId}
        />
      </div>

      <Separator className="mb-6" />

      <Tabs defaultValue="fields" className="w-full">
        <TabsList className="mb-6">
          <TabsTrigger value="fields">Fields</TabsTrigger>
          <TabsTrigger value="crops">Crop Planting</TabsTrigger>
          <TabsTrigger value="activities">Field Activities</TabsTrigger>
        </TabsList>

        <TabsContent value="fields">
          <div className="bg-background">
            <FieldsList farmId={selectedFarmId || undefined} />
          </div>
        </TabsContent>

        <TabsContent value="crops">
          <div className="bg-background">
            <div className="text-center p-12">
              <h3 className="text-xl font-medium mb-2">Crop Planting</h3>
              <p className="text-muted-foreground">
                Plan and track your crops across different fields.
              </p>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="activities">
          <div className="bg-background">
            <div className="text-center p-12">
              <h3 className="text-xl font-medium mb-2">Field Activities</h3>
              <p className="text-muted-foreground">
                Log irrigation, fertilization, and other activities.
              </p>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Fields;
