
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export type EntityType = 
  | 'farm' 
  | 'field' 
  | 'crop' 
  | 'transaction'
  | 'inventory'
  | 'equipment'
  | 'livestock';

interface DeleteOptions {
  id: string;
  entityType: EntityType;
  onSuccess?: () => void;
  onError?: (error: Error) => void;
}

// Type-safe mapping of entity types to table names
type TableNameMapping = {
  [key in EntityType]: string;
};

/**
 * Deletes an entity from the database
 */
export const deleteEntity = async ({
  id,
  entityType,
  onSuccess,
  onError,
}: DeleteOptions): Promise<void> => {
  try {
    // Map entity types to their table names in Supabase
    const tableMapping: TableNameMapping = {
      farm: 'farms',
      field: 'fields',
      crop: 'field_crops',
      transaction: 'financial_transactions',
      inventory: 'inventory',
      equipment: 'equipment',
      livestock: 'livestock',
    };

    const tableName = tableMapping[entityType];
    
    if (!tableName) {
      throw new Error(`Unknown entity type: ${entityType}`);
    }

    // Execute the delete operation with type assertion to ensure compatibility
    const { error: deleteError } = await supabase
      .from(tableName as any)
      .delete()
      .eq('id', id);

    if (deleteError) {
      throw deleteError;
    }

    // Show success toast
    toast({
      title: "Deleted successfully",
      description: `The ${entityType} has been deleted.`,
    });

    // Call the success callback
    if (onSuccess) {
      onSuccess();
    }
  } catch (error) {
    // Log and handle error
    console.error(`Error deleting ${entityType}:`, error);
    
    // Show error toast
    toast({
      title: `Failed to delete ${entityType}`,
      description: error instanceof Error ? error.message : "An unknown error occurred",
      variant: "destructive",
    });

    // Call the error callback
    if (onError && error instanceof Error) {
      onError(error);
    }
  }
};
