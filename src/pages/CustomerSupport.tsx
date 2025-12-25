import React, { useState, useMemo, useEffect, useRef } from 'react';
import axios from 'axios';
import { Search, Download, Eye, AlertCircle, Package, Clock, CheckCircle2, XCircle, Filter, RefreshCw, History  } from 'lucide-react';
import { ListOrdered } from "lucide-react";
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import { Card } from '../components/ui/card';
import { API_URL } from '../config/api.ts';
import { getStepLabel, getAllWorkflowSteps } from '../config/workflowSteps';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../components/ui/dialog';
import { ScrollArea } from '../components/ui/scroll-area';
import TablePagination from "../components/table-pagination";
import { DashboardHeader } from "../components/dashboard-header.tsx";

// Local normalized order type (avoid components import)
interface OrderData {
  id: string;
  assemblyLine: string;
  gmsoaNo: string;
  soaSrNo: string;
  assemblyDate: string;
  uniqueCode: string;
  poQty: number;
  splittedCode: string;
  party: string;
  customerPoNo: string;
  codeNo: string;
  product: string;
  totalQty: number;
  qty: number;
  qtyExe: number;
  qtyPending: number;
  finishedValve: string;
  gmLogo: string;
  namePlate: string;
  productSpcl1: string;
  productSpcl2: string;
  productSpcl3: string;
  inspection: string;
  painting: string;
  remarks: string;
  alertStatus: boolean;
  expectedDeliveryDate?: string;
  stage?: string;
  stageKey?: string;
  originalIndex?: number;
  workflowHistory?: Array<{ stage: string; enteredAt: string; exitedAt?: string; qtyProcessed: number }>;
  stageProgress?: Record<string, string>;
}

const CUSTOMER_SUPPORT_ENDPOINT = `${API_URL}/customer-support`;

function CustomerSupport() {
  const toDisplayDate = (apiDate: string | undefined) => {
  if (!apiDate) return "";
  const [y, m, d] = apiDate.split("-");
  return `${d}-${m}-${y}`;
};

const toApiDate = (displayDate: string) => {
  const [d, m, y] = displayDate.split("-");
  return `${y}-${m}-${d}`;
};

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStage, setSelectedStage] = useState<string>('all');
  const [selectedAssemblyLine, setSelectedAssemblyLine] = useState<string>('all');
  const [selectedOrder, setSelectedOrder] = useState<OrderData | null>(null);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [editingDeliveryDate, setEditingDeliveryDate] = useState<{ [key: string]: string }>({});
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [apiCounts, setApiCounts] = useState<{ totalOrders?: number; totalQty?: number; completeOrders?: number; urgentOrders?: number; pendingQty?: number } | null>(null);
  const [page, setPage] = useState<number>(1);
  const [perPage, setPerPage] = useState<number>(20);

  // Real-time stage data fetched from API per pages convention
  const [dataByStage, setDataByStage] = useState<Record<string, OrderData[]>>({});

  const [showHistoryDialog, setShowHistoryDialog] = useState(false);
const [orderHistory, setOrderHistory] = useState<any[]>([]);

  const token = localStorage.getItem('token');

  const stages: Array<{ key: string; display: string }> = useMemo(() => {
    // Temporary frontend restriction: if role is customer-support, limit to Planning
    let role = "";
    try {
      const s = localStorage.getItem("user") || localStorage.getItem("userData");
      if (s) {
        const u = JSON.parse(s);
        const raw = typeof u?.role === "object" ? u.role?.name : u?.role;
        role = String(raw || "").toLowerCase();
      }
    } catch {}

    const keys = getAllWorkflowSteps();
    return keys.map((key) => ({ key, display: getStepLabel(key) }));
  }, []);

  // Map backend stage labels to our canonical frontend keys
  const labelToKey = useMemo(() => {
    const map: Record<string, string> = {};
    getAllWorkflowSteps().forEach((k) => {
      const label = getStepLabel(k)
        .replace(/-/g, " ")
        .replace(/\s+/g, " ")
        .trim()
        .toLowerCase();
      map[label] = k;
    });
    // Handle known backend label variants/aliases
    map["phosphating qc"] = "phosphating";
    map["after phosphating qc"] = "phosphating";
    return map;
  }, []);

  const normalizeStageKey = (raw: unknown): string => {
    const s = String(raw || "")
      .replace(/-/g, " ")
      .replace(/\s+/g, " ")
      .trim()
      .toLowerCase();
    return labelToKey[s] || s.replace(/\s+/g, "-") || "planning";
  };

//   const labelToKey = useMemo(() => {
//   const map: Record<string, string> = {};

//   getAllWorkflowSteps().forEach((k) => {
//     const label = getStepLabel(k)
//       .replace(/-/g, " ")
//       .toLowerCase()
//       .trim();

//     map[label] = k;
//   });

//   // 🔥 ADD THESE
//   map["assembly a"] = "assembly-a";
//   map["assembly b"] = "assembly-b";
//   map["assembly c"] = "assembly-c";
//   map["assembly d"] = "assembly-d";

//   return map;
// }, []);


  const mapApiItemToOrder = (item: any): OrderData => {
 
  const rawStage =
    item.status ||
    item.stage ||
    item.stage_name ||
    item.current_stage ||
    item.menu_name ||
   "Planning";

const stageKey = normalizeStageKey(rawStage);

  // ⭐ Normalize backend stage_progress keys
  const cleanedProgress: Record<string, string> = {};
  Object.entries(item.stage_progress || {}).forEach(([key, value]) => {
    const normalized = key
      .replace(/-/g, " ")        // Remove hyphens
      .replace(/\s+/g, " ")      // Collapse multiple spaces
      .trim();                   // Remove edges

    cleanedProgress[normalized] = value;
  });

  return {
    id: String(item.id),
    assemblyLine: item.assembly_no || '',
    gmsoaNo: item.soa_no || '',
    soaSrNo: item.soa_sr_no || '',
    assemblyDate: item.assembly_date || '',

    uniqueCode: item.unique_code || item.order_no || '',

    splittedCode: item.splitted_code || '',
    party: item.party_name || item.party || '',
    customerPoNo: item.customer_po_no || '',
    codeNo: item.code_no || '',
    product: item.product || '',
    totalQty: Number(item.totalQty || item.total_qty || item.qty || 0),
    qty: Number(item.qty || 0),
    qtyExe: Number(item.qty_executed || 0),
    qtyPending: Number(item.qty_pending || 0),
    poQty: Number(item.po_qty || 0),

    finishedValve: item.finished_valve || '',
    gmLogo: item.gm_logo || '',
    namePlate: item.name_plate || '',
    productSpcl1: item.product_spc1 || '',
    productSpcl2: item.product_spc2 || '',
    productSpcl3: item.product_spc3 || '',
    inspection: item.inspection || '',
    painting: item.painting || '',
    remarks: item.remarks || '',

    alertStatus:
      item.is_urgent === true ||
      item.is_urgent === 'true' ||
      item.alert_status === true ||
      item.alert_status === 'true' ||
      item.urgent === 1 ||
      item.urgent === '1',

   expectedDeliveryDate: (() => {
  const raw =
    item.deliveryDate ||          // ✅ value coming from customer-support API
    item.expected_delivery_date ||
    item.expectedDeliveryDate ||
    item.delivery_date ||
    "";

  // API gives DD-MM-YYYY → convert to YYYY-MM-DD for <input type="date">
  if (typeof raw === "string" && /^\d{2}-\d{2}-\d{4}$/.test(raw)) {
    const [d, m, y] = raw.split("-");
    return `${y}-${m}-${d}`;
  }

  return raw;
})(),


    stage: rawStage,    
    stageKey: stageKey, 

    workflowHistory: item.workflowHistory || [],
    stageProgress: cleanedProgress,   // ⭐ FINAL FIX
  };

  
};


  const fetchStage = async (stageKey: string): Promise<OrderData[]> => {
    try {
      const menuName = getStepLabel(stageKey);
      const res = await axios.post(
        `${API_URL}/order-list`,
        { menu_name: menuName },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const ok =
        res?.data?.Resp_code === 'true' ||
        res?.data?.Resp_code === true ||
        res?.data?.Resp_code === 'RCS';

      if (ok && Array.isArray(res.data?.data)) {
        return (res.data.data as any[]).map(mapApiItemToOrder);
      }
      return [];
    } catch (e) {
      console.warn(`Failed to fetch stage ${stageKey}`, e);
      return [];
    }
  };

const fetchOrderHistory = async (order: OrderData) => {
  try {
    const res = await axios.post(
      `${API_URL}/order-history`,
      {
        per_page: 20,
        current_page: 1,
        orderId: order.id
      },
      { headers: { Authorization: `Bearer ${token}` } }
    );

    const splits = res?.data?.splits || {};
    const historyList = Object.values(splits).flat();

    // Always open modal; show message if empty
    setOrderHistory(Array.isArray(historyList) ? historyList : []);
    setShowHistoryDialog(true);

  } catch (err) {
    console.error("Error fetching order history", err);

    // Open modal even on error to surface feedback
    setOrderHistory([]);
    setShowHistoryDialog(true);
  }
};




  const fetchAllOrdersFallback = async (): Promise<OrderData[]> => {
    try {
      // Backend does not allow GET /order-list (405). Use POST with a benign menu_name (Planning)
      const res = await axios.post(
        `${API_URL}/order-list`,
        { menu_name: getStepLabel('planning') },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const ok =
        res?.data?.Resp_code === 'true' ||
        res?.data?.Resp_code === true ||
        res?.data?.Resp_code === 'RCS' ||
        res?.status === 200;
      const raw = ok ? res?.data?.data ?? res?.data ?? [] : [];
      return Array.isArray(raw) ? (raw as any[]).map(mapApiItemToOrder) : [];
    } catch (e) {
      console.warn('Fallback POST /order-list (Planning) failed', e);
      return [];
    }
  };

  const inFlightRef = useRef(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

const reloadData = async () => {

  if (inFlightRef.current) return;
  inFlightRef.current = true;
  setIsRefreshing(true);
  setLoading(true);
  setError(null);

  const next: Record<string, OrderData[]> = {};

  try {
    // Always fetch all stages; we filter client-side for stage and search
const backendStage = getBackendStage(selectedStage);

const payload: any = {
  per_page: 1000,
  current_page: 1,
};

// ✅ only send stage when user selects one
if (backendStage) {
  payload.stage = backendStage;
}

const res = await axios.post(
  CUSTOMER_SUPPORT_ENDPOINT,
  payload,
  { headers: { Authorization: `Bearer ${token}` } }
);


    const raw = Array.isArray(res?.data?.data)
      ? res.data.data
      : [];

    const orders = (raw as any[]).map((item: any, idx: number) => {
      const mapped = mapApiItemToOrder(item);
      return {
        ...mapped,
        expectedDeliveryDate: mapped.expectedDeliveryDate || "",
        originalIndex: idx,
      };
    });
    setApiCounts(res?.data?.counts || null);

    // ⭐ FIX: store orders by REAL stage
  orders.forEach(order => {
  const key = order.stageKey || "planning"; // ✅ fallback
  if (!next[key]) next[key] = [];
  next[key].push(order);
});


  } catch (e) {
    console.warn("GET /customer-support failed", e);
  }

  setDataByStage(next);
  setEditingDeliveryDate({});
  setLoading(false);
  setIsRefreshing(false);
  inFlightRef.current = false;
};

//   const saveDeliveryDate = async (order: OrderData, date: string) => {

//     try {
//       const form = new FormData();
//       form.append('orderId', String(order.id));
//       form.append('unique_code', String(order.uniqueCode));
//       form.append('date', date);
//       const res = await axios.post(
//         `${API_URL}/add-delivery-date`,
//         form,
//         { headers: { Authorization: `Bearer ${token}` } }
//       );
//       const ok =
//         res?.data?.Resp_code === 'true' ||
//         res?.data?.Resp_code === true ||
//         res?.data?.status === true;
//       if (ok) {
//         // setDataByStage(prev => {
//         //   const cur = prev['planning'] || [];
//         //   const updated = cur.map(o =>
//         //     o.uniqueCode === order.uniqueCode ? { ...o, expectedDeliveryDate: date } : o
//         //   );
//         //   return { ...prev, planning: updated };
//         // });
//         setDataByStage(prev => {
//   const cur = prev['planning'] || [];
//   const updated = cur.map(o =>
//     o.uniqueCode === order.uniqueCode ? { ...o, expectedDeliveryDate: date } : o
//   );
//   return { ...prev, planning: updated };
// });
//         setEditingDeliveryDate(prev => {
//           const next = { ...prev };
//           delete next[order.uniqueCode];
//           return next;
//         });
//       }
//     } catch (e) {
//     }
//   };
const saveDeliveryDate = async (order: OrderData, date: string) => {
  try {
    const form = new FormData();
    form.append("orderId", String(order.id));
    form.append("unique_code", order.uniqueCode);
    // Convert from YYYY-MM-DD (input) to DD-MM-YYYY for API
    form.append("date", toDisplayDate(date));

    const res = await axios.post(
      `${API_URL}/add-delivery-date`,
      form,
      { headers: { Authorization: `Bearer ${token}` } }
    );

    if (res?.data?.Resp_code) {
      await reloadData();
      setEditingDeliveryDate(prev => {
        const next = { ...prev };
        delete next[order.uniqueCode];
        return next;
      });
    }
  } catch (err) {
    console.error("Date save failed:", err);
  }
};

useEffect(() => {
  reloadData();
}, [selectedStage, selectedAssemblyLine]);


  // Aliases to keep existing logic compatible
  const planningOrders = dataByStage['planning'] || [];
  const materialIssueOrders = dataByStage['material-issue'] || [];
  const semiQcOrders = dataByStage['semi-qc'] || [];
  const phosphatingOrders = dataByStage['phosphating'] || [];
  const assemblyAOrders = dataByStage['assembly-a'] || [];
  const assemblyBOrders = dataByStage['assembly-b'] || [];
  const assemblyCOrders = dataByStage['assembly-c'] || [];
  const assemblyDOrders = dataByStage['assembly-d'] || [];
  const assemblyOrders = [
    ...assemblyAOrders,
    ...assemblyBOrders,
    ...assemblyCOrders,
    ...assemblyDOrders,
  ];
  // const testingOrders = [...(dataByStage['testing1'] || []), ...(dataByStage['testing2'] || [])];
    const testing1Orders = dataByStage['testing1'] || [];
      const testing2Orders = dataByStage['testing2'] || [];
  const svsOrders = dataByStage['svs'] || [];
  const markingOrders = [...(dataByStage['marking1'] || []), ...(dataByStage['marking2'] || [])];
  const pdi1Orders = dataByStage['pdi1'] || [];
  const pdi2Orders = dataByStage['pdi2'] || [];
  const tpiOrders = dataByStage['tpi'] || [];
  const dispatchOrders = dataByStage['dispatch'] || [];

  // Consolidate all orders from all stages
// const allOrders = useMemo(() => {
//   return (dataByStage["planning"] || []).map(order => {
//     const stageLabel = order.stage
//       ? getStepLabel(order.stage)
//       : getStepLabel((order as any).status || "");

//     return {
//       ...order,
//       currentStage: stageLabel || "Unknown"
//     };
//   });
// }, [dataByStage]);
const allOrders = useMemo(() => {
  return Object.values(dataByStage)
    .flat()
    .map(order => ({
      ...order,
       stageKey: order.stageKey,
  currentStage: order.stage || getStepLabel(order.stageKey),
    }))
    .sort((a, b) => (a.originalIndex ?? 0) - (b.originalIndex ?? 0));
}, [dataByStage]);



const groupedHistory = orderHistory.reduce((acc: any, item: any) => {
  const key = item.split_code || "UNKNOWN";
  if (!acc[key]) acc[key] = [];
  acc[key].push(item);
  return acc;
}, {});



  // Filter orders
  // const filteredOrders = useMemo(() => {
  //   return allOrders.filter(order => {
  //     const searchLower = searchTerm.toLowerCase();
  //     const matchesSearch = 
  //       order.uniqueCode.toLowerCase().includes(searchLower) ||
  //       order.gmsoaNo.toLowerCase().includes(searchLower) ||
  //       order.party.toLowerCase().includes(searchLower) ||
  //       order.customerPoNo.toLowerCase().includes(searchLower) ||
  //       order.product.toLowerCase().includes(searchLower) ||
  //       order.codeNo.toLowerCase().includes(searchLower);

  //    const matchesStage =
  // selectedStage === "all" ||
  // order.stageKey === selectedStage;
  //     const matchesLine = selectedAssemblyLine === 'all' || order.assemblyLine === selectedAssemblyLine;

  //   return matchesSearch && matchesStage && matchesLine;
  // });
  // }, [allOrders, searchTerm, selectedStage, selectedAssemblyLine]);
  
const filteredOrders = useMemo(() => {
  return allOrders.filter(order => {
    const searchLower = searchTerm.toLowerCase();

    const matchesSearch =
      order.uniqueCode.toLowerCase().includes(searchLower) ||
      order.gmsoaNo.toLowerCase().includes(searchLower) ||
      order.party.toLowerCase().includes(searchLower) ||
      order.customerPoNo.toLowerCase().includes(searchLower) ||
      order.product.toLowerCase().includes(searchLower) ||
      order.codeNo.toLowerCase().includes(searchLower);

    const matchesLine =
      selectedAssemblyLine === "all" ||
      order.assemblyLine === selectedAssemblyLine;

    return matchesSearch && matchesLine;
  });
}, [allOrders, searchTerm, selectedAssemblyLine]);


const getBackendStage = (stageKey: string) => {
  if (stageKey === "all") return "";

  // frontend key → backend label
  return getStepLabel(stageKey);
};


  const paginatedOrders = useMemo(() => {
    const start = (page - 1) * perPage;
    return filteredOrders.slice(start, start + perPage);
  }, [filteredOrders, page, perPage]);

  useEffect(() => {
    setPage(1);
  }, [searchTerm, selectedStage, selectedAssemblyLine]);

  // Calculate statistics
  const stats = useMemo(() => {
    const totalOrders = apiCounts?.totalOrders ?? allOrders.length;
    const totalQty = apiCounts?.totalQty ?? allOrders.reduce((sum, order) => sum + (order.totalQty || 0), 0);
    const totalCompleted = apiCounts?.completeOrders ?? allOrders.reduce((sum, order) => sum + order.qtyExe, 0);
    const totalPending = apiCounts?.pendingQty ?? allOrders.reduce((sum, order) => sum + order.qtyPending, 0);
    const alertCount = apiCounts?.urgentOrders ?? allOrders.filter(order => order.alertStatus).length;

    // Calculate pending quantities for each stage
    const materialIssuePending = materialIssueOrders.reduce((sum, order) => sum + order.qtyPending, 0);
    const semiQcPending = semiQcOrders.reduce((sum, order) => sum + order.qtyPending, 0);
    const phosphatingQcPending = phosphatingOrders.reduce((sum, order) => sum + order.qtyPending, 0);
    const assemblyPending = assemblyOrders.reduce((sum, order) => sum + order.qtyPending, 0);
    const assemblyAPending = assemblyAOrders.reduce((sum, order) => sum + order.qtyPending, 0);
    const assemblyBPending = assemblyBOrders.reduce((sum, order) => sum + order.qtyPending, 0);
    const assemblyCPending = assemblyCOrders.reduce((sum, order) => sum + order.qtyPending, 0);
    const assemblyDPending = assemblyDOrders.reduce((sum, order) => sum + order.qtyPending, 0);
    const testingPending = testing1Orders.reduce((sum, order) => sum + order.qtyPending, 0);
       const testingPending2 = testing2Orders.reduce((sum, order) => sum + order.qtyPending, 0);
    const svsPending = svsOrders.reduce((sum, order) => sum + order.qtyPending, 0);
    const markingPending = markingOrders.reduce((sum, order) => sum + order.qtyPending, 0);
    const testing1Pending = (dataByStage['testing1'] || []).reduce((sum, order) => sum + order.qtyPending, 0);
    const testing2Pending = (dataByStage['testing2'] || []).reduce((sum, order) => sum + order.qtyPending, 0);
    const marking1Pending = (dataByStage['marking1'] || []).reduce((sum, order) => sum + order.qtyPending, 0);
    const marking2Pending = (dataByStage['marking2'] || []).reduce((sum, order) => sum + order.qtyPending, 0);
    const pdi1Pending = pdi1Orders.reduce((sum, order) => sum + order.qtyPending, 0);
    const pdi2Pending = pdi2Orders.reduce((sum, order) => sum + order.qtyPending, 0);
    const tpiPending = tpiOrders.reduce((sum, order) => sum + order.qtyPending, 0);
    const dispatchPending = dispatchOrders.reduce((sum, order) => sum + order.qtyPending, 0);

    // Calculate pending quantities for each assembly line
    const assemblyLines = ['A', 'B', 'C', 'D', 'S'];
    const assemblyLinePending: { [key: string]: number } = {};
    assemblyLines.forEach(line => {
      assemblyLinePending[line] = allOrders
        .filter(order => order.assemblyLine === line)
        .reduce((sum, order) => sum + order.qtyPending, 0);
    });

    // In-progress and done counts per stage
    const makeCounts = (orders: OrderData[]) => ({
      inProgress: orders.filter(o => o.qtyExe > 0 && o.qtyPending > 0).length,
      done: orders.filter(o => o.qtyPending === 0 && (o.totalQty > 0 || o.qtyExe > 0)).length,
    });

    const materialIssueCounts = makeCounts(materialIssueOrders);
    const semiQcCounts = makeCounts(semiQcOrders);
    const phosphatingCounts = makeCounts(phosphatingOrders);
    const assemblyCounts = makeCounts(assemblyOrders);
    const assemblyACounts = makeCounts(assemblyAOrders);
    const assemblyBCounts = makeCounts(assemblyBOrders);
    const assemblyCCounts = makeCounts(assemblyCOrders);
    const assemblyDCounts = makeCounts(assemblyDOrders);
    const testing1Counts = makeCounts(dataByStage['testing1'] || []);
    const testing2Counts = makeCounts(dataByStage['testing2'] || []);
    const svsCounts = makeCounts(svsOrders);
    const marking1Counts = makeCounts(dataByStage['marking1'] || []);
    const marking2Counts = makeCounts(dataByStage['marking2'] || []);
    const pdi1Counts = makeCounts(pdi1Orders);
    const pdi2Counts = makeCounts(pdi2Orders);
    const tpiCounts = makeCounts(tpiOrders);
    const dispatchCounts = makeCounts(dispatchOrders);

    return { 
      totalOrders, 
      totalQty, 
      totalCompleted, 
      totalPending, 
      alertCount,
      materialIssuePending,
      semiQcPending,
      phosphatingQcPending,
      assemblyPending,
      assemblyAPending,
      assemblyBPending,
      assemblyCPending,
      assemblyDPending,
      testingPending,
      testingPending2,
      svsPending,
      markingPending,
      testing1Pending,
      testing2Pending,
      marking1Pending,
      marking2Pending,
      pdi1Pending,
      pdi2Pending,
      tpiPending,
      dispatchPending,
      materialIssueCounts,
      semiQcCounts,
      phosphatingCounts,
      assemblyCounts,
      assemblyACounts,
      assemblyBCounts,
      assemblyCCounts,
      assemblyDCounts,
      testing1Counts,
      testing2Counts,
      svsCounts,
      marking1Counts,
      marking2Counts,
      pdi1Counts,
      pdi2Counts,
      tpiCounts,
      dispatchCounts,
      assemblyLinePending
    };
  }, [allOrders, dataByStage]);

  const handleViewDetails = (order: OrderData & { currentStage: string }) => {
    setSelectedOrder(order);
    setShowDetailsDialog(true);
  };

  const handleExport = () => {
    // Import exceljs library for better styling support
    import('exceljs/dist/exceljs.min.js').then(async (ExcelJSModule) => {
      const ExcelJS = ExcelJSModule.default || ExcelJSModule;
      
      // Create a new workbook and worksheet
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Customer Support');

      // Get current date and time
      const now = new Date();
      const currentDate = now.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      });
      const currentTime = now.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit',
        second: '2-digit',
        hour12: true 
      });

      // Define columns with headers and widths - headers will start from row 4
      worksheet.columns = [
        { header: 'Assembly Line', key: 'assemblyLine', width: 15 },
        { header: 'GMSOA NO.', key: 'gmsoaNo', width: 12 },
        { header: 'SOA SR NO.', key: 'soaSrNo', width: 12 },
        { header: 'Assembly Date', key: 'assemblyDate', width: 15 },
        { header: 'Party', key: 'party', width: 30 },
        { header: 'Order No.', key: 'orderNo', width: 15 },
        { header: 'Code No.', key: 'codeNo', width: 25 },
        { header: 'Product', key: 'product', width: 50 },
        { header: 'Qty', key: 'qty', width: 8 },
        { header: 'Qty Executed', key: 'qtyExecuted', width: 12 },
        { header: 'Qty Pending', key: 'qtyPending', width: 12 },
        { header: 'Planning', key: 'planning', width: 14 },
        { header: 'Material Issue', key: 'materialIssue', width: 15 },
        { header: 'Semi QC', key: 'semiQc', width: 12 },
        { header: 'Phosphating QC', key: 'phosphating', width: 15 },
        { header: 'Assembly A', key: 'assemblyA', width: 12 },
        { header: 'Assembly B', key: 'assemblyB', width: 12 },
        { header: 'Assembly C', key: 'assemblyC', width: 12 },
        { header: 'Assembly D', key: 'assemblyD', width: 12 },
        { header: 'Testing1', key: 'testing1', width: 12 },
        { header: 'Testing2', key: 'testing2', width: 12 },
        { header: 'SVS', key: 'svs', width: 10 },
        { header: 'Marking1', key: 'marking1', width: 12 },
        { header: 'Marking2', key: 'marking2', width: 12 },
        { header: 'PDI1', key: 'pdi1', width: 12 },
        { header: 'PDI2', key: 'pdi2', width: 12 },
        { header: 'TPI', key: 'tpi', width: 10 },
        { header: 'Dispatch', key: 'dispatch', width: 12 },
      ];
      
      // Insert rows at the top to shift headers down
      worksheet.spliceRows(1, 0, [], [], []); // Insert 3 blank rows
      
      // Add Date row (Row 1)
      worksheet.getCell('A1').value = 'Date';
      worksheet.getCell('B1').value = currentDate;
      worksheet.getCell('A1').font = { bold: true, size: 12 };
      worksheet.getCell('B1').font = { size: 12 };

      // Add Time row (Row 2)
      worksheet.getCell('A2').value = 'Time';
      worksheet.getCell('B2').value = currentTime;
      worksheet.getCell('A2').font = { bold: true, size: 12 };
      worksheet.getCell('B2').font = { size: 12 };

      // Row 3 is blank
      
      // Style the header row (now at row 4) with different colors for workflow stages
      const headerRow = worksheet.getRow(4);
      headerRow.height = 20;
      headerRow.font = { bold: true, size: 11 };
      headerRow.alignment = { vertical: 'middle', horizontal: 'center' };

      // Apply colors to specific header cells (workflow stages)
      const headerColors = {
        12: 'DBEAFE', // Planning - blue
        13: 'E9D5FF', // Material Issue - purple
        14: 'FEF3C7', // Semi QC - yellow
        15: 'FED7AA', // Phosphating QC - orange
        16: 'E0E7FF', // Assembly A - indigo
        17: 'E0E7FF', // Assembly B - indigo
        18: 'E0E7FF', // Assembly C - indigo
        19: 'E0E7FF', // Assembly D - indigo
        20: 'FCE7F3', // Testing1 - pink
        21: 'FCE7F3', // Testing2 - pink
        22: 'D1FAE5', // SVS - green
        23: 'CCFBF1', // Marking1 - teal
        24: 'CCFBF1', // Marking2 - teal
        25: 'F3F4F6', // PDI1 - gray
        26: 'F3F4F6', // PDI2 - gray
        27: 'FFE4E6', // TPI - rose
        28: 'DCFCE7', // Dispatch - green
      };

      // Apply header styling
      headerRow.eachCell((cell, colNumber) => {
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: headerColors[colNumber] ? 'FF' + headerColors[colNumber] : 'FFF3F4F6' }
        };
        cell.border = {
          top: { style: 'thin', color: { argb: 'FFD1D5DB' } },
          left: { style: 'thin', color: { argb: 'FFD1D5DB' } },
          bottom: { style: 'thin', color: { argb: 'FFD1D5DB' } },
          right: { style: 'thin', color: { argb: 'FFD1D5DB' } }
        };
      });

      // Add data rows (starting from row 5)
      filteredOrders.forEach(order => {
        worksheet.addRow({
          assemblyLine: order.assemblyLine,
          gmsoaNo: order.gmsoaNo,
          soaSrNo: order.soaSrNo,
          assemblyDate: order.assemblyDate,
          party: order.party,
          orderNo: order.customerPoNo,
          codeNo: order.codeNo,
          product: order.product,
          qty: order.totalQty,
          qtyExecuted: order.qtyExe,
          qtyPending: order.qtyPending,
          // New workflow columns using configured labels
          planning: getStageStatus(order, getStepLabel('planning')),
          materialIssue: getStageStatus(order, getStepLabel('material-issue')),
          semiQc: getStageStatus(order, getStepLabel('semi-qc')),
          phosphating: getStageStatus(order, getStepLabel('phosphating')),
          assemblyA: getStageStatus(order, getStepLabel('assembly-a')),
          assemblyB: getStageStatus(order, getStepLabel('assembly-b')),
          assemblyC: getStageStatus(order, getStepLabel('assembly-c')),
          assemblyD: getStageStatus(order, getStepLabel('assembly-d')),
          testing1: getStageStatus(order, getStepLabel('testing1')),
          testing2: getStageStatus(order, getStepLabel('testing2')),
          svs: getStageStatus(order, getStepLabel('svs')),
          marking1: getStageStatus(order, getStepLabel('marking1')),
          marking2: getStageStatus(order, getStepLabel('marking2')),
          pdi1: getStageStatus(order, getStepLabel('pdi1')),
          pdi2: getStageStatus(order, getStepLabel('pdi2')),
          tpi: getStageStatus(order, getStepLabel('tpi')),
          dispatch: getStageStatus(order, getStepLabel('dispatch')),
          // Legacy columns will be ignored if keys are not present in worksheet.columns
          materialIssueLegacy: getStageStatus(order, 'Material Issue'),
          semiQcLegacy: getStageStatus(order, 'Semi QC'),
          phosphatingQcLegacy: getStageStatus(order, 'After Phosphating QC'),
          assemblyLegacy: getStageStatus(order, 'Assembly'),
          testingLegacy: getStageStatus(order, 'Testing'),
          svsLegacy: getStageStatus(order, 'SVS'),
          markingLegacy: getStageStatus(order, 'Marking'),
        });
      });

      // Style data rows and apply conditional coloring based on status
      worksheet.eachRow((row, rowNumber) => {
        if (rowNumber > 3) { // Skip date/blank/header rows
          row.eachCell((cell, colNumber) => {
            cell.alignment = { vertical: 'middle', horizontal: 'left' };
            cell.border = {
              top: { style: 'thin', color: { argb: 'FFE5E7EB' } },
              left: { style: 'thin', color: { argb: 'FFE5E7EB' } },
              bottom: { style: 'thin', color: { argb: 'FFE5E7EB' } },
              right: { style: 'thin', color: { argb: 'FFE5E7EB' } }
            };

            // Apply conditional colors to workflow stage columns (columns 12-28)
            if (colNumber >= 12 && colNumber <= 28) {
              const cellValue = cell.value;
              if (cellValue === 'OK') {
                cell.fill = {
                  type: 'pattern',
                  pattern: 'solid',
                  fgColor: { argb: 'FF86EFAC' } // Green background
                };
                cell.font = { bold: true, color: { argb: 'FF166534' } }; // Dark green text
                cell.alignment = { vertical: 'middle', horizontal: 'center' };
              } else if (cellValue === 'IN PROCESS') {
                cell.fill = {
                  type: 'pattern',
                  pattern: 'solid',
                  fgColor: { argb: 'FF93C5FD' } // Blue background
                };
                cell.font = { bold: true, color: { argb: 'FF1E40AF' } }; // Dark blue text
                cell.alignment = { vertical: 'middle', horizontal: 'center' };
              } else {
                // Empty cells in workflow columns
                cell.alignment = { vertical: 'middle', horizontal: 'center' };
              }
            }
          });
        }
      });

      // Generate file name with current date
      const date = new Date().toISOString().split('T')[0];
      const fileName = `Customer_Support_Export_${date}.xlsx`;

      // Write to buffer and download
      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      link.click();
      window.URL.revokeObjectURL(url);
    }).catch((error) => {
      console.error('Error exporting data:', error);
      alert('Failed to export data. Please try again.');
    });
  };

  const getStageColor = (stage: string) => {
    const colors: { [key: string]: string } = {
      'Planning': 'bg-blue-100 text-blue-700 border-blue-200',
      'Material Issue': 'bg-purple-100 text-purple-700 border-purple-200',
      'Semi QC': 'bg-yellow-100 text-yellow-700 border-yellow-200',
      'Phosphating': 'bg-orange-100 text-orange-700 border-orange-200',
      'Phosphating QC': 'bg-orange-100 text-orange-700 border-orange-200',
      'Assembly A': 'bg-indigo-100 text-indigo-700 border-indigo-200',
      'Assembly B': 'bg-indigo-100 text-indigo-700 border-indigo-200',
      'Assembly C': 'bg-indigo-100 text-indigo-700 border-indigo-200',
      'Assembly D': 'bg-indigo-100 text-indigo-700 border-indigo-200',
      'Testing1': 'bg-pink-100 text-pink-700 border-pink-200',
      'Testing2': 'bg-pink-100 text-pink-700 border-pink-200',
      'SVS': 'bg-green-100 text-green-700 border-green-200',
      'Marking1': 'bg-teal-100 text-teal-700 border-teal-200',
      'Marking2': 'bg-teal-100 text-teal-700 border-teal-200',
      'PDI1': 'bg-gray-100 text-gray-700 border-gray-200',
      'PDI2': 'bg-gray-100 text-gray-700 border-gray-200',
      'TPI': 'bg-rose-100 text-rose-700 border-rose-200',
      'Dispatch': 'bg-emerald-100 text-emerald-700 border-emerald-200',
    };
    return colors[stage] || 'bg-gray-100 text-gray-700 border-gray-200';
  };

  

  const getProgressPercentage = (order: OrderData) => {
    return order.totalQty > 0 ? Math.round((order.qtyExe / order.totalQty) * 100) : 0;
  };

  // Get stage status for an order
 const toProgressKey = (label: string) => {
  if (label === 'Phosphating QC') return 'Phosphating';
  return label;
};

  const getStageStatus = (order: OrderData & { currentStage: string }, stage: string) => {
    const sp = order.stageProgress || {};
    const key = toProgressKey(stage);
   const normalizedStage = stage
  .replace(/-/g, " ")
  .replace(/\s+/g, " ")
  .trim();


  const v =
  sp[normalizedStage] ||                
  sp[normalizedStage.toUpperCase()] ||  
  sp[normalizedStage.toLowerCase()] || 
  sp[key];

    if (v != null) {
      const vNorm = String(v).trim().toLowerCase().replace(/\s+/g, '_');
      if (vNorm === 'ok') return 'OK';
      if (vNorm === 'pending') return 'pending';
      if (vNorm === 'in_progress' || vNorm === 'inprogress') return 'IN PROCESS';
    }
    if (!order.workflowHistory) return '';
    // Normalize labels when comparing to workflowHistory entries
    const normalizeForMatch = (s: string) => {
      const base = String(s || '')
        .toLowerCase()
        .replace(/-/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
      // Map variants like "phosphating qc" → "phosphating"
      return base.replace(/\s+qc$/, '');
    };
    const target = normalizeForMatch(stage);
    const stageIndex = order.workflowHistory.findIndex(w => normalizeForMatch(w.stage) === target);
    if (stageIndex === -1) return '';
    if (order.workflowHistory[stageIndex].exitedAt) {
      return 'OK';
    }
    // Compare normalized currentStage as well
    if (normalizeForMatch(order.currentStage) === target) {
      return 'IN PROCESS';
    }
    return '';
  };

  const renderStageCell = (status: string) => {
    if (status === 'OK' || status === 'ok') {
      return (
        <div className="flex items-center justify-center">
          <span className="px-2 py-1 bg-green-100 text-green-700 border border-green-200 rounded text-xs font-medium">
            OK
          </span>
        </div>
      );
    }
    if (status === 'IN PROCESS') {
      return (
        <div className="flex items-center justify-center">
          <span className="px-2 py-1 bg-purple-100 text-purple-700 border-purple-200 rounded text-xs font-medium">
            In Progress
          </span>
        </div>
      );
    }
    if (status === 'pending') {
      return (
        <div className="flex items-center justify-center">
          <span className="px-2 py-1 bg-blue-100 text-blue-700 border-blue-200 rounded text-xs font-medium">
            Pending
          </span>
        </div>
      );
    }
    return <div className="text-center text-gray-300">-</div>;
  };

  return (
    <>
      <DashboardHeader
        role="svs"
        currentPage="SVS"
        onLogout={() => {
          localStorage.removeItem("token");
          window.location.href = "/login";
        }}
        onNavigate={(page) => {
          window.location.href = `/${page.toLowerCase()}`;
        }}
        onUploadSuccess={() => reloadData()}
      />
      <div className="p-6 max-w-[1920px] mx-auto space-y-6 animate-fade-in-up">
      {/* Page Header */}
      <div className="flex flex-wrap items-center justify-between ctm-wrap">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
          <h1 className="text-gray-900 flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-[#174a9f] to-[#1a5cb8] rounded-xl shadow-lg">
              <Package className="h-6 w-6 text-white" />
            </div>
            Customer Support
          </h1>
          <p className="text-gray-600 mt-1">Comprehensive view of all orders across all workflow stages</p>
          </div>
          <Button
          onClick={reloadData}
          disabled={isRefreshing || loading}
          className="bg-white border border-gray-300 text-gray-700 hover:bg-gray-50"
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
        </div>
        
        <Button
        disabled={filteredOrders.length === 0}
          onClick={handleExport}
          className="bg-gradient-to-r from-[#174a9f] to-[#1a5cb8] hover:from-[#123a80] hover:to-[#174a9f] text-white shadow-lg hover:shadow-xl transition-all duration-300"
        >
          <Download className="h-4 w-4 mr-2" />
          Export Data
        </Button>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card className="p-4 bg-white/70 backdrop-blur-sm border-gray-200 hover:shadow-xl transition-all duration-300">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-100 rounded-xl">
              <Package className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-gray-600 text-sm">Total Orders</p>
              <p className="text-2xl text-gray-900">{stats.totalOrders}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4 bg-white/70 backdrop-blur-sm border-gray-200 hover:shadow-xl transition-all duration-300">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-indigo-100 rounded-xl">
              <Package className="h-5 w-5 text-indigo-600" />
            </div>
            <div>
              <p className="text-gray-600 text-sm">Total Quantity</p>
              <p className="text-2xl text-gray-900">{stats.totalQty}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4 bg-white/70 backdrop-blur-sm border-gray-200 hover:shadow-xl transition-all duration-300">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-green-100 rounded-xl">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-gray-600 text-sm">Completed</p>
              <p className="text-2xl text-gray-900">{stats.totalCompleted}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4 bg-white/70 backdrop-blur-sm border-gray-200 hover:shadow-xl transition-all duration-300">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-orange-100 rounded-xl">
              <Clock className="h-5 w-5 text-orange-600" />
            </div>
            <div>
              <p className="text-gray-600 text-sm">Pending</p>
              <p className="text-2xl text-gray-900">{stats.totalPending}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4 bg-white/70 backdrop-blur-sm border-gray-200 hover:shadow-xl transition-all duration-300">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-red-100 rounded-xl">
              <AlertCircle className="h-5 w-5 text-red-600" />
            </div>
            <div>
              <p className="text-gray-600 text-sm">Urgent</p>
              <p className="text-2xl text-gray-900">{stats.alertCount}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Filters */}
      <Card className="p-4 bg-white/70 backdrop-blur-sm border-gray-200">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search by Order ID, SOA NO., Party, Customer PO, Product, or Code No..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 border-gray-300 focus:border-[#174a9f] focus:ring-[#174a9f]"
            />
          </div>
          
          <Select value={selectedStage} onValueChange={setSelectedStage}>
            <SelectTrigger className="w-full md:w-[200px] border-gray-300">
              <SelectValue placeholder="Filter by Stage" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Stages</SelectItem>
              {stages.map((s) => (
                <SelectItem key={s.key} value={s.key}>{s.display}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={selectedAssemblyLine} onValueChange={setSelectedAssemblyLine}>
            <SelectTrigger className="w-full md:w-[200px] border-gray-300">
              <SelectValue placeholder="Filter by Line" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Lines</SelectItem>
              <SelectItem value="A">Line A</SelectItem>
              <SelectItem value="B">Line B</SelectItem>
              <SelectItem value="C">Line C</SelectItem>
              <SelectItem value="D">Line D</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </Card>

      {/* Orders Table */}
      <Card className="bg-white/70 backdrop-blur-sm border-gray-200 overflow-hidden">
        <div className="overflow-x-auto"> 
          <table className="w-full">
            <thead>
              <tr className="bg-gradient-to-r from-[#174a9f]/10 to-indigo-50/50 border-b border-gray-200">
                <th className="px-4 py-3 text-center text-gray-700 sticky left-0 bg-gradient-to-r from-[#174a9f]/10 to-indigo-50/50 z-10 ctm-opacity">Assembly Line</th>
                <th className="px-4 py-3 text-gray-700 truncate text-center">SOA NO.</th>
                <th className="px-4 py-3 text-gray-700 text-center truncate">SR NO.</th>
                <th className="px-4 py-3 text-center text-gray-700 truncate text-center">Assembly Date</th>
                <th className="px-4 py-3 text-gray-700 truncate text-center">Unique Code</th>
                <th className="px-4 py-3 text-gray-700 truncate text-center">Party</th>
                <th className="px-4 py-3 text-gray-700 truncate text-center">Order No.</th>
                <th className="px-4 py-3 text-gray-700 truncate text-center">Code No.</th>
                <th className="px-4 py-3 text-gray-700 truncate text-center">Product</th>
                <th className="px-4 py-3 text-center text-gray-700 truncate text-center">PO Qty</th>
                <th className="px-4 py-3 text-center text-gray-700 bg-sky-50/80 truncate text-center">Expected Delivery Date</th>
                <th className="px-4 py-3 text-center text-gray-700 truncate text-center">Qty</th>
                <th className="px-4 py-3 text-center text-gray-700 truncate text-center">Qty Executed</th>
                <th className="px-4 py-3 text-center text-gray-700">Qty Pending</th>
                <th className="px-4 py-3 text-center text-gray-700 bg-blue-50/80">Planning</th>
                <th className="px-4 py-3 text-center text-gray-700 bg-purple-50/80">Material Issue</th>
                <th className="px-4 py-3 text-center text-gray-700 bg-yellow-50/80">Semi QC</th>
                <th className="px-4 py-3 text-center text-gray-700 bg-orange-50/80">Phosphating QC</th>
                <th className="px-4 py-3 text-center text-gray-700 bg-indigo-50/80">Assembly A</th>
                <th className="px-4 py-3 text-center text-gray-700 bg-indigo-50/80">Assembly B</th>
                <th className="px-4 py-3 text-center text-gray-700 bg-indigo-50/80">Assembly C</th>
                <th className="px-4 py-3 text-center text-gray-700 bg-indigo-50/80">Assembly D</th>
                <th className="px-4 py-3 text-center text-gray-700 bg-pink-50/80">Testing1</th>
                <th className="px-4 py-3 text-center text-gray-700 bg-pink-50/80">Testing2</th>
                <th className="px-4 py-3 text-center text-gray-700 bg-green-50/80">SVS</th>
                <th className="px-4 py-3 text-center text-gray-700 bg-teal-50/80">Marking1</th>
                <th className="px-4 py-3 text-center text-gray-700 bg-teal-50/80">Marking2</th>
                <th className="px-4 py-3 text-center text-gray-700 bg-gray-50/80">PDI1</th>
                <th className="px-4 py-3 text-center text-gray-700 bg-gray-50/80">PDI2</th>
                <th className="px-4 py-3 text-center text-gray-700 bg-rose-50/80">TPI</th>
                <th className="px-4 py-3 text-center text-gray-700 bg-emerald-50/80">Dispatch</th>
                <th className="px-4 py-3 text-center text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={30} className="px-4 py-12 text-center text-gray-500">
                    Loading...
                  </td>
                </tr>
              ) : filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={30} className="px-4 py-12 text-center text-gray-500">
                    <div className="flex flex-col items-center gap-3">
                      <XCircle className="h-12 w-12 text-gray-400" />
                      <p>No orders found matching your criteria</p>
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedOrders.map((order) => (
                  <tr
                    key={`${order.id}-${order.uniqueCode}-${Math.random()}`}

                    className="border-b border-gray-100 hover:bg-blue-50/50 transition-colors duration-150"
                  >
                    <td className="px-4 py-3 sticky left-0 bg-white hover:bg-blue-50/50 z-10">
                      <div className="flex items-center gap-2">
                        {order.alertStatus && (
                          <AlertCircle className="h-4 w-4 text-red-500 animate-pulse-soft" />
                        )}
                        <Badge className="bg-gray-100 text-gray-700 border-gray-200">
                          {order.assemblyLine}
                        </Badge>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center text-gray-700">{order.gmsoaNo}</td>
                    <td className="px-4 py-3 text-center text-gray-700">{order.soaSrNo}</td>
                    <td className="px-4 py-3 text-center text-gray-700 truncate">{order.assemblyDate}</td>
                    <td className="px-4 py-3 text-center text-gray-700 truncate">{order.uniqueCode}</td>
                    <td className="px-4 py-3 text-center text-gray-700 max-w-[200px] truncate">{order.party}</td>
                    <td className="px-4 py-3 text-center text-gray-700">{order.customerPoNo}</td>
                    <td className="px-4 py-3 text-center text-gray-700">{order.codeNo}</td>
                    <td className="px-4 py-3 text-center text-gray-700 max-w-[300px] truncate" title={order.product}>
                      {order.product}
                    </td>
                    <td className="px-4 py-3 text-center">
                        {order.poQty}
                    </td>
                    {/* <td className="px-4 py-3 bg-sky-50/30 text-center">
                      <Input
                        type="date"
                        value={editingDeliveryDate[order.uniqueCode] ?? order.expectedDeliveryDate ?? ''}
                        onChange={(e) => {
                          const val = e.target.value;
                          setEditingDeliveryDate(prev => ({
                            ...prev,
                            [order.uniqueCode]: val
                          }));
                          saveDeliveryDate(order, val);
                        }}
                        min={new Date().toISOString().split('T')[0]}
                        className="w-40 mx-auto text-sm border-gray-300 focus:border-[#174a9f] focus:ring-[#174a9f]"
                      />
                    </td> */}
                   <td className="px-4 py-3 bg-sky-50/30 text-center">

  {/* Browser date picker */}
  <Input
    type="date"
    value={
      editingDeliveryDate[order.uniqueCode]
        ? editingDeliveryDate[order.uniqueCode]
        : order.expectedDeliveryDate || ""
    }
    onChange={(e) => {
      const apiDate = e.target.value; // YYYY-MM-DD

      saveDeliveryDate(order, apiDate);

      setEditingDeliveryDate(prev => ({
        ...prev,
        [order.uniqueCode]: apiDate
      }));
    }}
    className="w-40 mx-auto text-sm border-gray-300"
  />

  {/* Pretty display */}
  {(editingDeliveryDate[order.uniqueCode] || order.expectedDeliveryDate) && (
    <div className="text-xs text-gray-600 mt-1 hidden">
      {(() => {
        const raw = editingDeliveryDate[order.uniqueCode] || order.expectedDeliveryDate;
        if (!raw) return "";
        const [y, m, d] = raw.split("-");
        return `${d}-${m}-${y}`;
      })()}
    </div>
  )}

</td>




                    <td className="px-4 py-3 text-center">
                      <Badge className="bg-blue-100 text-blue-700 border-blue-200">
                        {order.totalQty}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <Badge className={order.qtyPending === 0 ? "bg-blue-100 text-blue-700 border-blue-200" : "bg-green-100 text-green-700 border-green-200"}>
                        {order.qtyExe}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <Badge className={order.qtyPending === 0 ? "bg-blue-100 text-blue-700 border-blue-200" : "bg-orange-100 text-orange-700 border-orange-200"}>
                        {order.qtyPending}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 bg-blue-50/30 truncate">
                      {renderStageCell(getStageStatus(order, getStepLabel('planning')))}
                    </td>
                    <td className="px-4 py-3 bg-purple-50/30 truncate">
                      {renderStageCell(getStageStatus(order, getStepLabel('material-issue')))}
                    </td>
                    <td className="px-4 py-3 bg-yellow-50/30 truncate">
                      {renderStageCell(getStageStatus(order, getStepLabel('semi-qc')))}
                    </td>
                    <td className="px-4 py-3 bg-orange-50/30 truncate">
                      {renderStageCell(getStageStatus(order, getStepLabel('phosphating')))}
                    </td>
                    <td className="px-4 py-3 bg-indigo-50/30 truncate">
                      {renderStageCell(getStageStatus(order, getStepLabel('assembly-a')))}
                    </td>
                    <td className="px-4 py-3 bg-indigo-50/30 truncate">
                      {renderStageCell(getStageStatus(order, getStepLabel('assembly-b')))}
                    </td>
                    <td className="px-4 py-3 bg-indigo-50/30 truncate">
                      {renderStageCell(getStageStatus(order, getStepLabel('assembly-c')))}
                    </td>
                    <td className="px-4 py-3 bg-indigo-50/30 truncate">
                      {renderStageCell(getStageStatus(order, getStepLabel('assembly-d')))}
                    </td>
                    <td className="px-4 py-3 bg-pink-50/30 truncate">
                      {renderStageCell(getStageStatus(order, getStepLabel('testing1')))}
                    </td>
                    <td className="px-4 py-3 bg-pink-50/30 truncate">
                      {renderStageCell(getStageStatus(order, getStepLabel('testing2')))}
                    </td>
                    <td className="px-4 py-3 bg-green-50/30 truncate">
                      {renderStageCell(getStageStatus(order, getStepLabel('svs')))}
                    </td>
                    <td className="px-4 py-3 bg-teal-50/30 truncate">
                      {renderStageCell(getStageStatus(order, getStepLabel('marking1')))}
                    </td>
                    <td className="px-4 py-3 bg-teal-50/30 truncate">
                      {renderStageCell(getStageStatus(order, getStepLabel('marking2')))}
                    </td>
                    <td className="px-4 py-3 bg-gray-50/30 truncate">
                      {renderStageCell(getStageStatus(order, getStepLabel('pdi1')))}
                    </td>
                    <td className="px-4 py-3 bg-gray-50/30 truncate">
                      {renderStageCell(getStageStatus(order, getStepLabel('pdi2')))}
                    </td>
                    <td className="px-4 py-3 bg-rose-50/30 truncate">
                      {renderStageCell(getStageStatus(order, getStepLabel('tpi')))}
                    </td>
                    <td className="px-4 py-3 bg-emerald-50/30 truncate">
                      {renderStageCell(getStageStatus(order, getStepLabel('dispatch')))}
                    </td>
                    <td className="px-4 py-3 text-center truncate">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleViewDetails(order)}
                        className="hover:bg-[#174a9f]/10 hover:text-[#174a9f]"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                     <Button
  size="sm"
  variant="ghost"
  onClick={() => fetchOrderHistory(order)}
  className="hover:bg-[#174a9f]/10 hover:text-[#174a9f]"
>
  <History className="h-4 w-4" />
</Button>

                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
          
        </div>
      </Card>
      <TablePagination
            page={page}
            perPage={perPage}
            total={filteredOrders.length}
            lastPage={Math.max(1, Math.ceil(filteredOrders.length / Math.max(perPage, 1)))}
            onChangePage={setPage}
            onChangePerPage={setPerPage}
            disabled={loading}
          />

      {/* Results Summary */}
      <div className="text-center text-gray-600 text-sm">
        Showing {filteredOrders.length} of {allOrders.length} orders
      </div>

      {/* Order Details Dialog */}
      <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
        <DialogContent className="!max-w-6xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle className="text-2xl flex items-center gap-2">
              <Package className="h-6 w-6 text-[#174a9f]" />
              Order Details - {selectedOrder?.uniqueCode}
            </DialogTitle>
            <DialogDescription className="text-sm text-gray-500">
              Comprehensive details of the selected order
            </DialogDescription>
          </DialogHeader>
          
          {selectedOrder && (
            <ScrollArea className="max-h-[70vh] pr-4">
              <div className="space-y-6">
                {/* Basic Information */}
                <div>
                  <h3 className="text-gray-900 mb-3 pb-2 border-b border-gray-200">Basic Information</h3>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <p className="text-sm text-gray-600">Order ID</p>
                      <p className="text-gray-900">{selectedOrder.uniqueCode}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Current Stage</p>
                      <Badge className={`${getStageColor(selectedOrder.currentStage)} border`}>
                        {selectedOrder.currentStage}
                      </Badge>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Assembly Line</p>
                      <p className="text-gray-900">{selectedOrder.assemblyLine}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">GMSOA NO.</p>
                      <p className="text-gray-900">{selectedOrder.gmsoaNo}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">SOA SR NO.</p>
                      <p className="text-gray-900">{selectedOrder.soaSrNo}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Assembly Date</p>
                      <p className="text-gray-900">{selectedOrder.assemblyDate}</p>
                    </div>
                  </div>
                </div>

                {/* Customer Information */}
                <div>
                  <h3 className="font-semibold text-gray-900 mb-3 pb-2 border-b border-gray-200">Customer Information</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2">
                      <p className="text-sm text-gray-600">Party</p>
                      <p className="text-gray-900">{selectedOrder.party}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Customer PO NO.</p>
                      <p className="text-gray-900">{selectedOrder.customerPoNo}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Code NO.</p>
                      <p className="text-gray-900">{selectedOrder.codeNo}</p>
                    </div>
                  </div>
                </div>

                {/* Product Information */}
                <div>
                  <h3 className="text-gray-900 mb-3 pb-2 border-b border-gray-200">Product Information</h3>
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm text-gray-600">Product</p>
                      <p className="text-gray-900">{selectedOrder.product}</p>
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <p className="text-sm text-gray-600">Total Quantity</p>
                        <Badge className="bg-blue-100 text-blue-700 border-blue-200">
                          {selectedOrder.totalQty}
                        </Badge>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Qty Executed</p>
                        <Badge className="bg-green-100 text-green-700 border-green-200">
                          {selectedOrder.qtyExe}
                        </Badge>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Qty Pending</p>
                        <Badge className="bg-orange-100 text-orange-700 border-orange-200">
                          {selectedOrder.qtyPending}
                        </Badge>
                      </div>
                       {/* <div>
                          <Label className="text-gray-500 text-sm">
                            Special notes
                          </Label>
                          <p className="text-gray-900 mt-1">
                            {selectedOrder.special_notes || "-"}
                          </p>
                        </div> */}
                    </div>
                    {(editingDeliveryDate[selectedOrder.uniqueCode] || selectedOrder.expectedDeliveryDate) && (
                      <div>
                        <p className="text-sm text-gray-600">Expected Delivery Date</p>
                        <div className="flex items-center gap-2">
                          <Badge className="bg-sky-100 text-sky-700 border-sky-200">
                            {new Date(editingDeliveryDate[selectedOrder.uniqueCode] || selectedOrder.expectedDeliveryDate || '').toLocaleDateString('en-US', { 
                              year: 'numeric', 
                              month: 'long', 
                              day: 'numeric' 
                            })}
                          </Badge>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Manufacturing Details */}
                <div>
                  <h3 className="text-gray-900 mb-3 pb-2 border-b border-gray-200">Manufacturing Details</h3>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <p className="text-sm text-gray-600">Finished Valve</p>
                      <p className="text-gray-900">{selectedOrder.finishedValve || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">GM Logo</p>
                      <p className="text-gray-900">{selectedOrder.gmLogo}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Name Plate</p>
                      <p className="text-gray-900">{selectedOrder.namePlate}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Inspection</p>
                      <p className="text-gray-900">{selectedOrder.inspection}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Painting</p>
                      <p className="text-gray-900">{selectedOrder.painting}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Alert Status</p>
                      <Badge className={selectedOrder.alertStatus ? 'bg-red-100 text-red-700 border-red-200' : 'bg-green-100 text-green-700 border-green-200'}>
                        {selectedOrder.alertStatus ? 'Urgent' : 'Normal'}
                      </Badge>
                    </div>
                  </div>
                </div>

                {/* Product Specifications */}
                {(selectedOrder.productSpcl1 || selectedOrder.productSpcl2 || selectedOrder.productSpcl3) && (
                  <div>
                    <h3 className="text-gray-900 mb-3 pb-2 border-b border-gray-200">Product Specifications</h3>
                    <div className="space-y-2">
                      {selectedOrder.productSpcl1 && (
                        <div>
                          <p className="text-sm text-gray-600">Specification 1</p>
                          <p className="text-gray-900">{selectedOrder.productSpcl1}</p>
                        </div>
                      )}
                      {selectedOrder.productSpcl2 && (
                        <div>
                          <p className="text-sm text-gray-600">Specification 2</p>
                          <p className="text-gray-900">{selectedOrder.productSpcl2}</p>
                        </div>
                      )}
                      {selectedOrder.productSpcl3 && (
                        <div>
                          <p className="text-sm text-gray-600">Specification 3</p>
                          <p className="text-gray-900">{selectedOrder.productSpcl3}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Workflow History */}
                {selectedOrder.workflowHistory && selectedOrder.workflowHistory.length > 0 && (
                  <div>
                    <h3 className="text-gray-900 mb-3 pb-2 border-b border-gray-200">Workflow History</h3>
                    <div className="space-y-3">
                      {selectedOrder.workflowHistory.map((workflow, index) => (
                        <div key={index} className="flex items-start gap-4 p-3 bg-gray-50 rounded-lg relative">
                          {(() => {
                            // Calculate duration
                            const enteredDate = new Date(workflow.enteredAt);
                            const exitedDate = workflow.exitedAt ? new Date(workflow.exitedAt) : new Date();
                            const durationMs = exitedDate.getTime() - enteredDate.getTime();
                            const durationHours = Math.floor(durationMs / (1000 * 60 * 60));
                            const durationDays = Math.floor(durationHours / 24);
                            const remainingHours = durationHours % 24;
                            
                            let durationText = '';
                            if (durationDays > 0) {
                              durationText = `${durationDays}d ${remainingHours}h`;
                            } else if (durationHours > 0) {
                              const minutes = Math.floor((durationMs % (1000 * 60 * 60)) / (1000 * 60));
                              durationText = `${durationHours}h ${minutes}m`;
                            } else {
                              const minutes = Math.floor(durationMs / (1000 * 60));
                              durationText = `${minutes}m`;
                            }
                            
                            return (
                              <Badge className="absolute top-2 right-2 bg-indigo-100 text-indigo-700 border-indigo-200">
                                <Clock className="h-3 w-3 mr-1" />
                                {durationText}
                              </Badge>
                            );
                          })()}
                          <div className="flex-shrink-0 w-8 h-8 bg-[#174a9f] text-white rounded-full flex items-center justify-center text-sm">
                            {index + 1}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <Badge className={`${getStageColor(workflow.stage)} border`}>
                                {workflow.stage}
                              </Badge>
                              <Badge className="bg-blue-100 text-blue-700 border-blue-200">
                                Qty: {workflow.qtyProcessed}
                              </Badge>
                            </div>
                            <p className="text-sm text-gray-600">
                              Entered: {workflow.enteredAt}
                            </p>
                            {workflow.exitedAt && (
                              <p className="text-sm text-gray-600">
                                Exited: {workflow.exitedAt}
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Remarks */}
                {selectedOrder.remarks && (
                  <div>
                    <h3 className="text-gray-900 mb-3 pb-2 border-b border-gray-200">Remarks</h3>
                    <p className="text-gray-900 bg-yellow-50 p-3 rounded-lg border border-yellow-200">
                      {selectedOrder.remarks}
                    </p>
                  </div>
                )}
              </div>
            </ScrollArea>
          )}
        </DialogContent>
      </Dialog>

{/* HISTORY DIALOG – TABLE VERSION */}
<Dialog open={showHistoryDialog} onOpenChange={setShowHistoryDialog}>
  <DialogContent className="max-w-[800px] w-full modal-main overflow-y-auto rounded-xl shadow-lg">
    
    <DialogHeader>
      <DialogTitle className="text-xl flex items-center gap-2">
        <History className="h-5 w-5 text-[#174a9f]" />
        Order History
      </DialogTitle>
      <DialogDescription className="text-gray-600">
        Stage-by-stage workflow with timestamps and quantities.
      </DialogDescription>
    </DialogHeader>

    {/* Table Container */}
    <div className="border rounded-lg bg-white">

     

      <div className="max-h-[60vh] overflow-y-auto">
        <table className="w-full border-collapse">
           {/* TABLE HEAD */}
          <thead className="bg-gray-100 text-gray-700 text-sm border-b">
            <tr>
               <th className="px-4 py-3 text-left w-[25%]">Split Code</th>
              <th className="px-4 py-3 text-left w-[40%]">Stage / Time</th>
              <th className="px-4 py-3 text-center w-[20%]">Qty</th>
              <th className="px-4 py-3 text-center w-[20%]">Assigned</th>
              <th className="px-4 py-3 text-center w-[20%]">Duration</th>
            </tr>
          </thead>
         <tbody className="text-sm">
  {Object.keys(groupedHistory).length === 0 ? (
    <tr>
      <td colSpan={5} className="text-center text-gray-500 py-4">
        No history found
      </td>
    </tr>
  ) : (
    Object.entries(groupedHistory).flatMap(
      ([splitCode, rows]: any) =>
        rows.map((h: any, i: number) => (
          <tr
            key={`${splitCode}-${i}`}
            className="border-b hover:bg-blue-50/40 transition"
          >
            {/* ✅ SPLIT CODE – EVERY ROW */}
            <td className="px-4 py-4 font-semibold text-blue-700">
              {splitCode}
            </td>

            {/* Stage + Time */}
            <td className="px-4 py-4 align-top">
              <span
                className={`px-2 py-1 rounded text-xs font-medium border ${getStageColor(
                  h.currentStage
                )}`}
              >
                {h.currentStage}
              </span>

              <div className="text-xs text-gray-700 mt-1">
                <div>{h.entered}</div>
                {h.exited && <div>{h.exited}</div>}
              </div>
            </td>

            {/* Qty */}
            <td className="px-4 py-4 text-center">
              <span className="px-2 py-1 bg-blue-100 text-blue-700 border border-blue-200 rounded text-xs font-medium">
                {h.qty}
              </span>
            </td>

            {/* Assigned Qty */}
            <td className="px-4 py-4 text-center">
              {h.assigned_qty === "-" || h.assigned_qty === "0" || h.assigned_qty === 0 ? (
                <span className="text-gray-400 font-medium">-</span>
              ) : (
                <span className="px-2 py-1 bg-green-100 text-green-700 border border-green-200 rounded text-xs font-medium">
                  {h.assigned_qty}
                </span>
              )}
            </td>

            {/* Duration */}
            <td className="px-4 py-4 text-center">
              <span className="px-2 py-1 bg-indigo-100 text-indigo-700 border border-indigo-200 rounded text-xs font-medium">
                {h.duration || "-"}
              </span>
            </td>
          </tr>
        ))
    )
  )}
</tbody>




          
        </table>
      </div>

    </div>
  </DialogContent>
</Dialog>

      </div>
    </>
  );
}

export default CustomerSupport;
