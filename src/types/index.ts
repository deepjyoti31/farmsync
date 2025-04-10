
// Farm Management data types

export interface Field {
  id: string;
  name: string;
  area: number;
  areaUnit: string;
  location: string;
  soilType: string;
  soilPH: number;
  images?: string[];
  crops: Crop[];
}

export interface Crop {
  id: string;
  name: string;
  plantingDate: string;
  harvestDate: string;
  status: 'planned' | 'active' | 'harvested' | 'failed';
}

export interface Farm {
  id: string;
  name: string;
  location: string;
  totalArea: number;
  areaUnit: string;
  fields: Field[];
}

export interface FieldFormData {
  name: string;
  area: number;
  areaUnit: string;
  location: string;
  soilType: string;
  soilPH: number;
}

export interface User {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  profileImage?: string;
}
