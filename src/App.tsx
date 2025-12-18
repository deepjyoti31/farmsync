import React from 'react';
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient } from "@tanstack/react-query";
import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client";
import { createSyncStoragePersister } from "@tanstack/query-sync-storage-persister";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import MainLayout from "./components/layout/MainLayout";
import Dashboard from "./pages/Dashboard";
import Fields from "./pages/Fields";
import Crops from "./pages/Crops";
import Livestock from "./pages/Livestock";
import Finances from "./pages/Finances";
import Inventory from "./pages/Inventory";
import Equipment from "./pages/Equipment";
import Weather from "./pages/Weather";
import Sensors from "./pages/Sensors";
import Market from "./pages/Market";
import Reports from "./pages/Reports";
import Analytics from "./pages/Analytics";
import Sustainability from "./pages/Sustainability";
import NotFound from "./pages/NotFound";
import LandingPage from "./pages/LandingPage";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import { AuthProvider } from "./contexts/AuthContext";
import ProtectedRoute from "./components/auth/ProtectedRoute";
import Notifications from "./pages/Notifications";
import Community from "./pages/Community";
import FarmsList from "./pages/FarmsList";
import Profile from "./pages/Profile";
import Settings from "./pages/Settings";
import OrgSettings from "./pages/OrgSettings";
import CoopDashboard from "./pages/coop/CoopDashboard";
import BulkOrdersList from "./pages/coop/BulkOrdersList";
import BatchList from "./pages/coop/BatchList";
import { toast } from "@/hooks/use-toast";
import { I18nProvider } from "./components/providers/I18nProvider";
import { useDirection } from "./hooks/useDirection";
import "./i18n"; // Import i18n config

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      gcTime: 1000 * 60 * 60 * 24, // 24 hours
    },
  },
});

const persister = createSyncStoragePersister({
  storage: window.localStorage,
});

const AppContent = () => {
  useDirection(); // Handle RTL direction

  return (
    <Routes>
      <Route path="/" element={<Navigate to="/landing" replace />} />
      <Route path="/landing" element={<LandingPage />} />
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <MainLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Dashboard />} />
        <Route path="fields" element={<Fields />} />
        <Route path="crops" element={<Crops />} />
        <Route path="livestock" element={<Livestock />} />
        <Route path="finances" element={<Finances />} />
        <Route path="inventory" element={<Inventory />} />
        <Route path="equipment" element={<Equipment />} />
        <Route path="weather" element={<Weather />} />
        <Route path="sensors" element={<Sensors />} />
        <Route path="market" element={<Market />} />
        <Route path="reports" element={<Reports />} />
        <Route path="analytics" element={<Analytics />} />
        <Route path="sustainability" element={<Sustainability />} />
        <Route path="notifications" element={<Notifications />} />
        <Route path="community" element={<Community />} />
        <Route path="farms" element={<FarmsList />} />
        <Route path="profile" element={<Profile />} />
        <Route path="settings" element={<Settings />} />
        <Route path="dashboard/settings" element={<OrgSettings />} />
        {/* Cooperative Routes */}
        <Route path="dashboard/coop" element={<CoopDashboard />} />
        <Route path="dashboard/coop/orders" element={<BulkOrdersList />} />
        <Route path="dashboard/coop/batches" element={<BatchList />} />
      </Route>
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

const App = () => {
  return (
    <PersistQueryClientProvider client={queryClient} persistOptions={{ persister }}>
      <TooltipProvider>
        <I18nProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <AuthProvider>
              <AppContent />
            </AuthProvider>
          </BrowserRouter>
        </I18nProvider>
      </TooltipProvider>
    </PersistQueryClientProvider>
  );
};

export default App;
