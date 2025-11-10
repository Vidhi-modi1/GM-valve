import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { LoginPage } from "./components/login-page";
import  DashboardPage  from "./components/dashboard-page";
import { OrderProvider } from "./components/order-context";
import ProtectedRoute from "./components/ProtectedRoute";

export default function App() {
  return (
    <OrderProvider>
      <Router>
        <div className="relative min-h-screen">
          <div className="fixed inset-0 bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-100/40 -z-10">
            <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-gradient-to-bl from-[#174a9f]/10 via-indigo-300/5 to-transparent rounded-full blur-3xl animate-pulse-soft"></div>
            <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-gradient-to-tr from-purple-300/5 via-blue-300/5 to-transparent rounded-full blur-3xl animate-pulse-soft" style={{ animationDelay: '1s' }}></div>
          </div>

          <Routes>
            {/* Login */}
            <Route path="/login" element={<LoginPage />} />

            {/* Role-based dashboards */}
            {[
              "planning",
              "material-issue",
              "semi-qc",
              "phosphating",
              "assembly",
              "testing",
              "marking",
              "svs",
              "pdi",
              "tpi",
              "dispatch"
            ].map((role) => (
              <Route
                key={role}
                path={`/${role}`}
                element={
                  <ProtectedRoute allowedRole={role}>
                    <DashboardPage />
                  </ProtectedRoute>
                }
              />
            ))}

            {/* Default */}
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </div>
      </Router>
    </OrderProvider>
  );
}
