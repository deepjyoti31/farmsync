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

const navigationSections = [
  {
    titleKey: 'nav.sections.operations',
    items: [
      { icon: Home, labelKey: 'nav.dashboard', path: '/dashboard' },
      { icon: Landmark, labelKey: 'nav.farms', path: '/dashboard/farms' },
      { icon: Map, labelKey: 'nav.fields', path: '/dashboard/fields' },
      { icon: Sprout, labelKey: 'nav.crops', path: '/dashboard/crops' },
      { icon: Users, labelKey: 'nav.livestock', path: '/dashboard/livestock' },
      { icon: Tractor, labelKey: 'nav.equipment', path: '/dashboard/equipment' },
    ]
  },
  {
    titleKey: 'nav.sections.resources',
    items: [
      { icon: Warehouse, labelKey: 'nav.inventory', path: '/dashboard/inventory' },
      { icon: DollarSign, labelKey: 'nav.finances', path: '/dashboard/finances' },
      { icon: Leaf, labelKey: 'nav.sustainability', path: '/dashboard/sustainability' },
    ]
  },
  {
    titleKey: 'nav.sections.intelligence',
    items: [
      { icon: Cloud, labelKey: 'nav.weather', path: '/dashboard/weather' },
      { icon: Activity, labelKey: 'nav.sensors', path: '/dashboard/sensors' },
      { icon: BarChart, labelKey: 'nav.analytics', path: '/dashboard/analytics' },
      { icon: LineChart, labelKey: 'nav.reports', path: '/dashboard/reports' },
    ]
  },
  {
    titleKey: 'nav.sections.ecosystem',
    items: [
      { icon: Store, labelKey: 'nav.market', path: '/dashboard/market' },
      { icon: MessageSquare, labelKey: 'nav.community', path: '/dashboard/community' },
      { icon: Building2, labelKey: 'nav.cooperative', path: '/dashboard/coop' },
    ]
  },
  {
    titleKey: 'nav.sections.admin',
    items: [
      { icon: Shield, labelKey: 'nav.compliance', path: '/dashboard/compliance' },
      { icon: Landmark, labelKey: 'nav.financial_services', path: '/dashboard/finance' },
      { icon: Bell, labelKey: 'nav.notifications', path: '/dashboard/notifications' },
    ]
  }
];

const userMenuItems = [
  { icon: User, labelKey: 'nav.profile', path: '/dashboard/profile' },
  { icon: Settings, labelKey: 'nav.settings', path: '/dashboard/settings' },
];

const AppSidebar = ({ onClose }: { onClose?: () => void }) => {
  const location = useLocation();
  const { t } = useTranslation();

  return (
    <div className="bg-sidebar min-h-screen w-64 p-4 text-sidebar-foreground border-r border-sidebar-border backdrop-blur-md bg-opacity-95">
      <div className="flex items-center gap-2 mb-8 px-2">
        <div className="bg-farm-green p-1.5 rounded-lg">
          <Sprout className="h-6 w-6 text-white" />
        </div>
        <h1 className="text-xl font-bold tracking-tight text-farm-green">FarmSync</h1>
      </div>

      <nav className="space-y-6 overflow-y-auto max-h-[calc(100vh-12rem)] pr-2 scrollbar-thin scrollbar-thumb-sidebar-accent">
        {navigationSections.map((section) => (
          <div key={section.titleKey} className="space-y-2">
            <h3 className="px-4 text-[10px] font-bold text-sidebar-foreground/40 uppercase tracking-widest">
              {t(section.titleKey)}
            </h3>
            <ul className="space-y-1">
              {section.items.map((item) => (
                <li key={item.path}>
                  <Link
                    to={item.path}
                    onClick={onClose}
                    className={cn(
                      "flex items-center gap-3 px-4 py-2 rounded-lg transition-all duration-200 group",
                      location.pathname === item.path
                        ? "bg-farm-green/10 text-farm-green font-medium"
                        : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground"
                    )}
                  >
                    <item.icon className={cn(
                      "h-4 w-4 transition-transform duration-200 group-hover:scale-110",
                      location.pathname === item.path ? "text-farm-green" : "text-sidebar-foreground/40 group-hover:text-sidebar-foreground"
                    )} />
                    <span className="text-sm">{t(item.labelKey)}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}

        <div className="pt-4 border-t border-sidebar-border">
          <h3 className="px-4 mb-2 text-[10px] font-bold text-sidebar-foreground/40 uppercase tracking-widest">{t('nav.account')}</h3>
          <ul className="space-y-1">
            {userMenuItems.map((item) => (
              <li key={item.path}>
                <Link
                  to={item.path}
                  onClick={onClose}
                  className={cn(
                    "flex items-center gap-3 px-4 py-2 rounded-lg transition-all duration-200 group",
                    location.pathname === item.path
                      ? "bg-farm-green/10 text-farm-green font-medium"
                      : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground"
                  )}
                >
                  <item.icon className={cn(
                    "h-4 w-4 transition-transform duration-200 group-hover:scale-110",
                    location.pathname === item.path ? "text-farm-green" : "text-sidebar-foreground/40 group-hover:text-sidebar-foreground"
                  )} />
                  <span className="text-sm">{t(item.labelKey)}</span>
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
