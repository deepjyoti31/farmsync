
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  Home, 
  Map, 
  Sprout, 
  Users, 
  Warehouse, 
  DollarSign, 
  Tractor, 
  Cloud, 
  Store, 
  LineChart, 
  Bell, 
  MessageSquare 
} from 'lucide-react';
import { cn } from '@/lib/utils';

const menuItems = [
  { icon: Home, label: 'Dashboard', path: '/' },
  { icon: Map, label: 'Fields', path: '/fields' },
  { icon: Sprout, label: 'Crops', path: '/crops' },
  { icon: Users, label: 'Livestock', path: '/livestock' },
  { icon: Warehouse, label: 'Inventory', path: '/inventory' },
  { icon: DollarSign, label: 'Finances', path: '/finances' },
  { icon: Tractor, label: 'Equipment', path: '/equipment' },
  { icon: Cloud, label: 'Weather', path: '/weather' },
  { icon: Store, label: 'Market', path: '/market' },
  { icon: LineChart, label: 'Reports', path: '/reports' },
  { icon: Bell, label: 'Notifications', path: '/notifications' },
  { icon: MessageSquare, label: 'Community', path: '/community' },
];

const AppSidebar = () => {
  const location = useLocation();
  
  return (
    <div className="bg-sidebar min-h-screen w-64 p-4 text-sidebar-foreground">
      <div className="flex items-center gap-2 mb-8">
        <Sprout className="h-8 w-8 text-farm-yellow" />
        <h1 className="text-xl font-bold">Kisan-Sathi</h1>
      </div>
      
      <nav>
        <ul className="space-y-2">
          {menuItems.map((item) => (
            <li key={item.path}>
              <Link 
                to={item.path}
                className={cn(
                  "flex items-center gap-4 px-4 py-2 rounded-md transition-colors",
                  location.pathname === item.path 
                    ? "bg-sidebar-primary text-sidebar-primary-foreground" 
                    : "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                )}
              >
                <item.icon className="h-5 w-5" />
                <span>{item.label}</span>
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
};

export default AppSidebar;
