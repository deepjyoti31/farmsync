
export interface WeatherData {
  temperature: number;
  condition: string;
  humidity: number;
  windSpeed: number;
  icon: string;
}

export interface Field {
  id: string;
  name: string;
  location: string;
  area: number;
  areaUnit: 'acres' | 'hectares';
  soilType: string;
  soilPH: number;
  crops: Crop[];
  images: string[];
}

export interface Crop {
  id: string;
  fieldId: string;
  name: string;
  variety: string;
  plantingDate: string;
  harvestDate: string;
  status: 'planned' | 'planted' | 'growing' | 'harvested';
  tasks: Task[];
}

export interface Task {
  id: string;
  title: string;
  description: string;
  dueDate: string;
  completed: boolean;
  relatedTo?: {
    type: 'crop' | 'field' | 'livestock' | 'equipment';
    id: string;
  };
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

export interface Notification {
  id: string;
  title: string;
  message: string;
  date: string;
  read: boolean;
  type: 'info' | 'warning' | 'alert';
}

export interface Equipment {
  id: string;
  name: string;
  type: string;
  purchaseDate: string;
  lastMaintenance: string;
  nextMaintenance: string;
  status: 'operational' | 'maintenance' | 'broken';
}
