
import React from 'react';
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
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
import Market from "./pages/Market";
import Reports from "./pages/Reports";
import NotFound from "./pages/NotFound";
import LandingPage from "./pages/LandingPage";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import { AuthProvider } from "./contexts/AuthContext";
import ProtectedRoute from "./components/auth/ProtectedRoute";
import Notifications from "./pages/Notifications";
import Community from "./pages/Community";

// Create a client
const queryClient = new QueryClient();

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AuthProvider>
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
                <Route path="market" element={<Market />} />
                <Route path="reports" element={<Reports />} />
                <Route path="notifications" element={<Notifications />} />
                <Route path="community" element={<Community />} />
              </Route>
              <Route path="*" element={<NotFound />} />
            </Routes>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
