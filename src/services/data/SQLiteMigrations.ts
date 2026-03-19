
import Database from '@tauri-apps/plugin-sql';
import { isTauri } from '@/utils/env';

/**
 * Mock Database for Browser environment.
 * Provides a minimal implementation of the Tauri SQL plugin API using localStorage.
 */
class MockDatabase {
  private storageKey = 'farmsync_local_db';

  private getStorage() {
    const data = localStorage.getItem(this.storageKey);
    return data ? JSON.parse(data) : { farms: [], fields: [] };
  }

  private saveStorage(data: any) {
    localStorage.setItem(this.storageKey, JSON.stringify(data));
  }

  async execute(query: string, values: any[] = []): Promise<any> {
    console.log('[MockDB] Execute:', query, values);
    // Simple parser for PoC (only handles basic INSERT/UPDATE/DELETE)
    const data = this.getStorage();
    
    if (query.toUpperCase().includes('INSERT INTO farms')) {
      const farm = {
        id: values[0],
        user_id: values[1],
        name: values[2],
        village: values[3],
        district: values[4],
        state: values[5],
        total_area: values[6],
        area_unit: values[7],
        gps_latitude: values[8],
        gps_longitude: values[9],
        boundaries: values[10],
        created_at: values[11]
      };
      data.farms.push(farm);
    } else if (query.toUpperCase().includes('INSERT INTO fields')) {
      const field = {
        id: values[0],
        farm_id: values[1],
        name: values[2],
        area: values[3],
        area_unit: values[4],
        soil_type: values[5],
        soil_ph: values[6],
        created_at: values[7]
      };
      data.fields.push(field);
    } else if (query.toUpperCase().includes('DELETE FROM farms')) {
      const id = values[0];
      data.farms = data.farms.filter((f: any) => f.id !== id);
      data.fields = data.fields.filter((f: any) => f.farm_id !== id);
    }

    this.saveStorage(data);
    return { rowsAffected: 1 };
  }

  async select<T>(query: string, values: any[] = []): Promise<T> {
    console.log('[MockDB] Select:', query, values);
    const data = this.getStorage();
    
    if (query.toUpperCase().includes('FROM farms')) {
      if (query.includes('WHERE id =')) {
        return data.farms.filter((f: any) => f.id === values[0]) as unknown as T;
      }
      return data.farms as unknown as T;
    }
    
    if (query.toUpperCase().includes('FROM fields')) {
      if (query.includes('WHERE farm_id =')) {
        return data.fields.filter((f: any) => f.farm_id === values[0]) as unknown as T;
      }
      return data.fields as unknown as T;
    }

    return [] as unknown as T;
  }
}

/**
 * SQLite Migrations for FarmSync Local-First mode.
 * This runs on application startup in Desktop mode.
 */
export const runMigrations = async (): Promise<any> => {
  if (!isTauri()) {
    console.log('Non-Tauri environment detected, skipping SQLite migrations and using MockDB.');
    return new MockDatabase();
  }

  console.log('Starting SQLite migrations...');
  
  // Load or create the database file
  const db = await Database.load('sqlite:farmsync.db');
  
  // Create Farms table
  await db.execute(`
    CREATE TABLE IF NOT EXISTS farms (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      name TEXT NOT NULL,
      village TEXT,
      district TEXT,
      state TEXT,
      total_area REAL,
      area_unit TEXT,
      gps_latitude REAL,
      gps_longitude REAL,
      boundaries TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );
  `);

  // Create Fields table
  await db.execute(`
    CREATE TABLE IF NOT EXISTS fields (
      id TEXT PRIMARY KEY,
      farm_id TEXT NOT NULL,
      name TEXT NOT NULL,
      area REAL,
      area_unit TEXT,
      soil_type TEXT,
      soil_ph REAL,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (farm_id) REFERENCES farms(id) ON DELETE CASCADE
    );
  `);

  console.log('SQLite migrations completed successfully.');
  return db;
};

// Singleton instance management
let dbInstance: any | null = null;

export const getDatabase = async (): Promise<any> => {
  if (!dbInstance) {
    dbInstance = await runMigrations();
  }
  return dbInstance;
};
