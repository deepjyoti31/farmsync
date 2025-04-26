
// Import GeoJSON types
import * as GeoJSON from 'geojson';

// Farm Management data types

export interface Field {
  id: string;
  name: string;
  area: number;
  areaUnit: string;
  area_unit?: string; // Database field name
  location?: string;
  soilType?: string;
  soil_type?: string; // Database field name
  soilPH?: number;
  soil_ph?: number; // Database field name
  images?: string[];
  crops: Crop[];
  farm_id: string;
  created_at: string;
  updated_at: string;
}

export interface Crop {
  id: string;
  name: string;
  variety?: string;
  plantingDate: string;
  harvestDate: string;
  status: 'planned' | 'planted' | 'growing' | 'harvested' | 'failed';
  fieldId?: string;
  description?: string;
  growing_season?: string;
  growing_duration?: number;
}

export interface FieldCrop {
  id: string;
  field_id: string;
  crop_id: string;
  planting_date: string;
  expected_harvest_date?: string;
  actual_harvest_date?: string;
  status: 'planned' | 'planted' | 'growing' | 'harvested' | 'failed';
  yield_amount?: number;
  yield_unit?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
  crop?: Crop;
}

export interface Farm {
  id: string;
  name: string;
  location?: string;
  village?: string;
  district?: string;
  state?: string;
  totalArea?: number;
  total_area?: number; // Database field name
  areaUnit?: string;
  area_unit?: string; // Database field name
  fields?: Field[]; // Make this optional since it's not always returned from DB
  user_id: string;
  gps_latitude?: number;
  gps_longitude?: number;
  boundaries?: GeoJSON.Polygon | null; // Farm boundary coordinates
  created_at: string;
  updated_at: string;
}

export interface FieldFormData {
  name: string;
  area: number;
  areaUnit: string;
  location?: string;
  soilType?: string;
  soilPH?: number;
}

export interface User {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  profileImage?: string;
}

export interface WeatherData {
  temperature: number;
  condition: string;
  humidity: number;
  windSpeed: number;
  icon: string;
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  dueDate: string;
  completed: boolean;
  priority?: string;
  status?: string;
  assignedTo?: string;
  relatedTo?: {
    type: 'crop' | 'field' | 'equipment' | 'livestock';
    id: string;
  };
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'alert';
  read: boolean;
  date: string;
  createdAt?: string;
  category?: string;
}

export interface Livestock {
  id: string;
  type: string;
  breed: string;
  count: number;
  healthStatus: string;
}

export interface FinancialTransaction {
  id: string;
  date: string;
  amount: number;
  type: 'income' | 'expense';
  category: string;
  description: string;
  paymentMethod: string;
}

export interface FinancialCategory {
  id: string;
  name: string;
  type: 'income' | 'expense';
  created_at: string;
  updated_at: string;
}

export interface DatabaseFinancialTransaction {
  id: string;
  amount: number;
  transaction_date: string;
  description?: string;
  payment_method?: string;
  reference_number?: string;
  category_id: string;
  farm_id: string;
  created_at: string;
  updated_at: string;
}

export interface Equipment {
  id: string;
  name: string;
  equipment_type: string;
  manufacturer: string;
  model: string;
  purchase_date: string;
  purchase_price: number;
  status: string;
  last_maintenance_date: string;
  next_maintenance_date: string;
  notes: string;
  farm_id: string;
  created_at: string;
  updated_at: string;
}

export interface EquipmentMaintenance {
  id: string;
  equipment_id: string;
  maintenance_date: string;
  maintenance_type: string;
  cost: number;
  performed_by: string;
  notes: string;
  created_at: string;
  equipment?: { name: string };
}
