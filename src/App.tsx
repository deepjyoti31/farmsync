import React, { Suspense, lazy } from 'react';
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient } from "@tanstack/react-query";
import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client";
import { createSyncStoragePersister } from "@tanstack/query-sync-storage-persister";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import ProtectedRoute from "./components/auth/ProtectedRoute";
import PageLoader from "./components/common/PageLoader";
import { I18nProvider } from "./components/providers/I18nProvider";
import { useDirection } from "./hooks/useDirection";
import "./i18n";

// Pages are loaded on demand so each route ships only the code it needs.
// This keeps the initial bundle small, which matters on slow rural connections.
const MainLayout = lazy(() => import("./components/layout/MainLayout"));
const LandingPage = lazy(() => import("./pages/LandingPage"));
const Login = lazy(() => import("./pages/Login"));
const Signup = lazy(() => import("./pages/Signup"));
const NotFound = lazy(() => import("./pages/NotFound"));

const Dashboard = lazy(() => import("./pages/Dashboard"));
const Tasks = lazy(() => import("./pages/Tasks"));
const FarmsList = lazy(() => import("./pages/FarmsList"));
const Fields = lazy(() => import("./pages/Fields"));
const Crops = lazy(() => import("./pages/Crops"));
const Livestock = lazy(() => import("./pages/Livestock"));
const Equipment = lazy(() => import("./pages/Equipment"));
const Inventory = lazy(() => import("./pages/Inventory"));
const Finances = lazy(() => import("./pages/Finances"));
const Sustainability = lazy(() => import("./pages/Sustainability"));
const Weather = lazy(() => import("./pages/Weather"));
const Sensors = lazy(() => import("./pages/Sensors"));
const Analytics = lazy(() => import("./pages/Analytics"));
const Reports = lazy(() => import("./pages/Reports"));
const Market = lazy(() => import("./pages/Market"));
const Community = lazy(() => import("./pages/Community"));
const Notifications = lazy(() => import("./pages/Notifications"));
const Profile = lazy(() => import("./pages/Profile"));
const Settings = lazy(() => import("./pages/Settings"));
const OrgSettings = lazy(() => import("./pages/OrgSettings"));
const CoopDashboard = lazy(() => import("./pages/coop/CoopDashboard"));
const BulkOrdersList = lazy(() => import("./pages/coop/BulkOrdersList"));
const BatchList = lazy(() => import("./pages/coop/BatchList"));
const FinanceHub = lazy(() => import("./pages/finance/FinanceHub"));
const LoanList = lazy(() => import("./pages/finance/LoanList"));
const InsuranceList = lazy(() => import("./pages/finance/InsuranceList"));
const Compass = lazy(() => import("./pages/compliance/Compass"));
const StandardDetail = lazy(() => import("./pages/compliance/StandardDetail"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      gcTime: 1000 * 60 * 60 * 24, // 24 hours, so cached data survives offline use
    },
  },
});

const persister = createSyncStoragePersister({
  storage: window.localStorage,
});

const AppContent = () => {
  useDirection(); // Handle RTL direction

  return (
    <Suspense fallback={<PageLoader fullScreen />}>
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
          {/* Child paths are relative to /dashboard */}
          <Route index element={<Dashboard />} />
          <Route path="tasks" element={<Tasks />} />
          <Route path="farms" element={<FarmsList />} />
          <Route path="fields" element={<Fields />} />
          <Route path="crops" element={<Crops />} />
          <Route path="livestock" element={<Livestock />} />
          <Route path="equipment" element={<Equipment />} />
          <Route path="inventory" element={<Inventory />} />
          <Route path="finances" element={<Finances />} />
          <Route path="sustainability" element={<Sustainability />} />
          <Route path="weather" element={<Weather />} />
          <Route path="sensors" element={<Sensors />} />
          <Route path="analytics" element={<Analytics />} />
          <Route path="reports" element={<Reports />} />
          <Route path="market" element={<Market />} />
          <Route path="community" element={<Community />} />
          <Route path="notifications" element={<Notifications />} />
          <Route path="profile" element={<Profile />} />
          <Route path="settings" element={<Settings />} />
          <Route path="organization" element={<OrgSettings />} />

          {/* Cooperative */}
          <Route path="coop" element={<CoopDashboard />} />
          <Route path="coop/orders" element={<BulkOrdersList />} />
          <Route path="coop/batches" element={<BatchList />} />

          {/* Financial services */}
          <Route path="finance" element={<FinanceHub />} />
          <Route path="finance/loans" element={<LoanList />} />
          <Route path="finance/insurance" element={<InsuranceList />} />

          {/* Compliance */}
          <Route path="compliance" element={<Compass />} />
          <Route path="compliance/:id" element={<StandardDetail />} />

          <Route path="*" element={<NotFound />} />
        </Route>
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Suspense>
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
