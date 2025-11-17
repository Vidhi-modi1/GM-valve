import React, { useEffect, useMemo, useState } from "react";
import { Button } from "../components/ui/button";
import { DashboardHeader } from "../components/dashboard-header";
import PlanningPage from "./PlanningPage";
import MaterialIssuePage from "./MaterialIssuePage";
import SemiQcPage from "./SemiQcPage";
import PhosphatingPage from "./PhosphatingPage";
import AssemblyPage from "./AssemblyPage";
import Testing1Page from "./Testing1Page";
import Testing2Page from "./Testing2Page";
import Marking1Page from "./Marking1Page";
import Marking2Page from "./Marking2Page";
import SvsPage from "./SvsPage";
import Pdi1Page from "./Pdi1Page";
import Pdi2Page from "./Pdi2Page";
import TpiPage from "./TpiPage";
import DispatchPage from "./DispatchPage";

// A lightweight tabbed container for Super Admin to see all workflow pages
const SuperAdminTabsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>("material-issue");

  // No login required here; normal routes remain protected via ProtectedRoute.

  const tabs = useMemo(
    () => [
      { key: "planning", label: "Planning", component: <PlanningPage /> },
      { key: "material-issue", label: "Material Issue", component: <MaterialIssuePage /> },
      { key: "semi-qc", label: "Semi QC", component: <SemiQcPage /> },
      { key: "phosphating", label: "Phosphating", component: <PhosphatingPage /> },
      { key: "assembly", label: "Assembly", component: <AssemblyPage /> },
      { key: "testing1", label: "Testing 1", component: <Testing1Page /> },
      { key: "testing2", label: "Testing 2", component: <Testing2Page /> },
      { key: "marking1", label: "Marking 1", component: <Marking1Page /> },
      { key: "marking2", label: "Marking 2", component: <Marking2Page /> },
      { key: "svs", label: "SVS", component: <SvsPage /> },
      { key: "pdi1", label: "PDI 1", component: <Pdi1Page /> },
      { key: "pdi2", label: "PDI 2", component: <Pdi2Page /> },
      { key: "tpi", label: "TPI", component: <TpiPage /> },
      { key: "dispatch", label: "Dispatch", component: <DispatchPage /> },
    ],
    []
  );

  const current = tabs.find((t) => t.key === activeTab) ?? tabs[0];

  return (
    <div className="flex flex-col min-h-screen">
      <DashboardHeader title="Super Admin" role="Super Admin" />

      {/* Tabs */}
      <div className="sticky top-0 z-30 bg-white/80 backdrop-blur border-b px-4 py-2 flex flex-wrap gap-2">
        {tabs.map((t) => (
          <Button
            key={t.key}
            variant={t.key === activeTab ? "default" : "outline"}
            className={t.key === activeTab ? "" : "bg-white"}
            onClick={() => setActiveTab(t.key)}
          >
            {t.label}
          </Button>
        ))}
      </div>

      {/* Active Tab Content */}
      <div className="flex-1">
        {current.component}
      </div>
    </div>
  );
};

export default SuperAdminTabsPage;