
import { 
  WeatherData, 
  Field, 
  Crop, 
  Task, 
  Livestock, 
  FinancialTransaction, 
  Notification,
  Equipment 
} from '../types';

// Mock Weather Data
export const weatherData: WeatherData = {
  temperature: 32,
  condition: 'Sunny',
  humidity: 65,
  windSpeed: 12,
  icon: 'sun'
};

// Mock Fields
export const fields: Field[] = [
  {
    id: '1',
    name: 'North Wheat Field',
    location: 'North side of village',
    area: 5,
    areaUnit: 'acres',
    area_unit: 'acres',
    soilType: 'Black soil',
    soil_type: 'Black soil',
    soilPH: 6.8,
    soil_ph: 6.8,
    crops: [],
    images: ['/placeholder.svg'],
    farm_id: 'demo-farm-01',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z'
  },
  {
    id: '2',
    name: 'South Rice Paddy',
    location: 'Near the river',
    area: 3.5,
    areaUnit: 'acres',
    area_unit: 'acres',
    soilType: 'Clayey soil',
    soil_type: 'Clayey soil',
    soilPH: 7.2,
    soil_ph: 7.2,
    crops: [],
    images: ['/placeholder.svg'],
    farm_id: 'demo-farm-01',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z'
  },
  {
    id: '3',
    name: 'Vegetable Garden',
    location: 'Behind the house',
    area: 0.5,
    areaUnit: 'acres',
    area_unit: 'acres',
    soilType: 'Loamy soil',
    soil_type: 'Loamy soil',
    soilPH: 6.5,
    soil_ph: 6.5,
    crops: [],
    images: ['/placeholder.svg'],
    farm_id: 'demo-farm-01',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z'
  }
];

// Mock Crops
export const crops: Crop[] = [
  {
    id: '1',
    name: 'Wheat',
    variety: 'HD-2967',
    plantingDate: '2024-11-15',
    harvestDate: '2025-04-20',
    status: 'planned'
  },
  {
    id: '2',
    name: 'Rice',
    variety: 'Basmati-370',
    plantingDate: '2024-06-15',
    harvestDate: '2024-11-10',
    status: 'planned'
  },
  {
    id: '3',
    name: 'Tomatoes',
    variety: 'Pusa Ruby',
    plantingDate: '2024-03-10',
    harvestDate: '2024-06-15',
    status: 'growing'
  },
  {
    id: '4',
    name: 'Okra',
    variety: 'Parbhani Kranti',
    plantingDate: '2024-04-01',
    harvestDate: '2024-06-30',
    status: 'growing'
  }
];

// Mock Tasks
export const tasks: Task[] = [
  {
    id: '1',
    title: 'Apply fertilizer to wheat field',
    description: 'Apply NPK fertilizer to wheat crop',
    dueDate: '2024-04-15',
    completed: false,
    relatedTo: {
      type: 'crop',
      id: '1'
    }
  },
  {
    id: '2',
    title: 'Prepare rice field for planting',
    description: 'Plow and level the rice field before monsoon',
    dueDate: '2024-05-20',
    completed: false,
    relatedTo: {
      type: 'field',
      id: '2'
    }
  },
  {
    id: '3',
    title: 'Tractor maintenance',
    description: 'Schedule regular maintenance for tractor',
    dueDate: '2024-04-25',
    completed: false,
    relatedTo: {
      type: 'equipment',
      id: '1'
    }
  },
  {
    id: '4',
    title: 'Harvest tomatoes',
    description: 'Harvest ripe tomatoes from vegetable garden',
    dueDate: '2024-06-10',
    completed: false,
    relatedTo: {
      type: 'crop',
      id: '3'
    }
  }
];

// Mock Livestock
export const livestock: Livestock[] = [
  {
    id: '1',
    type: 'Cattle',
    breed: 'Gir',
    count: 5,
    healthStatus: 'Good'
  },
  {
    id: '2',
    type: 'Poultry',
    breed: 'Desi',
    count: 20,
    healthStatus: 'Good'
  }
];

// Mock Financial Transactions
export const financialTransactions: FinancialTransaction[] = [
  {
    id: '1',
    date: '2024-03-15',
    amount: 15000,
    type: 'income',
    category: 'Crop Sales',
    description: 'Sold wheat harvest',
    paymentMethod: 'Cash'
  },
  {
    id: '2',
    date: '2024-03-20',
    amount: 5000,
    type: 'expense',
    category: 'Seeds',
    description: 'Purchased rice seeds',
    paymentMethod: 'UPI'
  },
  {
    id: '3',
    date: '2024-04-05',
    amount: 2000,
    type: 'expense',
    category: 'Fertilizer',
    description: 'Purchased NPK fertilizer',
    paymentMethod: 'Cash'
  },
  {
    id: '4',
    date: '2024-04-08',
    amount: 8000,
    type: 'income',
    category: 'Dairy',
    description: 'Milk sales for the month',
    paymentMethod: 'Bank Transfer'
  }
];

// Mock Notifications
export const notifications: Notification[] = [
  {
    id: '1',
    title: 'Fertilizer Application',
    message: 'It\'s time to apply fertilizer to your wheat crop',
    date: '2024-04-12',
    read: false,
    type: 'info'
  },
  {
    id: '2',
    title: 'Weather Alert',
    message: 'Heavy rainfall expected tomorrow. Secure your equipment.',
    date: '2024-04-11',
    read: true,
    type: 'warning'
  },
  {
    id: '3',
    title: 'Pest Alert',
    message: 'Aphid infestation reported in nearby farms. Check your crops.',
    date: '2024-04-10',
    read: false,
    type: 'alert'
  }
];

// Mock Equipment
export const equipment: Equipment[] = [
  {
    id: '1',
    name: 'Mahindra Tractor',
    equipment_type: 'Tractor',
    manufacturer: 'Mahindra',
    model: '575 DI XP Plus',
    purchase_date: '2020-06-15',
    purchase_price: 850000,
    status: 'operational',
    last_maintenance_date: '2024-01-20',
    next_maintenance_date: '2024-04-20',
    notes: '',
    farm_id: 'demo-farm-01',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z'
  },
  {
    id: '2',
    name: 'Irrigation Pump',
    equipment_type: 'Pump',
    manufacturer: 'Kirloskar',
    model: 'KBS-10',
    purchase_date: '2021-03-10',
    purchase_price: 25000,
    status: 'operational',
    last_maintenance_date: '2024-02-15',
    next_maintenance_date: '2024-05-15',
    notes: '',
    farm_id: 'demo-farm-01',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z'
  }
];
