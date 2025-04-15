import { Notification } from '../types';

// Mock data for testing and development purposes

// Mock notifications
export const notifications: Notification[] = [
  {
    id: '1',
    title: 'New weather alert',
    message: 'Heavy rain expected in your area tomorrow.',
    type: 'warning',
    read: false,
    date: new Date().toISOString(),
    createdAt: new Date().toISOString(),
    category: 'weather'
  },
  {
    id: '2',
    title: 'Crop planting reminder',
    message: 'It\'s time to plant your wheat crops.',
    type: 'info',
    read: true,
    date: new Date(Date.now() - 86400000).toISOString(),
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    category: 'crops'
  },
  {
    id: '3',
    title: 'Equipment maintenance due',
    message: 'Your tractor is due for maintenance.',
    type: 'alert',
    read: false,
    date: new Date(Date.now() - 172800000).toISOString(),
    createdAt: new Date(Date.now() - 172800000).toISOString(),
    category: 'equipment'
  }
];
