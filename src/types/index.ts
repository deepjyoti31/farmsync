
// Farm Management data types

export interface Field {
  id: string;
  name: string;
  area: number;
  areaUnit: string;
  location?: string;
  soilType?: string;
  soilPH?: number;
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
  areaUnit?: string;
  fields: Field[];
  user_id: string;
  gps_latitude?: number;
  gps_longitude?: number;
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
  relatedTo?: {
    type: 'crop' | 'field' | 'equipment' | 'livestock';
    id: string;
  };
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  date: string;
  read: boolean;
  type: 'info' | 'warning' | 'alert';
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

export interface Equipment {
  id: string;
  name: string;
  type: string;
  purchaseDate: string;
  lastMaintenance: string;
  nextMaintenance: string;
  status: string;
}
