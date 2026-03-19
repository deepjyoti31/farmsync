
import { supabase } from '@/integrations/supabase/client';
import { Farm } from '@/types';
import { BaseRepository } from './BaseRepository';
import { getDatabase } from './SQLiteMigrations';

/**
 * Repository for Farm-specific data operations.
 */
class FarmRepository extends BaseRepository {
  /**
   * Fetches a single farm by its ID.
   */
  async getById(id: string): Promise<Farm | null> {
    return this.execute(
      // Local Implementation (SQLite)
      async () => {
        const db = await getDatabase();
        const results = await db.select<any[]>('SELECT * FROM farms WHERE id = $1', [id]);
        if (results.length === 0) return null;
        
        const farm = results[0];
        return {
          ...farm,
          boundaries: farm.boundaries ? JSON.parse(farm.boundaries) : null
        } as Farm;
      },
      // Cloud Implementation
      async () => {
        const { data, error } = await supabase
          .from('farms')
          .select('*')
          .eq('id', id)
          .single();

        if (error) throw error;
        return data as Farm;
      }
    );
  }

  /**
   * Fetches all farms for the current context (User or Organization).
   */
  async getAll(): Promise<Farm[]> {
    return this.execute(
      // Local Implementation (SQLite)
      async () => {
        const db = await getDatabase();
        const results = await db.select<any[]>('SELECT * FROM farms ORDER BY created_at DESC');
        return results.map(farm => ({
          ...farm,
          boundaries: farm.boundaries ? JSON.parse(farm.boundaries) : null
        })) as Farm[];
      },
      // Cloud Implementation (Supabase)
      async () => {
        const { data, error } = await supabase
          .from('farms')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) throw error;
        
        return (data || []).map((farm: any): Farm => ({
          id: farm.id,
          name: farm.name,
          village: farm.village,
          district: farm.district,
          state: farm.state,
          total_area: farm.total_area,
          area_unit: farm.area_unit,
          user_id: farm.user_id,
          gps_latitude: farm.gps_latitude,
          gps_longitude: farm.gps_longitude,
          boundaries: farm.boundaries,
          created_at: farm.created_at,
          updated_at: farm.updated_at
        }));
      }
    );
  }

  /**
   * Creates a new farm.
   */
  async create(farm: Omit<Farm, 'id' | 'created_at' | 'updated_at'>): Promise<Farm> {
    return this.execute(
      // Local Implementation (SQLite)
      async () => {
        const db = await getDatabase();
        const id = crypto.randomUUID();
        const createdAt = new Date().toISOString();
        const boundariesStr = farm.boundaries ? JSON.stringify(farm.boundaries) : null;
        
        await db.execute(
          `INSERT INTO farms (id, user_id, name, village, district, state, total_area, area_unit, gps_latitude, gps_longitude, boundaries, created_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
          [
            id, 
            farm.user_id || 'local-user', 
            farm.name, 
            farm.village || null, 
            farm.district || null, 
            farm.state || null, 
            farm.total_area || 0, 
            farm.area_unit || 'acres', 
            farm.gps_latitude || null, 
            farm.gps_longitude || null, 
            boundariesStr, 
            createdAt
          ]
        );

        return {
          ...farm,
          id,
          created_at: createdAt,
          updated_at: createdAt
        } as Farm;
      },
      // Cloud Implementation
      async () => {
        const { data, error } = await supabase
          .from('farms')
          .insert([farm])
          .select()
          .single();

        if (error) throw error;
        return data as Farm;
      }
    );
  }

  /**
   * Deletes a farm.
   */
  async delete(id: string): Promise<void> {
    return this.execute(
      // Local Implementation (SQLite)
      async () => {
        const db = await getDatabase();
        await db.execute('DELETE FROM farms WHERE id = $1', [id]);
      },
      // Cloud Implementation
      async () => {
        const { error } = await supabase
          .from('farms')
          .delete()
          .eq('id', id);

        if (error) throw error;
      }
    );
  }

  /**
   * Updates an existing farm.
   */
  async update(id: string, farm: Partial<Farm>): Promise<Farm> {
    return this.execute(
      // Local Implementation (SQLite)
      async () => {
        const db = await getDatabase();
        const current = await this.getById(id);
        if (!current) throw new Error('Farm not found');

        const boundariesStr = farm.boundaries ? JSON.stringify(farm.boundaries) : 
                           (current.boundaries ? JSON.stringify(current.boundaries) : null);

        await db.execute(
          `UPDATE farms SET 
            name = COALESCE($1, name),
            village = COALESCE($2, village),
            district = COALESCE($3, district),
            state = COALESCE($4, state),
            total_area = COALESCE($5, total_area),
            area_unit = COALESCE($6, area_unit),
            gps_latitude = COALESCE($7, gps_latitude),
            gps_longitude = COALESCE($8, gps_longitude),
            boundaries = $9
           WHERE id = $10`,
          [
            farm.name || null,
            farm.village || null,
            farm.district || null,
            farm.state || null,
            farm.total_area || null,
            farm.area_unit || null,
            farm.gps_latitude || null,
            farm.gps_longitude || null,
            boundariesStr,
            id
          ]
        );

        return { ...current, ...farm } as Farm;
      },
      // Cloud Implementation
      async () => {
        const { data, error } = await supabase
          .from('farms')
          .update(farm)
          .eq('id', id)
          .select()
          .single();

        if (error) throw error;
        return data as Farm;
      }
    );
  }
}

export const farmRepository = new FarmRepository();
