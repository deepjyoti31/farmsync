
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import type { Database, TablesUpdate } from '@/integrations/supabase/types';

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

type PublicTable = keyof Database['public']['Tables'];

/** Thrown when a save reached the database but changed nothing. */
export class NotSavedError extends Error {}

/**
 * Update one row by id. Returns null on success, or a message saying why the
 * row was not changed.
 *
 * Like deleteById, the row is selected back: row level security skips rows
 * the user may not change (a team viewer, for example) without an error, and
 * that must not be shown as "saved".
 */
export async function updateById<T extends PublicTable>(
  table: T,
  id: string,
  values: TablesUpdate<T>,
  what = 'This item',
): Promise<string | null> {
  // The generated table types are too deep to resolve through a generic table name.
  const query = supabase.from(table) as unknown as {
    update(v: unknown): { eq(c: string, v: string): { select(c: string): PromiseLike<{ data: unknown[] | null; error: unknown }> } };
  };
  const { data, error } = await query.update(values).eq('id', id).select('id');
  if (error) {
    console.error('Error during update operation:', error);
    return errorMessage(error);
  }
  if (!data || data.length === 0) {
    return `${what} was not saved. It may have been deleted, or your role does not allow changing it.`;
  }
  return null;
}

/** updateById, throwing instead of returning the message. */
export async function updateByIdOrThrow<T extends PublicTable>(table: T, id: string, values: TablesUpdate<T>, what?: string): Promise<void> {
  const problem = await updateById(table, id, values, what);
  if (problem) throw new NotSavedError(problem);
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
