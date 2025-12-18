import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Menu } from 'lucide-react';
import AppSidebar from './AppSidebar';
import TopBar from './TopBar';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';

const MainLayout = () => {
  const [open, setOpen] = useState(false);

  return (
    <div className="flex min-h-screen">
      {/* Desktop Sidebar */}
      <div className="hidden md:block">
        <AppSidebar />
      </div>

      {/* Mobile Sidebar (Sheet) */}
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="left" className="p-0 w-64">
          <AppSidebar onClose={() => setOpen(false)} />
        </SheetContent>
      </Sheet>

      <div className="flex flex-col flex-grow w-full">
        <TopBar onMenuClick={() => setOpen(true)} />

        <main className="flex-grow p-4 md:p-6 bg-muted/20 overflow-x-hidden">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default MainLayout;
