
import React from 'react';
import { Outlet } from 'react-router-dom';
import AppSidebar from './AppSidebar';
import TopBar from './TopBar';

const MainLayout = () => {
  return (
    <div className="flex min-h-screen">
      <AppSidebar />
      <div className="flex flex-col flex-grow">
        <TopBar />
        <main className="flex-grow p-6 bg-muted/20">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default MainLayout;
