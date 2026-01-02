import React, { useEffect, useMemo, useRef, useState } from "react";
import axios from "axios";
import {
  Package,
  Clock,
  TrendingUp,
  CheckCircle2,
  RefreshCw,
} from "lucide-react";

import { ModernStatCard } from "../components/modern-stat-card";
import { Card } from "../components/ui/card";
import { Badge } from "../components/ui/badge";

import PlanningPage from "./PlanningPage";
import MaterialIssuePage from "./MaterialIssuePage";
import SemiQcPage from "./SemiQcPage";
import PhosphatingPage from "./PhosphatingPage";

import { AssemblyAPage } from "./AssemblyAPage";
import { AssemblyBPage } from "./AssemblyBPage";
import { AssemblyCPage } from "./AssemblyCPage";
import { AssemblyDPage } from "./AssemblyDPage";

import { Testing1Page } from "./Testing1Page";
import { Testing2Page } from "./Testing2Page";
import { SvsPage } from "./SvsPage";
import Marking1Page from "./Marking1Page";
import Marking2Page from "./Marking2Page";
import Pdi1Page from "./Pdi1Page";
import Pdi2Page from "./Pdi2Page";
import TpiPage from "./TpiPage";

import DispatchPage from "./DispatchPage";
import { API_URL } from "../config/api";
import {
  StatCardSkeleton,
  CardLoadingSkeleton,
} from "../components/loading-skeleton";

type SummaryRecord = Record<string, number>;

const ORDER_COUNTS_ENDPOINT = `${API_URL}/order-counts`;
const POLL_INTERVAL_MS = 15000;

export function DashboardPage({ onLogout }: { onLogout?: () => void }) {
  const [currentPage, setCurrentPage] = useState("Dashboard");
  const [summary, setSummary] = useState<SummaryRecord>({});
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoadingSummary, setIsLoadingSummary] = useState(true);
  const [selectedDate, setSelectedDate] = useState(""); // yyyy-mm-dd
  const [displayDate, setDisplayDate] = useState(""); // dd-mm-yyyy

  const getCurrentUserRole = () => {
    try {
      const s =
        localStorage.getItem("user") || localStorage.getItem("userData");
      if (!s) return "";
      const u = JSON.parse(s);
      const rawRole = typeof u?.role === "object" ? u.role?.name : u?.role;
      return String(rawRole || "").toLowerCase();
    } catch {
      return "";
    }
  };
  const isAdmin = getCurrentUserRole().includes("admin");

  const didFetchOnce = useRef(false);
  const pollRef = useRef<number | null>(null);

  /* ---------- KEY NORMALIZATION ---------- */
  const normalizeKey = (r: string) => {
    if (!r) return r;
    const s = r.toLowerCase().replace(/[\s_-]+/g, "");

    if (s.includes("material")) return "materialIssue";
    if (s.includes("semi")) return "semiQc";
    if (s.includes("phosphat")) return "phosphatingQc";
    if (s === "svs") return "svs";
    if (s.includes("testing1")) return "testing1";
    if (s.includes("testing2")) return "testing2";
    if (s.includes("marking1")) return "marking1";
    if (s.includes("marking2")) return "marking2";
    if (s.includes("pdi1")) return "pdi1";
    if (s.includes("pdi2")) return "pdi2";
    if (s.includes("tpi")) return "tpi";

    if (s.includes("assemblya") || s.includes("linea")) return "assemblyA";
    if (s.includes("assemblyb") || s.includes("lineb")) return "assemblyB";
    if (s.includes("assemblyc") || s.includes("linec")) return "assemblyC";
    if (s.includes("assemblyd") || s.includes("lined")) return "assemblyD";

    return r;
  };

  /* ---------- NORMALIZE API RESPONSE ---------- */
  const normalizeResponse = (data: any): SummaryRecord => {
    const out: SummaryRecord = {};
    if (!data) return out;

    const counts = data.counts ?? data;
    if (counts && typeof counts === "object") {
      if (counts.totalOrders != null)
        out.totalOrders = Number(counts.totalOrders) || 0;

      const pairs: [string, string][] = [
        ["pendingMaterialIssue", "materialIssue"],
        ["pendingSemiQC", "semiQc"],
        ["pendingPhosphatingQC", "phosphatingQc"],
        ["pendingSVS", "svs"],
        ["pendingTesting1", "testing1"],
        ["pendingTesting2", "testing2"],
        ["pendingMarking1", "marking1"],
        ["pendingMarking2", "marking2"],
        ["pendingPDI1", "pdi1"],
        ["pendingPDI2", "pdi2"],
        ["pendingTPI", "tpi"],
        ["pendingAssemblyA", "assemblyA"],
        ["pendingAssemblyB", "assemblyB"],
        ["pendingAssemblyC", "assemblyC"],
        ["pendingAssemblyD", "assemblyD"],
        ["inProgress", "inProgress"],
        ["completed", "completed"],
        ["efficiency", "efficiency"],
        ["pendingDispatch", "dispatch"],
      ];

      for (const [src, dest] of pairs) {
        if (counts[src] != null) out[dest] = Number(counts[src]) || 0;
      }

      // ----------- Add comparison values (dynamic % changes) -----------
      if (counts.totalOrdersCompare != null)
        out.totalOrdersCompare = counts.totalOrdersCompare;

      if (counts.inProgressCompare != null)
        out.inProgressCompare = counts.inProgressCompare;

      if (counts.completedCompare != null)
        out.completedCompare = counts.completedCompare;

      if (counts.efficiencyCompare != null)
        out.efficiencyCompare = counts.efficiencyCompare;
    }

    if (data.stages && Array.isArray(data.stages)) {
      data.stages.forEach((s: any) => {
        out[normalizeKey(s.stage)] = Number(s.pending ?? 0);
      });
    }

    if (data.assembly && Array.isArray(data.assembly)) {
      data.assembly.forEach((s: any) => {
        // expecting s.line e.g. "A" and s.pending
        const key = normalizeKey("assembly" + s.line);
        out[key] = Number(s.pending ?? 0);
      });
    }

    return out;
  };

  /* ---------- FETCH SUMMARY ---------- */
  async function fetchSummary(isRefresh = false, dateArg?: string) {
    const token = localStorage.getItem("token");
    const headers: any = token ? { Authorization: `Bearer ${token}` } : {};
    headers["Content-Type"] = "application/json";

    try {
      if (isRefresh) setIsRefreshing(true);
      else setIsLoadingSummary(true);

      // ❌ REMOVE THIS LINE
      // setSummary({});

      const payload = dateArg ? { assemblyDate: dateArg } : {};
      const res = await axios.post(ORDER_COUNTS_ENDPOINT, payload, { headers });
      setSummary(normalizeResponse(res.data));
    } catch (err) {
      console.error("Dashboard summary error:", err);
    } finally {
      if (isRefresh) setIsRefreshing(false);
      else setIsLoadingSummary(false);
    }
  }

  /* ---------- POLLING & INITIAL LOAD ---------- */
  useEffect(() => {
    if (didFetchOnce.current) return; // avoid double fetch
    didFetchOnce.current = true;

    fetchSummary(false, selectedDate || undefined);

    return () => {
      if (pollRef.current) {
        clearInterval(pollRef.current);
        pollRef.current = null;
      }
    };
  }, []);

  /* ---------- PRETTY NAMES ---------- */
  const prettyName = (k: string) => {
    const map: any = {
      materialIssue: "Material Issue",
      semiQc: "Semi QC",
      phosphatingQc: "Phosphating QC",
      svs: "SVS",
      testing1: "Testing-1",
      testing2: "Testing-2",
      marking1: "Marking-1",
      marking2: "Marking-2",
      pdi1: "PDI-1",
      pdi2: "PDI-2",
      tpi: "TPI",
      dispatch: "Dispatch",
    };

    if (map[k]) return map[k];
    if (k.startsWith("assembly"))
      return "Assembly Line " + k.slice(-1).toUpperCase();
    return k;
  };

  /* ---------- CARD COLOR MAP ---------- */
  const stageColor: any = {
    materialIssue: "purple",
    semiQc: "yellow",
    phosphatingQc: "orange",
    svs: "green",
    testing1: "blue",
    testing2: "blue",
    marking1: "teal",
    marking2: "teal",
    pdi1: "violet",
    pdi2: "violet",
    tpi: "rose",
    dispatch: "green",
  };

  const stageOrder = Object.keys(stageColor);
  const assemblyOrder = ["assemblyA", "assemblyB", "assemblyC", "assemblyD"];

  /* ---------- PAGE NAVIGATION ---------- */
  const pages: any = {
    Planning: <PlanningPage />,
    MaterialIssue: <MaterialIssuePage />,
    SemiQC: <SemiQcPage />,
    Phosphating: <PhosphatingPage />,
    AssemblyA: <AssemblyAPage />,
    AssemblyB: <AssemblyBPage />,
    AssemblyC: <AssemblyCPage />,
    AssemblyD: <AssemblyDPage />,
    Testing1: <Testing1Page />,
    Testing2: <Testing2Page />,
    SVS: <SvsPage />,
    Marking1: <Marking1Page />,
    Marking2: <Marking2Page />,
    PDI1: <Pdi1Page />,
    PDI2: <Pdi2Page />,
    TPI: <TpiPage />,
    Dispatch: <DispatchPage />,
  };

  // helper: convert stage key to the page key we use in `pages`
  const stageToPageKey = (k: string) => {
    if (k.startsWith("assembly")) {
      // assemblyA -> AssemblyA
      return "Assembly" + k.slice(-1).toUpperCase();
    }
    // prettyName("materialIssue") -> "Material Issue" -> remove spaces -> MaterialIssue
    return prettyName(k).replace(/\s+/g, "");
  };

  if (currentPage !== "Dashboard") return <>{pages[currentPage]}</>;

  /* ---------- TOTALS ---------- */
  const totalOrders = useMemo(() => {
    if (summary.totalOrders != null) return Number(summary.totalOrders);
    const keys = [...stageOrder, ...assemblyOrder];
    return keys.reduce((sum, k) => sum + Number(summary[k] || 0), 0);
  }, [summary]);

  /* ============================================================= */

  return (
    <div className="page-container">
      <div className="max-w-7xl mx-auto py-10 px-6 space-y-10 main-content">
        {/* ---------------- Summary Stats ---------------- */}
        <div className="top-title">
          <h1 className="text-gray-900 flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-[#174a9f] to-[#1a5cb8] rounded-xl shadow-lg">
              <Package className="h-6 w-6 text-white" />
            </div>
            Dashboard Overview
            <button
              className="ml-4 flex items-center px-3 py-1 border rounded-md"
              onClick={() => {
                if (pollRef.current) {
                  clearInterval(pollRef.current);
                  pollRef.current = null;
                }

                // Refresh the data using the currently selected date
                fetchSummary(true, selectedDate || undefined);
              }}
            >
              <RefreshCw className="h-4 w-4 mr-1" />
              Refresh
            </button>
          </h1>
          <p className="text-gray-600 mt-1">
            Real-time insights into your manufacturing operations
          </p>
        </div>

        <>
          {isLoadingSummary || isRefreshing ? (
            <div className="text-center font-700">
              {/* <StatCardSkeleton />
              <StatCardSkeleton />
              <StatCardSkeleton />
              <StatCardSkeleton /> */}
              Loading....
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <ModernStatCard
                title="Total Orders"
                value={totalOrders}
                icon={Package}
                gradient="blue"
                change={{
                  value: `${summary.totalOrdersCompare ?? "+0%"}`,
                  positive: true,
                }}
                trend={[30, 40, 50, 60, 80]}
              />
              <ModernStatCard
                title="In Progress"
                value={summary.inProgress ?? 0}
                icon={Clock}
                gradient="orange"
                change={{
                  value: `${summary.totalOrdersCompare ?? "+0%"}`,
                  positive: true,
                }}
                trend={[20, 30, 40, 60, 75]}
              />
              <ModernStatCard
                title="Completed"
                value={summary.completed ?? 0}
                icon={CheckCircle2}
                gradient="green"
                change={{
                  value: `${summary.totalOrdersCompare ?? "+0%"}`,
                  positive: true,
                }}
                trend={[40, 50, 70, 90, 100]}
              />
              {/* <ModernStatCard
                title="Efficiency"
                value={(summary.efficiency ?? 0) + "%"}
                icon={TrendingUp}
                gradient="purple"
                change={{ value: `${summary.totalOrdersCompare ?? "+0%"}`, positive: true }}
                trend={[50, 60, 70, 80, 90]}
              /> */}
            </div>
          )}
        </>

        {/* ---------------- Stage-wise Cards ---------------- */}
        <div>
          <div className="flex items-center justify-between">
            <h2 className="text-gray-900 flex items-center gap-2 top-title">
              <Clock className="h-5 w-5 text-[#174a9f]" />
              Stage-wise Pending Quantity
            </h2>

            {/* <input
  type="date"
  value={selectedDate}   // blank by default
  // onChange={(e) => {
  //   const v = e.target.value;

  //   // Only update when full date is selected
  //   if (/^\d{4}-\d{2}-\d{2}$/.test(v)) {
  //     setSelectedDate(v);
  //     fetchSummary(false, v);
  //   }
  // }}
onChange={(e) => {
  const v = e.target.value; // yyyy-mm-dd

  if (/^\d{4}-\d{2}-\d{2}$/.test(v)) {
    const [y, m, d] = v.split("-");
    const formatted = `${d}-${m}-${y}`; // dd-mm-yyyy

    setSelectedDate(v);
    setDisplayDate(formatted);

    fetchSummary(false, formatted);
  }
}}


  className="border px-3 py-1 rounded-md shadow-sm"
/> */}
          </div>

          {/* ❗Loading affects ONLY the cards, NOT the date input */}
          {isLoadingSummary || isRefreshing ? (
            <div className="text-center font-700">Loading...</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
              {stageOrder.map((k) => {
                const c = stageColor[k];
                return (
                  <Card
                    key={k}
                    className={`p-4 rounded-xl border bg-gradient-to-br from-${c}-50 to-white border-${c}-200 hover:-translate-y-1 hover:shadow-lg transition`}
                    // onClick={() => setCurrentPage(stageToPageKey(k))}
                  >
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <div className={`p-2 rounded-lg bg-${c}-100`}>
                          <Package className={`h-4 w-4 text-${c}-600`} />
                        </div>
                        <Badge
                          className={`bg-${c}-100 text-${c}-700 border-${c}-200 text-xs`}
                        >
                          Pending
                        </Badge>
                      </div>
                      <p className="text-gray-700 text-xs">{prettyName(k)}</p>
                      <p className={`text-xl font-semibold text-${c}-900`}>
                        {summary[k] ?? 0}
                      </p>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </div>

        {/* ---------------- Assembly Cards ---------------- */}
        <div>
          <h2 className="text-gray-900 flex items-center gap-2 top-title">
            <Clock className="text-[#174a9f] pt-5 mt-5" />
            Assembly Line-wise Pending Quantity
          </h2>

          {isLoadingSummary || isRefreshing ? (
            // <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
            //   <CardLoadingSkeleton />
            //   <CardLoadingSkeleton />
            //   <CardLoadingSkeleton />
            //   <CardLoadingSkeleton />
            //   <CardLoadingSkeleton />
            // </div>
            <div className="text-center font-700">Loading....</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
              {assemblyOrder.map((k) => (
                <Card
                  key={k}
                  className={`p-4 rounded-xl border bg-gradient-to-br from-purple-50 to-white border-purple-200 hover:-translate-y-1 hover:shadow-lg transition`}
                  // onClick={() => setCurrentPage("Assembly" + k.slice(-1).toUpperCase())}
                >
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <div className="p-2 rounded-lg bg-purple-100">
                        <Package className="h-4 w-4 text-purple-600" />
                      </div>
                      <Badge className="bg-purple-100 text-purple-700 border-purple-200 text-xs">
                        Pending
                      </Badge>
                    </div>
                    <p className="text-gray-700 text-xs">{prettyName(k)}</p>
                    <p className="text-xl font-semibold text-purple-900">
                      {summary[k] ?? 0}
                    </p>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default DashboardPage;
