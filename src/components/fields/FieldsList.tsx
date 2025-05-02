
import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Field } from '@/types';
import { toast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Plus, Loader2, Pencil } from 'lucide-react';
import FieldCard from './FieldCard';
import AddFieldForm from './AddFieldForm';
import EditFieldForm from './EditFieldForm';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { DeleteButton } from '@/components/common/DeleteButton';
import { deleteEntity } from '@/utils/deleteUtils';

interface FieldsListProps {
  farmId?: string;
  isAddDialogOpen?: boolean;
  setIsAddDialogOpen?: (open: boolean) => void;
  handleAddSuccess?: () => void;
}

const FieldsList: React.FC<FieldsListProps> = ({
  farmId,
  isAddDialogOpen = false,
  setIsAddDialogOpen = () => {},
  handleAddSuccess = () => {}
}) => {
  const queryClient = useQueryClient();
  const [selectedField, setSelectedField] = useState<Field | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  const {
    data: fields = [],
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['fields', farmId],
    queryFn: async () => {
      if (!farmId) return [];

      console.log(`Fetching fields for farm: ${farmId}`);
      const { data, error } = await supabase
        .from('fields')
        .select('*, field_crops(*, crop:crops(*)), farm:farm_id(name)')
        .eq('farm_id', farmId);

      if (error) throw error;

      // Transform the data to match the Field interface
      return (data || []).map((field: any) => ({
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
        farm_name: field.farm?.name || '',
        created_at: field.created_at,
        updated_at: field.updated_at
      })) as Field[];
    },
    enabled: !!farmId,
    staleTime: 0, // Don't cache the data
    retry: 3, // Retry failed requests 3 times
    retryDelay: 1000, // Wait 1 second between retries
  });

  // Refetch when farmId changes
  React.useEffect(() => {
    if (farmId) {
      console.log(`Farm ID changed to: ${farmId}, refetching fields`);
      refetch();
    }
  }, [farmId, refetch]);

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

  const handleDeleteField = async (fieldId: string) => {
    await deleteEntity({
      id: fieldId,
      entityType: 'field',
      onSuccess: () => {
        // Invalidate both general fields query and the specific farm fields query
        queryClient.invalidateQueries({ queryKey: ['fields'] });
        if (farmId) {
          queryClient.invalidateQueries({ queryKey: ['fields', farmId] });
        }
      }
    });
  };

  const handleEditField = (field: Field) => {
    setSelectedField(field);
    setIsEditDialogOpen(true);
  };

  const handleEditSuccess = () => {
    setIsEditDialogOpen(false);
    // Invalidate both general fields query and the specific farm fields query
    queryClient.invalidateQueries({ queryKey: ['fields'] });
    if (farmId) {
      queryClient.invalidateQueries({ queryKey: ['fields', farmId] });
    }
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
      <>
        <div className="text-center p-8">
          <h3 className="text-lg font-medium mb-2">No Fields Added Yet</h3>
          <p className="text-muted-foreground mb-4">
            Start adding fields to your farm to track crops and activities.
          </p>
          <Button onClick={() => setIsAddDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" /> Add Your First Field
          </Button>
        </div>

        {/* Dialog moved to the end of the component */}
      </>
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
            <FieldCard
              field={field}
              onEdit={handleEditField}
              onDelete={() => handleDeleteField(field.id)}
            />

          </div>
        ))}
      </div>

      {/* Edit Field Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="p-0 max-w-md">
          <DialogHeader className="p-6 pb-2">
            <DialogTitle>Edit Field</DialogTitle>
          </DialogHeader>
          {selectedField && (
            <EditFieldForm
              field={selectedField}
              onSuccess={handleEditSuccess}
              onClose={() => setIsEditDialogOpen(false)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

// Create a wrapper component for the FieldsList to handle the dialog
const FieldsListWithDialog: React.FC<FieldsListProps> = (props) => {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const queryClient = useQueryClient();

  const handleAddSuccess = () => {
    setIsAddDialogOpen(false);
    // Invalidate both fields and specific farm fields queries
    queryClient.invalidateQueries({ queryKey: ['fields'] });
    if (props.farmId) {
      queryClient.invalidateQueries({ queryKey: ['fields', props.farmId] });
    }
  };

  // Override the original component's state handlers
  const enhancedProps = {
    ...props,
    isAddDialogOpen,
    setIsAddDialogOpen,
    handleAddSuccess
  };

  return (
    <>
      <FieldsList {...enhancedProps} />

      {/* Single dialog instance with proper styling */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="p-0 max-w-md">
          <DialogHeader className="p-6 pb-2">
            <DialogTitle>Add New Field</DialogTitle>
          </DialogHeader>
          <AddFieldForm
            farmId={props.farmId}
            onSuccess={handleAddSuccess}
            onClose={() => setIsAddDialogOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </>
  );
}

export default FieldsListWithDialog;
