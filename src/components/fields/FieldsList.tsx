
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Plus, Loader2 } from 'lucide-react';
import { Field } from '@/types';
import FieldCard from './FieldCard';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import AddFieldForm from './AddFieldForm';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface FieldsListProps {
  farmId?: string;
}

const FieldsList: React.FC<FieldsListProps> = ({ farmId }) => {
  const [isAddFieldOpen, setIsAddFieldOpen] = useState(false);
  
  const { data: fields = [], isLoading, error, refetch } = useQuery({
    queryKey: ['fields', farmId],
    queryFn: async () => {
      if (!farmId) {
        const { data: farms, error: farmsError } = await supabase
          .from('farms')
          .select('id')
          .limit(1);
          
        if (farmsError) throw farmsError;
        if (!farms || farms.length === 0) return [];
        
        farmId = farms[0].id;
      }
      
      const { data, error: fieldsError } = await supabase
        .from('fields')
        .select(`
          id, 
          name, 
          area, 
          area_unit, 
          soil_type, 
          soil_ph,
          field_images (image_url),
          field_crops(
            id,
            crops(name),
            planting_date,
            expected_harvest_date,
            status
          )
        `)
        .eq('farm_id', farmId);
      
      if (fieldsError) throw fieldsError;
      
      // Transform the data to match our Field type
      return (data || []).map((field: any): Field => ({
        id: field.id,
        name: field.name,
        area: field.area,
        areaUnit: field.area_unit,
        location: field.location || '',
        soilType: field.soil_type || '',
        soilPH: field.soil_ph || 0,
        images: field.field_images?.map((img: any) => img.image_url) || [],
        crops: field.field_crops?.map((fieldCrop: any) => ({
          id: fieldCrop.id,
          name: fieldCrop.crops?.name || 'Unknown Crop',
          plantingDate: fieldCrop.planting_date,
          harvestDate: fieldCrop.expected_harvest_date,
          status: fieldCrop.status as any || 'planned',
        })) || [],
      }));
    },
    enabled: !!farmId,
  });

  const handleAddField = () => {
    setIsAddFieldOpen(true);
  };

  const handleSuccess = () => {
    refetch();
  };

  if (error) {
    toast({
      title: 'Error',
      description: (error as Error).message || 'Failed to load fields.',
      variant: 'destructive',
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Your Fields</h2>
        <Button className="gap-2" onClick={handleAddField} disabled={!farmId}>
          <Plus className="h-4 w-4" />
          Add New Field
        </Button>
      </div>
      
      {isLoading ? (
        <div className="flex justify-center items-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : fields.length === 0 ? (
        <div className="bg-muted/40 border rounded-lg p-12 text-center">
          <h3 className="text-xl font-medium mb-2">No Fields Added Yet</h3>
          <p className="text-muted-foreground mb-6">
            Add your first field to start managing your farm efficiently.
          </p>
          <Button className="gap-2" onClick={handleAddField} disabled={!farmId}>
            <Plus className="h-4 w-4" />
            Add Your First Field
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {fields.map((field) => (
            <FieldCard key={field.id} field={field} />
          ))}
        </div>
      )}

      <Dialog open={isAddFieldOpen} onOpenChange={setIsAddFieldOpen}>
        <DialogContent className="p-0 max-w-md">
          {farmId && (
            <AddFieldForm
              farmId={farmId}
              onClose={() => setIsAddFieldOpen(false)}
              onSuccess={handleSuccess}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default FieldsList;
