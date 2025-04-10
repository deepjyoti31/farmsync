
import React, { useState } from 'react';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { 
  Plus, 
  Filter, 
  CalendarRange, 
  ArrowUpDown,
  Sprout,
  CheckCircle2,
  Clock,
  Flower2,
  Scissors,
  Loader2
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { fields } from '@/data/mockData';
import { Crop } from '@/types';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import FarmSelector from '@/components/farms/FarmSelector';

const Crops = () => {
  const [selectedFarmId, setSelectedFarmId] = useState<string | null>(null);

  // Fetch fields for the selected farm
  const { 
    data: farmFields = [], 
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
      return data || [];
    },
    enabled: !!selectedFarmId,
  });

  // Fetch field_crops data
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

  // Transform field crops data to match our Crop type
  const crops = fieldCrops.map((fieldCrop: any): Crop => ({
    id: fieldCrop.id,
    name: fieldCrop.crop?.name || 'Unknown Crop',
    variety: fieldCrop.crop?.variety || '',
    plantingDate: fieldCrop.planting_date,
    harvestDate: fieldCrop.expected_harvest_date || '',
    status: fieldCrop.status || 'planned',
    fieldId: fieldCrop.field_id
  }));

  // Handle errors
  React.useEffect(() => {
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
  }, [fieldsError, cropsError]);

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), 'dd MMM yyyy');
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'planned':
        return <Clock className="h-4 w-4 text-farm-yellow" />;
      case 'planted':
        return <Flower2 className="h-4 w-4 text-farm-green" />;
      case 'growing':
        return <Sprout className="h-4 w-4 text-farm-lightGreen" />;
      case 'harvested':
        return <Scissors className="h-4 w-4 text-farm-brown" />;
      default:
        return null;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'planned':
        return <Badge variant="outline" className="bg-muted/40">Planned</Badge>;
      case 'planted':
        return <Badge variant="outline" className="bg-farm-green/10 text-farm-green border-farm-green/20">Planted</Badge>;
      case 'growing':
        return <Badge variant="outline" className="bg-farm-lightGreen/10 text-farm-lightGreen border-farm-lightGreen/20">Growing</Badge>;
      case 'harvested':
        return <Badge variant="outline" className="bg-farm-brown/10 text-farm-brown border-farm-brown/20">Harvested</Badge>;
      default:
        return null;
    }
  };

  const getFieldName = (fieldId: string | undefined) => {
    if (!fieldId) return 'Not assigned';
    const field = farmFields.find(f => f.id === fieldId);
    return field ? field.name : 'Unknown Field';
  };

  const isLoading = isLoadingFields || isLoadingCrops;

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Crop Management</h1>
          <p className="text-muted-foreground mt-1">
            Plan, track, and manage all your crops throughout their lifecycle.
          </p>
        </div>
        
        <div className="flex items-center gap-4">
          <FarmSelector
            selectedFarmId={selectedFarmId}
            onFarmChange={setSelectedFarmId}
          />
          
          <div className="flex gap-2">
            <Button variant="outline" className="gap-2">
              <Filter className="h-4 w-4" />
              Filter
            </Button>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Add Crop
            </Button>
          </div>
        </div>
      </div>
      
      {isLoading ? (
        <div className="flex items-center justify-center h-[50vh]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : !selectedFarmId ? (
        <Card>
          <CardContent className="flex items-center justify-center p-12 text-center">
            <div className="max-w-sm">
              <Sprout className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-xl font-medium mb-2">Select a Farm</h3>
              <p className="text-muted-foreground mb-4">
                Please select a farm to view and manage your crops.
              </p>
            </div>
          </CardContent>
        </Card>
      ) : crops.length === 0 ? (
        <Card>
          <CardContent className="flex items-center justify-center p-12 text-center">
            <div className="max-w-sm">
              <Sprout className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-xl font-medium mb-2">No Crops Added Yet</h3>
              <p className="text-muted-foreground mb-4">
                Start adding crops to track and manage your farm's production.
              </p>
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                Add Your First Crop
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Your Crops</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Crop</TableHead>
                  <TableHead>Field</TableHead>
                  <TableHead>Variety</TableHead>
                  <TableHead>
                    <div className="flex items-center gap-1">
                      <span>Planting Date</span>
                      <ArrowUpDown className="h-3 w-3" />
                    </div>
                  </TableHead>
                  <TableHead>
                    <div className="flex items-center gap-1">
                      <span>Harvest Date</span>
                      <ArrowUpDown className="h-3 w-3" />
                    </div>
                  </TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {crops.map((crop) => (
                  <TableRow key={crop.id}>
                    <TableCell className="font-medium">{crop.name}</TableCell>
                    <TableCell>{getFieldName(crop.fieldId)}</TableCell>
                    <TableCell>{crop.variety}</TableCell>
                    <TableCell>{format(new Date(crop.plantingDate), 'dd MMM yyyy')}</TableCell>
                    <TableCell>{crop.harvestDate ? format(new Date(crop.harvestDate), 'dd MMM yyyy') : '-'}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getStatusIcon(crop.status)}
                        {getStatusBadge(crop.status)}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
      
      <Card>
        <CardHeader>
          <CardTitle>Crop Calendar</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center p-12 text-center">
          <div className="max-w-sm">
            <CalendarRange className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-xl font-medium mb-2">Crop Calendar Coming Soon</h3>
            <p className="text-muted-foreground mb-4">
              Plan your sowing, irrigation, fertilization, and harvesting activities with our visual calendar.
            </p>
            <Button variant="outline">Check Back Soon</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Crops;
