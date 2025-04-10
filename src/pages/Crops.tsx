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
  Loader2,
  X
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import FarmSelector from '@/components/farms/FarmSelector';
import AddCropForm from '@/components/crops/AddCropForm';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { DeleteButton } from '@/components/common/DeleteButton';
import { deleteEntity } from '@/utils/deleteUtils';

const Crops = () => {
  const [selectedFarmId, setSelectedFarmId] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const queryClient = useQueryClient();

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

  const {
    data: fieldCrops = [],
    isLoading: isLoadingCrops,
    error: cropsError
  } = useQuery({
    queryKey: ['field_crops', selectedFarmId],
    queryFn: async () => {
      if (!selectedFarmId) return [];
      
      const { data: fieldData, error: fieldError } = await supabase
        .from('fields')
        .select('id')
        .eq('farm_id', selectedFarmId);
      
      if (fieldError) throw fieldError;
      if (!fieldData || fieldData.length === 0) return [];
      
      const fieldIds = fieldData.map(field => field.id);
      
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

  const handleAddCropSuccess = () => {
    setDialogOpen(false);
    queryClient.invalidateQueries({queryKey: ['field_crops']});
    toast({
      title: "Crop added successfully",
      description: "Your crop has been added to the field.",
    });
  };

  const handleDeleteCrop = async (cropId: string) => {
    await deleteEntity({
      id: cropId,
      entityType: 'crop',
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['field_crops'] });
      }
    });
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
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button className="gap-2" disabled={!selectedFarmId}>
                  <Plus className="h-4 w-4" />
                  Add Crop
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                  <DialogTitle>Add New Crop</DialogTitle>
                </DialogHeader>
                {selectedFarmId && (
                  <AddCropForm 
                    farmId={selectedFarmId} 
                    onSuccess={handleAddCropSuccess}
                    onCancel={() => setDialogOpen(false)}
                  />
                )}
              </DialogContent>
            </Dialog>
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
      ) : fieldCrops.length === 0 ? (
        <Card>
          <CardContent className="flex items-center justify-center p-12 text-center">
            <div className="max-w-sm">
              <Sprout className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-xl font-medium mb-2">No Crops Added Yet</h3>
              <p className="text-muted-foreground mb-4">
                Start adding crops to track and manage your farm's production.
              </p>
              <Button className="gap-2" onClick={() => setDialogOpen(true)}>
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
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {fieldCrops.map((fieldCrop: any) => (
                  <TableRow key={fieldCrop.id}>
                    <TableCell className="font-medium">{fieldCrop.crop?.name || 'Unknown Crop'}</TableCell>
                    <TableCell>{getFieldName(fieldCrop.field_id)}</TableCell>
                    <TableCell>{fieldCrop.crop?.variety || '-'}</TableCell>
                    <TableCell>{format(new Date(fieldCrop.planting_date), 'dd MMM yyyy')}</TableCell>
                    <TableCell>{fieldCrop.expected_harvest_date ? format(new Date(fieldCrop.expected_harvest_date), 'dd MMM yyyy') : '-'}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getStatusIcon(fieldCrop.status)}
                        {getStatusBadge(fieldCrop.status)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Button variant="ghost" size="sm">View</Button>
                        <DeleteButton 
                          onDelete={() => handleDeleteCrop(fieldCrop.id)}
                          itemName={fieldCrop.crop?.name}
                          entityType="Crop"
                          buttonSize="sm"
                          buttonVariant="ghost"
                        />
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
