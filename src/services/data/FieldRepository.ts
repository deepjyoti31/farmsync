
import { supabase } from '@/integrations/supabase/client';
import { Field } from '@/types';
import { BaseRepository } from './BaseRepository';
import { getDatabase } from './SQLiteMigrations';

/**
 * Repository for Field-specific data operations.
 */
class FieldRepository extends BaseRepository {
  /**
   * Helper to map database/local fields to Field interface.
   */
  private mapField(data: any): Field {
    return {
      ...data,
      id: data.id,
      farm_id: data.farm_id || data.farmId,
      name: data.name,
      area: data.area,
      areaUnit: data.area_unit || data.areaUnit || 'acres',
      soilType: data.soil_type || data.soilType || 'Unknown',
      soilPH: data.soil_ph || data.soilPH || 7.0,
      crops: data.crops || [],
      created_at: data.created_at,
      updated_at: data.updated_at
    };
  }

  /**
   * Fetches all fields for a specific farm.
   */
  async getByFarmId(farmId: string): Promise<Field[]> {
    return this.execute(
      // Local Implementation (SQLite)
      async () => {
        const db = await getDatabase();
        const results = await db.select<any[]>('SELECT * FROM fields WHERE farm_id = $1', [farmId]);
        return (results || []).map(f => this.mapField(f));
      },
      // Cloud Implementation
      async () => {
        const { data, error } = await supabase
          .from('fields')
          .select('*')
          .eq('farm_id', farmId);

        if (error) throw error;
        return (data || []).map(f => this.mapField(f));
      }
    );
  }

  /**
   * Creates a new field.
   */
  async create(field: any): Promise<Field> {
    return this.execute(
      // Local Implementation (SQLite)
      async () => {
        const db = await getDatabase();
        const id = crypto.randomUUID();
        const createdAt = new Date().toISOString();
        
        await db.execute(
          `INSERT INTO fields (id, farm_id, name, area, area_unit, soil_type, soil_ph, created_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
          [
            id, 
            field.farm_id || field.farmId, 
            field.name, 
            field.area || 0, 
            field.area_unit || field.areaUnit || 'acres', 
            field.soil_type || field.soilType || 'Loamy', 
            field.soil_ph || field.soilPH || 7.0,
            createdAt
          ]
        );

        return this.mapField({
          ...field,
          id,
          created_at: createdAt,
          updated_at: createdAt
        });
      },
      // Cloud Implementation
      async () => {
        const { data, error } = await supabase
          .from('fields')
          .insert([field])
          .select()
          .single();

        if (error) throw error;
        return this.mapField(data);
      }
    );
  }
}

export const fieldRepository = new FieldRepository();
