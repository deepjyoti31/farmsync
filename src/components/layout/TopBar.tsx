import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ListChecks, Menu, PawPrint, Plus, Sprout, Wallet, Package } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAuth } from '@/contexts/AuthContext';
import { useOnlineStatus } from '@/hooks/useOnlineStatus';
import { cn } from '@/lib/utils';
import NotificationsDropdown from './NotificationsDropdown';
import LanguageSwitcher from './LanguageSwitcher';
import { findNavItem } from './navigation';

const recordActions = [
  { icon: ListChecks, labelKey: 'shell.record.task', fallback: 'A task', path: '/dashboard/tasks' },
  { icon: Sprout, labelKey: 'shell.record.harvest', fallback: 'A planting or harvest', path: '/dashboard/crops' },
  { icon: Wallet, labelKey: 'shell.record.money', fallback: 'Income or expense', path: '/dashboard/finances' },
  { icon: PawPrint, labelKey: 'shell.record.animal', fallback: 'Animal health or production', path: '/dashboard/livestock' },
  { icon: Package, labelKey: 'shell.record.stock', fallback: 'Stock in or out', path: '/dashboard/inventory' },
];

/** Green "synced" or amber "offline" pill. */
export const SyncPill = ({ className }: { className?: string }) => {
  const online = useOnlineStatus();
  const { t } = useTranslation();
  return (
    <span
      role="status"
      className={cn(
        'inline-flex h-8 items-center gap-2 whitespace-nowrap rounded-full px-3 text-[13px] font-medium',
        online ? 'bg-leaf-tint text-[#1A4D2C] dark:text-foreground' : 'bg-warning-tint text-[#5C3A00] dark:text-warning',
        className,
      )}
    >
      <span aria-hidden="true" className={cn('h-2 w-2 rounded-full', online ? 'bg-leaf' : 'bg-[#B26B00]')} />
      {online ? t('shell.online', 'Online') : t('shell.offline', 'Offline · viewing saved data')}
    </span>
  );
};

const TopBar = ({ onMenuClick }: { onMenuClick?: () => void }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const { currentOrganization } = useAuth();
  const page = findNavItem(location.pathname);

  return (
    <header className="sticky top-0 z-30 flex min-h-16 flex-wrap items-center gap-2 border-b bg-card/95 px-4 py-2.5 backdrop-blur md:gap-3 md:px-8">
      {onMenuClick && (
        <Button variant="ghost" size="icon" className="md:hidden" onClick={onMenuClick} aria-label={t('shell.open_menu', 'Open menu')}>
          <Menu className="h-6 w-6" />
        </Button>
      )}

      <nav aria-label="Breadcrumb" className="flex min-w-0 flex-1 items-center gap-2 text-sm text-muted-foreground">
        {currentOrganization?.name && (
          <>
            <span className="hidden truncate sm:inline">{currentOrganization.name}</span>
            <span aria-hidden="true" className="hidden sm:inline">/</span>
          </>
        )}
        <span className="truncate font-semibold text-foreground" aria-current="page">
          {page ? t(page.labelKey) : 'FarmSync'}
        </span>
      </nav>

      <SyncPill className="hidden sm:inline-flex" />
      <LanguageSwitcher />
      <NotificationsDropdown />

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button className="pl-3" aria-label={t('shell.record.label', 'Record')}>
            <Plus className="h-[18px] w-[18px]" strokeWidth={2.4} />
            <span className="hidden sm:inline">{t('shell.record.label', 'Record')}</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-64">
          <DropdownMenuLabel>{t('shell.record.title', 'What do you want to record?')}</DropdownMenuLabel>
          {recordActions.map((action) => (
            <DropdownMenuItem key={action.path} onClick={() => navigate(action.path)} className="cursor-pointer">
              <action.icon className="h-[18px] w-[18px] text-primary" aria-hidden="true" />
              {t(action.labelKey, action.fallback)}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
};

export default TopBar;
