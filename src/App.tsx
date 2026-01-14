import { useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useAuthStore, useSettingsStore } from "@/store";
import Layout from "@/components/Layout";
import LockScreen from "@/pages/LockScreen";
import Dashboard from "@/pages/Dashboard";
import TaxCalculator from "@/pages/TaxCalculator";
import TaxReturns from "@/pages/TaxReturns";
import Deductions from "@/pages/Deductions";
import Documents from "@/pages/Documents";
import AIChat from "@/pages/AIChat";
import AuditDefense from "@/pages/AuditDefense";
import Settings from "@/pages/Settings";

function App() {
  const { isUnlocked, isLoading, checkStatus } = useAuthStore();
  const { checkApiKey } = useSettingsStore();

  useEffect(() => {
    checkStatus();
  }, [checkStatus]);

  useEffect(() => {
    if (isUnlocked) {
      checkApiKey();
    }
  }, [isUnlocked, checkApiKey]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="spinner spinner-lg mx-auto mb-4" />
          <p className="text-gray-500">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isUnlocked) {
    return <LockScreen />;
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="calculator" element={<TaxCalculator />} />
          <Route path="returns" element={<TaxReturns />} />
          <Route path="deductions" element={<Deductions />} />
          <Route path="documents" element={<Documents />} />
          <Route path="chat" element={<AIChat />} />
          <Route path="audit" element={<AuditDefense />} />
          <Route path="settings" element={<Settings />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
