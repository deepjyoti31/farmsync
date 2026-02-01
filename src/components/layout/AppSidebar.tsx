import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
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
  Building2,
  ShoppingCart,
  Package,
  Shield,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const menuItems = [
  { icon: Home, labelKey: 'nav.dashboard', path: '/dashboard' },
  { icon: Landmark, labelKey: 'nav.farms', path: '/dashboard/farms' },
  { icon: Map, labelKey: 'nav.fields', path: '/dashboard/fields' },
  { icon: Sprout, labelKey: 'nav.crops', path: '/dashboard/crops' },
  { icon: Users, labelKey: 'nav.livestock', path: '/dashboard/livestock' },
  { icon: Warehouse, labelKey: 'nav.inventory', path: '/dashboard/inventory' },
  { icon: DollarSign, labelKey: 'nav.finances', path: '/dashboard/finances' },
  { icon: Tractor, labelKey: 'nav.equipment', path: '/dashboard/equipment' },
  { icon: Cloud, labelKey: 'nav.weather', path: '/dashboard/weather' },
  { icon: Activity, labelKey: 'nav.sensors', path: '/dashboard/sensors' },
  { icon: Store, labelKey: 'nav.market', path: '/dashboard/market' },
  { icon: LineChart, labelKey: 'nav.reports', path: '/dashboard/reports' },
  { icon: BarChart, labelKey: 'nav.analytics', path: '/dashboard/analytics' },
  { icon: Leaf, labelKey: 'nav.sustainability', path: '/dashboard/sustainability' },
  { icon: Bell, labelKey: 'nav.notifications', path: '/dashboard/notifications' },
  { icon: MessageSquare, labelKey: 'nav.community', path: '/dashboard/community' },
  // Cooperative Section
  { icon: Users, labelKey: 'nav.cooperative', path: '/dashboard/coop' },
  { icon: ShoppingCart, labelKey: 'nav.bulk_orders', path: '/dashboard/coop/orders' },
  { icon: Package, labelKey: 'nav.traceability', path: '/dashboard/coop/batches' },
  // Finance Section
  { icon: Landmark, labelKey: 'nav.financial_services', path: '/dashboard/finance' },
  // Compliance
  { icon: Shield, labelKey: 'nav.compliance', path: '/dashboard/compliance' },
];

const userMenuItems = [
  { icon: User, labelKey: 'nav.profile', path: '/dashboard/profile' },
  { icon: Settings, labelKey: 'nav.settings', path: '/dashboard/settings' },
];

const AppSidebar = ({ onClose }: { onClose?: () => void }) => {
  const location = useLocation();
  const { t } = useTranslation();

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
                <span>{t(item.labelKey)}</span>
              </Link>
            </li>
          ))}
        </ul>

        <div className="mt-8 pt-6 border-t border-sidebar-border">
          <p className="px-4 mb-2 text-xs font-medium text-sidebar-foreground/60 uppercase">{t('nav.account')}</p>
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
                  <span>{t(item.labelKey)}</span>
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
