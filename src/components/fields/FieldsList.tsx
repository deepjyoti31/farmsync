
import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Field } from '@/types';
import { toast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Plus, Loader2 } from 'lucide-react';
import FieldCard from './FieldCard';
import AddFieldForm from './AddFieldForm';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { DeleteButton } from '@/components/common/DeleteButton';
import { deleteEntity } from '@/utils/deleteUtils';

interface FieldsListProps {
  farmId?: string;
}

const FieldsList: React.FC<FieldsListProps> = ({ farmId }) => {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const queryClient = useQueryClient();

  const {
    data: fields = [],
    isLoading,
    error
  } = useQuery({
    queryKey: ['fields', farmId],
    queryFn: async () => {
      if (!farmId) return [];
      
      const { data, error } = await supabase
        .from('fields')
        .select('*, field_crops(*, crop:crops(*))')
        .eq('farm_id', farmId);
      
      if (error) throw error;
      
      // Transform the data to match the Field interface
      return data.map((field: any) => ({
        id: field.id,
        name: field.name,
        area: field.area,
        areaUnit: field.area_unit,
        location: field.location || '',
        soilType: field.soil_type,
        soilPH: field.soil_ph,
        images: [],
        crops: field.field_crops?.map((fc: any) => fc.crop) || [],
        farm_id: field.farm_id,
        created_at: field.created_at,
        updated_at: field.updated_at
      })) as Field[];
    },
    enabled: !!farmId,
  });

  // Handle errors
  React.useEffect(() => {
    if (error) {
      toast({
        title: 'Error loading fields',
        description: (error as Error).message,
        variant: 'destructive',
      });
    }
  }, [error]);

  const handleAddSuccess = () => {
    setIsAddDialogOpen(false);
    queryClient.invalidateQueries({ queryKey: ['fields'] });
  };

  const handleDeleteField = async (fieldId: string) => {
    await deleteEntity({
      id: fieldId,
      entityType: 'field',
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['fields'] });
      }
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!farmId) {
    return (
      <div className="text-center p-8">
        <p>Please select a farm to view fields.</p>
      </div>
    );
  }

  if (fields.length === 0) {
    return (
      <div className="text-center p-8">
        <h3 className="text-lg font-medium mb-2">No Fields Added Yet</h3>
        <p className="text-muted-foreground mb-4">
          Start adding fields to your farm to track crops and activities.
        </p>
        <Button onClick={() => setIsAddDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" /> Add Your First Field
        </Button>
        
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Field</DialogTitle>
            </DialogHeader>
            <AddFieldForm farmId={farmId} onSuccess={handleAddSuccess} onClose={() => setIsAddDialogOpen(false)} />
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-lg font-medium">Fields ({fields.length})</h2>
        <Button onClick={() => setIsAddDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" /> Add Field
        </Button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {fields.map((field) => (
          <div key={field.id} className="relative">
            <FieldCard field={field} />
            <div className="absolute top-2 right-2">
              <DeleteButton 
                onDelete={() => handleDeleteField(field.id)}
                itemName={field.name}
                entityType="Field"
                buttonSize="sm"
                buttonVariant="ghost"
              />
            </div>
          </div>
        ))}
      </div>
      
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Field</DialogTitle>
          </DialogHeader>
          <AddFieldForm farmId={farmId} onSuccess={handleAddSuccess} onClose={() => setIsAddDialogOpen(false)} />
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default FieldsList;
