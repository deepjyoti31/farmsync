import React, { Suspense, useState } from 'react';
import { Outlet } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { WifiOff } from 'lucide-react';
import AppSidebar from './AppSidebar';
import TopBar from './TopBar';
import PageLoader from '@/components/common/PageLoader';
import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet';
import { useOnlineStatus } from '@/hooks/useOnlineStatus';

const MainLayout = () => {
  const [open, setOpen] = useState(false);
  const online = useOnlineStatus();
  const { t } = useTranslation();

  return (
    <div className="flex min-h-screen bg-background">
      <a
        href="#main"
        className="sr-only z-50 rounded-lg bg-primary px-4 py-2 text-primary-foreground focus:not-sr-only focus:fixed focus:left-4 focus:top-4"
      >
        {t('shell.skip', 'Skip to content')}
      </a>

      {/* Desktop sidebar */}
      <div className="hidden shrink-0 bg-sidebar md:block">
        <AppSidebar />
      </div>

      {/* Phone and tablet sidebar */}
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="left" className="w-64 border-0 bg-sidebar p-0 [&>button]:text-sidebar-foreground">
          <SheetTitle className="sr-only">{t('shell.main_menu', 'Main menu')}</SheetTitle>
          <AppSidebar onClose={() => setOpen(false)} />
        </SheetContent>
      </Sheet>

      <div className="flex min-w-0 flex-grow flex-col">
        <TopBar onMenuClick={() => setOpen(true)} />

        {!online && (
          <div role="status" className="flex items-center gap-3 border-b border-[#F0D9A6] bg-warning-tint px-4 py-3 text-sm text-[#5C3A00] md:px-8 dark:border-transparent dark:text-warning">
            <WifiOff className="h-[18px] w-[18px] shrink-0" aria-hidden="true" />
            <span>
              <strong>{t('shell.offline_title', "You're offline.")}</strong>{' '}
              {t('shell.offline_body', 'Pages and records you opened before are still here. Saving changes needs a connection, so try again when the signal returns.')}
            </span>
          </div>
        )}

        <main id="main" className="flex-grow overflow-x-hidden px-4 pb-12 pt-6 md:px-8 md:pt-8">
          <div className="mx-auto w-full max-w-[1180px]">
            <Suspense fallback={<PageLoader />}>
              <Outlet />
            </Suspense>
          </div>
        </main>
      </div>
    </div>
  );
};

export default MainLayout;
