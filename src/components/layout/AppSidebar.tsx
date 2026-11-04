import { toDateValue } from '@/lib/dateRanges';
import React, { useMemo, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { Search, WifiOff } from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useOnlineStatus } from '@/hooks/useOnlineStatus';
import BrandMark from '@/components/common/BrandMark';
import OrgSwitcher from '@/components/org/OrgSwitcher';
import UserMenu from './UserMenu';
import { isActivePath, navigationSections } from './navigation';

/** Open tasks that are due today or late, for the badge next to Tasks. */
const useDueTaskCount = () => {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['tasks', 'due-count', user?.id],
    enabled: !!user,
    staleTime: 60_000,
    queryFn: async () => {
      const today = toDateValue(new Date());
      const { count, error } = await supabase
        .from('tasks')
        .select('id', { count: 'exact', head: true })
        .not('status', 'in', '(completed,cancelled)')
        .lte('due_date', today);
      if (error) return 0;
      return count ?? 0;
    },
  });
};

const AppSidebar = ({ onClose }: { onClose?: () => void }) => {
  const location = useLocation();
  const { t } = useTranslation();
  const online = useOnlineStatus();
  const [query, setQuery] = useState('');
  const { data: dueCount = 0 } = useDueTaskCount();

  const sections = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return navigationSections;
    return navigationSections
      .map((section) => ({ ...section, items: section.items.filter((item) => t(item.labelKey).toLowerCase().includes(q)) }))
      .filter((section) => section.items.length > 0);
  }, [query, t]);

  return (
    <div className="flex min-h-screen w-64 flex-col gap-4 bg-sidebar px-3 pb-4 pt-5 text-sidebar-foreground md:sticky md:top-0 md:h-screen">
      <Link to="/dashboard" onClick={onClose} className="px-2 text-sidebar-foreground" aria-label="FarmSync, go to Today">
        <BrandMark />
      </Link>

      <OrgSwitcher variant="sidebar" />

      <label className="flex h-10 items-center gap-2 rounded-[10px] bg-sidebar-accent px-2.5 text-sm text-sidebar-muted focus-within:ring-2 focus-within:ring-sidebar-ring">
        <Search className="h-4 w-4 shrink-0" aria-hidden="true" />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t('shell.jump_to', 'Jump to…')}
          aria-label={t('shell.search_menu', 'Search the menu')}
          className="min-w-0 flex-1 bg-transparent text-sidebar-foreground placeholder:text-sidebar-muted focus:outline-none"
        />
      </label>

      <nav aria-label={t('shell.main_menu', 'Main menu')} className="-mx-1 flex-1 space-y-4 overflow-y-auto px-1 [scrollbar-width:thin]">
        {sections.map((section, index) => (
          <div key={section.titleKey ?? `top-${index}`} className="space-y-0.5">
            {section.titleKey && (
              <h2 className="px-2.5 pb-1 font-mono text-[11px] font-normal uppercase tracking-[0.08em] text-sidebar-muted">
                {t(section.titleKey)}
              </h2>
            )}
            <ul className="space-y-0.5">
              {section.items.map((item) => {
                const active = isActivePath(location.pathname, item.path);
                return (
                  <li key={item.path}>
                    <Link
                      to={item.path}
                      onClick={onClose}
                      aria-current={active ? 'page' : undefined}
                      className={cn(
                        'flex min-h-9 items-center gap-2.5 rounded-[9px] px-2.5 py-1.5 font-sans text-sm transition-colors',
                        active
                          ? 'bg-sidebar-primary font-semibold text-sidebar-primary-foreground'
                          : 'text-[#D3DED6] hover:bg-sidebar-accent hover:text-sidebar-foreground',
                      )}
                    >
                      <item.icon className="h-[18px] w-[18px] shrink-0" strokeWidth={1.8} aria-hidden="true" />
                      <span className="flex-1">{t(item.labelKey)}</span>
                      {item.badge === 'tasks' && dueCount > 0 && (
                        <span
                          className="flex h-5 min-w-5 items-center justify-center rounded-full bg-harvest px-1.5 font-mono text-[11px] font-medium text-harvest-foreground"
                          aria-label={t('shell.due_count', { count: dueCount, defaultValue: '{{count}} due' })}
                        >
                          {dueCount}
                        </span>
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
        {sections.length === 0 && <p className="px-2.5 text-sm text-sidebar-muted">{t('shell.no_match', 'Nothing matches that.')}</p>}
      </nav>

      {!online && (
        <div role="status" className="flex items-start gap-2 rounded-[10px] bg-harvest/15 px-3 py-2.5 text-[13px] leading-snug text-[#F3D9A8]">
          <WifiOff className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          <span>{t('shell.offline_short', "Offline. You can still view what was loaded; saving needs a connection.")}</span>
        </div>
      )}

      <div className="border-t border-sidebar-border pt-3">
        <UserMenu variant="sidebar" onNavigate={onClose} />
      </div>
    </div>
  );
};

export default AppSidebar;
