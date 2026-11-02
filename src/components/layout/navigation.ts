import {
  Home,
  ListChecks,
  MapPin,
  Map,
  Sprout,
  PawPrint,
  Tractor,
  Package,
  Wallet,
  Leaf,
  CloudSun,
  Activity,
  BarChart3,
  FileText,
  Store,
  MessageSquare,
  Users,
  ShieldCheck,
  Landmark,
  Bell,
  User,
  Settings,
  Building2,
  type LucideIcon,
} from 'lucide-react';

export interface NavItem {
  icon: LucideIcon;
  labelKey: string;
  path: string;
  /** Shows the open-task count badge */
  badge?: 'tasks';
}

export interface NavSection {
  /** No title for the top group (Today, Tasks) */
  titleKey?: string;
  items: NavItem[];
}

export const navigationSections: NavSection[] = [
  {
    items: [
      { icon: Home, labelKey: 'nav.dashboard', path: '/dashboard' },
      { icon: ListChecks, labelKey: 'nav.tasks', path: '/dashboard/tasks', badge: 'tasks' },
    ],
  },
  {
    titleKey: 'nav.sections.operations',
    items: [
      { icon: MapPin, labelKey: 'nav.farms', path: '/dashboard/farms' },
      { icon: Map, labelKey: 'nav.fields', path: '/dashboard/fields' },
      { icon: Sprout, labelKey: 'nav.crops', path: '/dashboard/crops' },
      { icon: PawPrint, labelKey: 'nav.livestock', path: '/dashboard/livestock' },
      { icon: Tractor, labelKey: 'nav.equipment', path: '/dashboard/equipment' },
    ],
  },
  {
    titleKey: 'nav.sections.resources',
    items: [
      { icon: Package, labelKey: 'nav.inventory', path: '/dashboard/inventory' },
      { icon: Wallet, labelKey: 'nav.finances', path: '/dashboard/finances' },
      { icon: Leaf, labelKey: 'nav.sustainability', path: '/dashboard/sustainability' },
    ],
  },
  {
    titleKey: 'nav.sections.intelligence',
    items: [
      { icon: CloudSun, labelKey: 'nav.weather', path: '/dashboard/weather' },
      { icon: Activity, labelKey: 'nav.sensors', path: '/dashboard/sensors' },
      { icon: BarChart3, labelKey: 'nav.analytics', path: '/dashboard/analytics' },
      { icon: FileText, labelKey: 'nav.reports', path: '/dashboard/reports' },
    ],
  },
  {
    titleKey: 'nav.sections.ecosystem',
    items: [
      { icon: Store, labelKey: 'nav.market', path: '/dashboard/market' },
      { icon: MessageSquare, labelKey: 'nav.community', path: '/dashboard/community' },
      { icon: Users, labelKey: 'nav.cooperative', path: '/dashboard/coop' },
    ],
  },
  {
    titleKey: 'nav.sections.admin',
    items: [
      { icon: ShieldCheck, labelKey: 'nav.compliance', path: '/dashboard/compliance' },
      { icon: Landmark, labelKey: 'nav.financial_services', path: '/dashboard/finance' },
    ],
  },
];

/** Pages reached from the account menu or the bell rather than the sidebar */
const otherPages: NavItem[] = [
  { icon: Bell, labelKey: 'nav.notifications', path: '/dashboard/notifications' },
  { icon: User, labelKey: 'nav.profile', path: '/dashboard/profile' },
  { icon: Settings, labelKey: 'nav.settings', path: '/dashboard/settings' },
  { icon: Building2, labelKey: 'nav.organization', path: '/dashboard/organization' },
];

const allItems = [...navigationSections.flatMap((s) => s.items), ...otherPages];

/** Is `path` the current page (or a sub-page of it)? `/dashboard` only matches itself. */
export const isActivePath = (current: string, path: string) =>
  path === '/dashboard' ? current === '/dashboard' || current === '/dashboard/' : current === path || current.startsWith(`${path}/`);

/** Best matching nav item for the current location, used for the breadcrumb */
export const findNavItem = (pathname: string): NavItem | undefined =>
  allItems
    .filter((item) => isActivePath(pathname, item.path))
    .sort((a, b) => b.path.length - a.path.length)[0];
