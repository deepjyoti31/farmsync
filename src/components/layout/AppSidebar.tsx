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
  BarChart,
  Leaf,
  Bell,
  MessageSquare,
  Landmark,
  User,
  Settings,
  Activity,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const menuItems = [
  { icon: Home, label: 'Dashboard', path: '/dashboard' },
  { icon: Landmark, label: 'Farms', path: '/dashboard/farms' },
  { icon: Map, label: 'Fields', path: '/dashboard/fields' },
  { icon: Sprout, label: 'Crops', path: '/dashboard/crops' },
  { icon: Users, label: 'Livestock', path: '/dashboard/livestock' },
  { icon: Warehouse, label: 'Inventory', path: '/dashboard/inventory' },
  { icon: DollarSign, label: 'Finances', path: '/dashboard/finances' },
  { icon: Tractor, label: 'Equipment', path: '/dashboard/equipment' },
  { icon: Cloud, label: 'Weather', path: '/dashboard/weather' },
  { icon: Activity, label: 'IoT & Sensors', path: '/dashboard/sensors' },
  { icon: Store, label: 'Market', path: '/dashboard/market' },
  { icon: LineChart, label: 'Reports', path: '/dashboard/reports' },
  { icon: BarChart, label: 'Analytics', path: '/dashboard/analytics' },
  { icon: Leaf, label: 'Sustainability', path: '/dashboard/sustainability' },
  { icon: Bell, label: 'Notifications', path: '/dashboard/notifications' },
  { icon: MessageSquare, label: 'Community', path: '/dashboard/community' },
];

const userMenuItems = [
  { icon: User, label: 'Profile', path: '/dashboard/profile' },
  { icon: Settings, label: 'Settings', path: '/dashboard/settings' },
];

const AppSidebar = ({ onClose }: { onClose?: () => void }) => {
  const location = useLocation();

  return (
    <div className="bg-sidebar min-h-screen w-64 p-4 text-sidebar-foreground">
      <div className="flex items-center gap-2 mb-8">
        <Sprout className="h-8 w-8 text-farm-yellow" />
        <h1 className="text-xl font-bold">FarmSync</h1>
      </div>

      <nav>
        <ul className="space-y-2">
          {menuItems.map((item) => (
            <li key={item.path}>
              <Link
                to={item.path}
                onClick={onClose}
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

        <div className="mt-8 pt-6 border-t border-sidebar-border">
          <p className="px-4 mb-2 text-xs font-medium text-sidebar-foreground/60 uppercase">Account</p>
          <ul className="space-y-2">
            {userMenuItems.map((item) => (
              <li key={item.path}>
                <Link
                  to={item.path}
                  onClick={onClose}
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
        </div>
      </nav>
    </div>
  );
};

export default AppSidebar;
