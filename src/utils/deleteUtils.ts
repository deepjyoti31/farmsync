
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

// Define the exact table names as they appear in Supabase
type TableName = 
  | 'farms'
  | 'fields'
  | 'field_crops'
  | 'financial_transactions'
  | 'inventory'
  | 'equipment'
  | 'livestock';

// Type-safe mapping of entity types to table names
type TableNameMapping = {
  [key in EntityType]: TableName;
};

/**
 * The message of anything thrown or returned as an error. Supabase returns
 * errors as plain objects (not Error instances), so check for a message field.
 */
export const errorMessage = (error: unknown, fallback = 'An unknown error occurred'): string => {
  if (error instanceof Error && error.message) return error.message;
  if (error && typeof error === 'object' && 'message' in error) {
    const message = (error as { message?: unknown }).message;
    if (typeof message === 'string' && message) return message;
  }
  if (typeof error === 'string' && error) return error;
  return fallback;
};

type DeletableTable = TableName | 'tasks';

/**
 * Delete one row by id. Returns null on success, or a message saying why the
 * row was not deleted.
 *
 * The deleted row is selected back because row level security silently skips
 * rows the user may not delete: Supabase then reports no error and deletes
 * nothing, which must not be shown as a success.
 */
export async function deleteById(table: DeletableTable, id: string, what = 'This item'): Promise<string | null> {
  const { data, error } = await supabase.from(table).delete().eq('id', id).select('id');
  if (error) {
    console.error('Error during delete operation:', error);
    return errorMessage(error);
  }
  if (!data || data.length === 0) {
    return `${what} was not deleted. It may already be gone, or your role does not allow deleting it.`;
  }
  return null;
}

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

    // Execute the delete operation with the properly typed table name
    const problem = await deleteById(tableName, id, `This ${entityType}`);
    if (problem) throw new Error(problem);

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
      description: errorMessage(error),
      variant: "destructive",
    });

    // Call the error callback
    if (onError) {
      onError(error instanceof Error ? error : new Error(errorMessage(error)));
    }
  }
};
