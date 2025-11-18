import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { LoginPage } from "./components/login-page";
import { OrderProvider } from "./components/order-context";
import ProtectedRoute from "./components/ProtectedRoute";

// Import all pages
import PlanningPage from "./pages/PlanningPage";
import MaterialIssuePage from "./pages/MaterialIssuePage";
import SemiQcPage from "./pages/SemiQcPage";
import PhosphatingPage from "./pages/PhosphatingPage";
import AssemblyPage from "./pages/AssemblyPage";
import Testing1Page from "./pages/Testing1Page";
import Testing2Page from "./pages/Testing2Page";
import Marking1Page from "./pages/Marking1Page";
import Marking2Page from "./pages/Marking2Page";
import SvsPage from "./pages/SvsPage";
import Pdi1Page from "./pages/Pdi1Page";
import Pdi2Page from "./pages/Pdi2Page";
import TpiPage from "./pages/TpiPage";
import DispatchPage from "./pages/DispatchPage";
import SuperAdminTabsPage from "./pages/SuperAdminTabsPage";

export default function App() {
  return (
    <OrderProvider>
      <Router>
        <div className="relative min-h-screen">
          {/* Background styling */}
          <div className="fixed inset-0 bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-100/40 -z-10">
            <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-gradient-to-bl from-[#174a9f]/10 via-indigo-300/5 to-transparent rounded-full blur-3xl animate-pulse-soft"></div>
            <div
              className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-gradient-to-tr from-purple-300/5 via-blue-300/5 to-transparent rounded-full blur-3xl animate-pulse-soft"
              style={{ animationDelay: "1s" }}
            ></div>
          </div>

          <Routes>

            
            {/* Login Route */}
            <Route path="/login" element={<LoginPage />} />

            {/* Admin Tabs — accessible to Admin role */}
            <Route
              path="/admin"
              element={
                <ProtectedRoute allowedRole="admin">
                  <SuperAdminTabsPage />
                </ProtectedRoute>
              }
            />

            {/* Admin route removed to restore original working model */}

            {/* ------------------- Role-based Routes ------------------- */}

            {/* Core roles */}
            <Route
              path="/planning"
              element={
                <ProtectedRoute allowedRole="planning">
                  <PlanningPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/material-issue"
              element={
                <ProtectedRoute allowedRole="material-issue">
                  <MaterialIssuePage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/semi-qc"
              element={
                <ProtectedRoute allowedRole="semi-qc">
                  <SemiQcPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/phosphating"
              element={
                <ProtectedRoute allowedRole="phosphating">
                  <PhosphatingPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/assembly"
              element={
                <ProtectedRoute allowedRole="assembly">
                  <AssemblyPage />
                </ProtectedRoute>
              }
            />

            {/* Testing Stages */}
            <Route
              path="/testing1"
              element={
                <ProtectedRoute allowedRole="testing1">
                  <Testing1Page />
                </ProtectedRoute>
              }
            />
            <Route
              path="/testing2"
              element={
                <ProtectedRoute allowedRole="testing2">
                  <Testing2Page />
                </ProtectedRoute>
              }
            />

            {/* Marking Stages */}
            <Route
              path="/marking1"
              element={
                <ProtectedRoute allowedRole="marking1">
                  <Marking1Page />
                </ProtectedRoute>
              }
            />
            <Route
              path="/marking2"
              element={
                <ProtectedRoute allowedRole="marking2">
                  <Marking2Page />
                </ProtectedRoute>
              }
            />

            {/* Stock Valve Store */}
            <Route
              path="/svs"
              element={
                <ProtectedRoute allowedRole="svs">
                  <SvsPage />
                </ProtectedRoute>
              }
            />

            {/* PDI Stages */}
            <Route
              path="/pdi1"
              element={
                <ProtectedRoute allowedRole="pdi1">
                  <Pdi1Page />
                </ProtectedRoute>
              }
            />
            <Route
              path="/pdi2"
              element={
                <ProtectedRoute allowedRole="pdi2">
                  <Pdi2Page />
                </ProtectedRoute>
              }
            />

            {/* TPI & Dispatch */}
            <Route
              path="/tpi"
              element={
                <ProtectedRoute allowedRole="tpi">
                  <TpiPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dispatch"
              element={
                <ProtectedRoute allowedRole="dispatch">
                  <DispatchPage />
                </ProtectedRoute>
              }
            />

            {/* ---------------------------------------------------------- */}

            {/* Redirect all unknown routes to login */}
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </div>
      </Router>
    </OrderProvider>
  );
}
