import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { DashboardHeader } from "./dashboard-header";

// Import your role-specific pages here
import PlanningPage from "../pages/PlanningPage";
import MaterialIssuePage from "../pages/MaterialIssuePage";
// import SemiQcPage from "../pages/SemiQcPage";
// import PhosphatingPage from "../pages/PhosphatingPage";
// import AssemblyPage from "../pages/AssemblyPage";
// import TestingPage from "../pages/TestingPage";
// import MarkingPage from "../pages/MarkingPage";
// import SvsPage from "../pages/SvsPage";
// import PdiPage from "../pages/PdiPage";
// import TpiPage from "../pages/TpiPage";
// import DispatchPage from "../pages/DispatchPage";

const DashboardPage: React.FC = () => {
  const navigate = useNavigate();

  const [currentPage, setCurrentPage] = useState<string>("Dashboard");
  const [role, setRole] = useState<string | null>(null);
  const [userName, setUserName] = useState<string>("User");

  // ✅ On first load, restore login data from localStorage
  useEffect(() => {
    const storedUser = localStorage.getItem("user");

    if (storedUser) {
      const user = JSON.parse(storedUser);
      const userRole =
        user.role?.name?.toLowerCase?.() || user.role?.toLowerCase?.() || null;

      setRole(userRole);
      setUserName(user.name || "User");

      if (userRole && userRole !== "admin") {
        const defaultPage = getDefaultPageForRole(userRole);
        setCurrentPage(defaultPage);
      }
    } else {
      // 🚪 No user found → redirect to login
      navigate("/login");
    }
  }, [navigate]);

  // ✅ Default page mapping for each role
  const getDefaultPageForRole = (roleName: string): string => {
    switch (roleName) {
      case "planning":
        return "Planning";
      case "material-issue":
        return "MaterialIssue";
      case "semi-qc":
        return "SemiQC";
      case "phosphating-qc":
        return "PhosphatingQC";
      case "assembly-a":
        return "Assembly-A";
      case "assembly-b":
        return "Assembly-B";
      case "assembly-c":
        return "Assembly-C";
      case "assembly-d":
        return "Assembly-D";
      case "testing":
        return "Testing";
      case "marking":
        return "Marking";
      case "svs":
        return "SVS";
      case "pdi":
        return "PDI";
      case "tpi":
        return "TPI";
      case "dispatch":
        return "Dispatch";
      default:
        return "Dashboard";
    }
  };

  // ✅ Logout handler
  const handleLogout = () => {
    localStorage.clear();
    navigate("/login");
  };

  // ✅ Page navigation (when clicking header tabs)
  const handleNavigate = (page: string) => {
    setCurrentPage(page);
  };

  // ✅ Render correct page per role
  const renderRoleBasedContent = () => {
    switch (role) {
      case "planning":
        return <PlanningPage />;
      case "material-issue":
        return <MaterialIssuePage />;
      // case "material-issue":
      //   return <MaterialIssuePage />;
      // case "semi-qc":
      //   return <SemiQcPage />;
      // case "phosphating-qc":
      //   return <PhosphatingPage />;
      // case "assembly":
      //   return <AssemblyPage />;
      // case "testing":
      //   return <TestingPage />;
      // case "marking":
      //   return <MarkingPage />;
      // case "svs":
      //   return <SvsPage />;
      // case "pdi":
      //   return <PdiPage />;
      // case "tpi":
      //   return <TpiPage />;
      // case "dispatch":
      //   return <DispatchPage />;
      default:
        return (
          <div className="text-center py-20 text-gray-600">
            <h2 className="text-xl font-semibold">Welcome, {userName}</h2>
            <p className="mt-2">
              Select a module from the top navigation to begin.
            </p>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {/* Dashboard Header */}
      <DashboardHeader
        onLogout={handleLogout}
        currentPage={currentPage}
        onNavigate={handleNavigate}
        role={role}
      />

      {/* Role-specific page content */}
      <main className="flex-1 overflow-y-auto p-6">
        {renderRoleBasedContent()}
      </main>
    </div>
  );
};

export default DashboardPage;
