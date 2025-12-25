// src/pages/PlanningPage.tsx
import React, { useState, useRef, useEffect, useMemo } from "react";
import axios from "axios";
import {
  Plus,
  Calendar as CalendarIcon,
  Printer,
  ArrowRight,
  Search,
  Siren,
  Eye,
  MessageSquarePlus,
    Download
} from "lucide-react";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "../components/ui/dialog";
import { Textarea } from "../components/ui/textarea";
import { Label } from "../components/ui/label";
import { Input } from "../components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import { Checkbox } from "../components/ui/checkbox";
import { useOrderContext } from "../components/order-context";
import { OrderFilters } from "../components/order-filters";
import { API_URL } from "../config/api.ts";

import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

import {
  getNextSteps,
  getStepLabel,
  isFinalStep,
} from "../config/workflowSteps";
import { DashboardHeader } from "../components/dashboard-header.tsx";
import TablePagination from "../components/table-pagination";

// const API_URL = 'http://192.168.1.17:2010/api';

interface AssemblyOrderData {
  id: string;
  assemblyLine: string;
  specialNotes: string; 
  gmsoaNo: string;
  soaSrNo: string;
  assemblyDate: string;
  uniqueCode: string;
    split_id: string;
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
  originalIndex: number;
}

export function MaterialIssuePage() {
  // context for remarks & alert status (from your existing order-context)
  const {
    updateRemark,
    toggleAlertStatus: toggleAlertStatusContext,
    getRemark,
    getAlertStatus,
  } = useOrderContext();

  // API data + UI state
  const [orders, setOrders] = useState<AssemblyOrderData[]>([]);
  const [fullOrders, setFullOrders] = useState<AssemblyOrderData[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState<number>(1);
  const [perPage, setPerPage] = useState<number>(20);
  const [total, setTotal] = useState<number>(0);
  const [lastPage, setLastPage] = useState<number>(1);

  const [soaSort, setSoaSort] = useState<"asc" | "desc" | null>(null);


  // search / selection / filters / dialogs etc.
  const [localSearchTerm, setLocalSearchTerm] = useState("");
  const [showUrgentOnly, setShowUrgentOnly] = useState(false);
  const [showRemarksOnly, setShowRemarksOnly] = useState(false);
  const [assemblyLineFilter, setAssemblyLineFilter] = useState("all");
  const [gmsoaFilter, setGmsoaFilter] = useState("all");
  const [partyFilter, setPartyFilter] = useState("all");
  const [dateFilterMode, setDateFilterMode] = useState<
    "year" | "month" | "range"
  >("range");
  const [dateFrom, setDateFrom] = useState<Date | undefined>(undefined);
  const [dateTo, setDateTo] = useState<Date | undefined>(undefined);

  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());
  const [quickAssignOpen, setQuickAssignOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<AssemblyOrderData | null>(
    null
  );
  const [quickAssignStep, setQuickAssignStep] = useState("");
  const [quickAssignQty, setQuickAssignQty] = useState("");
  const [splitOrder, setSplitOrder] = useState(false);
  const [splitAssignStep, setSplitAssignStep] = useState("");
  const [splitAssignQty, setSplitAssignQty] = useState("");
  const [quickAssignErrors, setQuickAssignErrors] = useState<{
    [k: string]: string;
  }>({});

  const [binCardDialogOpen, setBinCardDialogOpen] = useState(false);
  const [viewDetailsDialogOpen, setViewDetailsDialogOpen] = useState(false);
  const [viewedOrder, setViewedOrder] = useState<AssemblyOrderData | null>(
    null
  );

  const [remarksDialogOpen, setRemarksDialogOpen] = useState(false);
  const [remarksOrder, setRemarksOrder] = useState<AssemblyOrderData | null>(
    null
  );
  const [remarksText, setRemarksText] = useState("");

  // Upload file
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // refs
  const tableScrollRef = useRef<HTMLDivElement | null>(null);

  // token
  const token = localStorage.getItem("token");

  // Fetch orders from API (POST)
  const fetchOrders = async () => {
    try {
      setLoading(true);
      setError(null);
      // Determine payload for admin
      const currentStage = "material-issue";
      const stageLabel = getStepLabel(currentStage);
      const getCurrentUserRole = () => {
        try {
          const s = localStorage.getItem("user");
          if (!s) return "";
          const u = JSON.parse(s);
          const raw = typeof u.role === "object" ? u.role?.name : u.role;
          return String(raw || "").toLowerCase();
        } catch {
          return "";
        }
      };
      const isAdmin = getCurrentUserRole().includes("admin");
      const payload = { menu_name: stageLabel, page, per_page: perPage };

      const res = await axios.post(
        `${API_URL}/order-list`,
        payload,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      // Accept both string "true" or boolean-like "RCS" responses — adapt per your backend
      const ok =
        res?.data?.Resp_code === "true" ||
        res?.data?.Resp_code === true || // ✅ handle boolean true
        res?.data?.Resp_code === "RCS";

      if (ok && Array.isArray(res.data.data)) {
        const apiOrders: AssemblyOrderData[] = res.data.data.map(
          (item: any, index: number) => ({
            id: String(item.id),
            assemblyLine: item.assembly_no || "",
            gmsoaNo: item.soa_no || "",
            soaSrNo: item.soa_sr_no || "",
            assemblyDate: item.assembly_date || "",
            uniqueCode: item.unique_code || item.order_no || "",
            split_id: item.split_id || "",
            splittedCode: item.splitted_code || "",
            party: item.party_name || item.party || "",
            customerPoNo: item.customer_po_no || "",
            codeNo: item.code_no || "",
            product: item.product || "",
            qty: Number(item.qty || 0),
totalQty: Number(item.totalQty || item.total_qty || item.qty || 0), // displayed qty

            qtyExe: Number(item.qty_executed || 0),
            qtyPending: Number(item.qty_pending || 0),
            finishedValve: item.finished_valve || "",
            gmLogo: item.gm_logo || "",
            namePlate: item.name_plate || "",
            specialNotes: item.special_notes || item.special_note || "",
            productSpcl1: item.product_spc1 || "",
            productSpcl2: item.product_spc2 || "",
            productSpcl3: item.product_spc3 || "",
            inspection: item.inspection || "",
            painting: item.painting || "",
            remarks: item.remarks || "",
            

            // ✅ Preserve urgent flag properly (backend sends 0 or 1)
            alertStatus:
              item.is_urgent === true ||
              item.is_urgent === "true" ||
              item.alert_status === true ||
              item.alert_status === "true" ||
              item.urgent === 1 ||
              item.urgent === "1",

               originalIndex: index,
          })
          
        );

        console.log("✅ Orders fetched:", apiOrders.length, "records");
        setOrders(sortOrders(apiOrders));
        setFullOrders(null);
        const p = res?.data?.pagination;
        if (p) {
          setTotal(Number(p.total || apiOrders.length));
          setLastPage(Number(p.last_page || 1));
        } else {
          setTotal(apiOrders.length);
          setLastPage(1);
        }
        setError(null);
        setMessage(null);
      } else {
        console.warn("⚠️ No valid order data received", res.data);
        setOrders([]);
        setError(res?.data?.Resp_desc || "Failed to fetch orders");
      }
    } catch (err: any) {
      console.error("Error fetching orders:", err);
      setError("Error fetching order list. Please check your token or server.");
    } finally {
      setLoading(false);
    }
  };

  const nextStepValue = getStepLabel(quickAssignStep);



  const useGlobalSearch = useMemo(() => {
    const hasSearch = localSearchTerm.trim().length > 0;
    const hasFilters = assemblyLineFilter !== "all" || gmsoaFilter !== "all" || partyFilter !== "all";
    const hasDate = Boolean(dateFrom) || Boolean(dateTo);
    return hasSearch || hasFilters || hasDate || showUrgentOnly || showRemarksOnly;
  }, [localSearchTerm, assemblyLineFilter, gmsoaFilter, partyFilter, dateFrom, dateTo, showUrgentOnly ,showRemarksOnly]);

    const source = useGlobalSearch && fullOrders ? fullOrders : orders;
    useEffect(() => {
      if (useGlobalSearch) {
        if (!fullOrders) fetchAllPages();
      } else {
        setFullOrders(null);
      }
    }, [useGlobalSearch, perPage]);

    useEffect(() => {
      if (!useGlobalSearch) {
        fetchOrders();
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [page, perPage, useGlobalSearch]);

  const fetchAllPages = async () => {
    try {
      setLoading(true);
      const currentStage = "material-issue";
      const stageLabel = getStepLabel(currentStage);
      const first = await axios.post(
        `${API_URL}/order-list`,
        { menu_name: stageLabel, page: 1, per_page: perPage },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const ok =
        first?.data?.Resp_code === "true" ||
        first?.data?.Resp_code === true ||
        first?.data?.Resp_code === "RCS";
      if (!ok) {
        setFullOrders(null);
        return;
      }
      const p = first?.data?.pagination;
      const last = Number(p?.last_page || 1);
      const requests: Promise<any>[] = [];
      for (let pg = 1; pg <= last; pg++) {
        requests.push(
          axios.post(
            `${API_URL}/order-list`,
            { menu_name: stageLabel, page: pg, per_page: perPage },
            { headers: { Authorization: `Bearer ${token}` } }
          )
        );
      }
      const responses = await Promise.all(requests);
      let all: AssemblyOrderData[] = [];
      for (const r of responses) {
        if (Array.isArray(r?.data?.data)) {
          const chunk: AssemblyOrderData[] = r.data.data.map((item: any, index: number) => ({
            id: String(item.id),
            assemblyLine: item.assembly_no || "",
            gmsoaNo: item.soa_no || "",
            soaSrNo: item.soa_sr_no || "",
            assemblyDate: item.assembly_date || "",
            uniqueCode: item.unique_code || item.order_no || "",
            split_id: item.split_id || item.splitted_code || "",
            splittedCode: item.splitted_code || "",
            party: item.party_name || item.party || "",
            customerPoNo: item.customer_po_no || "",
            codeNo: item.code_no || "",
            product: item.product || "",
            qty: Number(item.qty || 0),
            totalQty: Number(item.totalQty || item.total_qty || item.qty || 0),
            qtyExe: Number(item.qty_executed || 0),
            qtyPending: Number(item.qty_pending || 0),
            finishedValve: item.finished_valve || "",
            gmLogo: item.gm_logo || "",
            namePlate: item.name_plate || "",
            specialNotes: item.special_notes || item.special_note || "",
            productSpcl1: item.product_spc1 || "",
            productSpcl2: item.product_spc2 || "",
            productSpcl3: item.product_spc3 || "",
            inspection: item.inspection || "",
            painting: item.painting || "",
            remarks: item.remarks || "",
            alertStatus:
              item.is_urgent === true ||
              item.is_urgent === "true" ||
              item.alert_status === true ||
              item.alert_status === "true" ||
              item.urgent === 1 ||
              item.urgent === "1",
            originalIndex: index,
          }));
          all = all.concat(chunk);
        }
      }
      // Do not deduplicate Material Issue; show all API rows reliably
      setFullOrders(sortOrders(all));
    } catch (e) {
      setFullOrders(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (useGlobalSearch) {
      if (!fullOrders) fetchAllPages();
    } else {
      setFullOrders(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [useGlobalSearch, perPage]);

  // filter option lists
  const assemblyLines = useMemo(
    () =>
      Array.from(new Set(orders.map((o) => o.assemblyLine)))
        .filter(Boolean)
        .sort(),
    [orders]
  );
  const gmsoaNos = useMemo(
    () =>
      Array.from(new Set(orders.map((o) => o.gmsoaNo)))
        .filter(Boolean)
        .sort(),
    [orders]
  );
  const parties = useMemo(
    () =>
      Array.from(new Set(orders.map((o) => o.party)))
        .filter(Boolean)
        .sort(),
    [orders]
  );

  const parseSoaSrNo = (val: string) => {
  const n = parseInt(val, 10);
  return isNaN(n) ? 0 : n;
};


  // Filter logic (search, assembly/pso filters, date, urgent)
  const filteredOrders = useMemo(() => {
    const source = useGlobalSearch && fullOrders ? fullOrders : orders;
    let filtered = source.slice();

    if (showUrgentOnly) {
      // Check both: local context flag (getAlertStatus) and server-provided order.alertStatus
      filtered = filtered.filter(
        (o) => getAlertStatus(String(o.id)) || o.alertStatus
      );
    }
     if (showRemarksOnly) {
      filtered = filtered.filter(
        (o) => typeof o.remarks === "string" && o.remarks.trim().length > 0
      );
    }

    if (assemblyLineFilter !== "all")
      filtered = filtered.filter((o) => o.assemblyLine === assemblyLineFilter);
    if (gmsoaFilter !== "all")
      filtered = filtered.filter((o) => o.gmsoaNo === gmsoaFilter);
    if (partyFilter !== "all")
      filtered = filtered.filter((o) => o.party === partyFilter);

    if (dateFrom || dateTo) {
      filtered = filtered.filter((order) => {
        // skip HOLD or invalid dates
        if (!order.assemblyDate || order.assemblyDate === "HOLD") return false;

        // Accept formats:
        // dd/mm/yyyy  -> parts length 3
        // mm/yyyy     -> parts length 2  (treated as first day of month)
        // yyyy        -> parts length 1  (treated as Jan 1 of year)
        const partsRaw = order.assemblyDate.split(/[\/-]/).map((p) => p.trim());
        const partsNum = partsRaw.map((p) => Number(p));
        if (partsNum.some((n) => isNaN(n))) return false;

        let orderDate: Date | null = null;

        if (partsNum.length >= 3) {
          // dd/mm/yyyy
          const [d, m, y] = partsNum;
          orderDate = new Date(y, m - 1, d);
        } else if (partsNum.length === 2) {
          // mm/yyyy -> treat as first day of that month
          const [m, y] = partsNum;
          orderDate = new Date(y, m - 1, 1);
        } else if (partsNum.length === 1) {
          // yyyy -> Jan 1 of that year
          const [y] = partsNum;
          orderDate = new Date(y, 0, 1);
        } else {
          return false;
        }

        if (!orderDate || isNaN(orderDate.getTime())) return false;

        if (dateFilterMode === "year" && dateFrom) {
          return orderDate.getFullYear() === dateFrom.getFullYear();
        }
        if (dateFilterMode === "month" && dateFrom) {
          return (
            orderDate.getFullYear() === dateFrom.getFullYear() &&
            orderDate.getMonth() === dateFrom.getMonth()
          );
        }
        if (dateFilterMode === "range") {
          if (dateFrom && dateTo)
            return orderDate >= dateFrom && orderDate <= dateTo;
          if (dateFrom) return orderDate >= dateFrom;
          if (dateTo) return orderDate <= dateTo;
        }
        return true;
      });
    }

    if (localSearchTerm.trim()) {
      const term = localSearchTerm.toLowerCase();
      filtered = filtered.filter(
        (o) =>
          String(o.uniqueCode).toLowerCase().includes(term) ||
          String(o.party).toLowerCase().includes(term) ||
          String(o.gmsoaNo).toLowerCase().includes(term) ||
          String(o.customerPoNo).toLowerCase().includes(term) ||
          String(o.codeNo).toLowerCase().includes(term) ||
          String(o.product).toLowerCase().includes(term)
      );
    }

    if (soaSort) {
  filtered = [...filtered].sort((a, b) => {
    const aNo = parseInt(a.soaSrNo || "0", 10);
    const bNo = parseInt(b.soaSrNo || "0", 10);
    return soaSort === "asc" ? aNo - bNo : bNo - aNo;
  });
}

    return filtered;
  }, [
    orders,
    fullOrders,
    localSearchTerm,
    showUrgentOnly,
        showRemarksOnly,
    assemblyLineFilter,
    gmsoaFilter,
    partyFilter,
    dateFilterMode,
    dateFrom,
    dateTo,
    getAlertStatus,
      soaSort, 
  ]);

   const truncateWords = (text = "", wordLimit = 4) => {
  const words = text.trim().split(/\s+/);
  if (words.length <= wordLimit) return text;
  return words.slice(0, wordLimit).join(" ") + "...";
};

  const paginatedOrders = useMemo(() => {
    const start = (page - 1) * perPage;
    return filteredOrders.slice(start, start + perPage);
  }, [filteredOrders, page, perPage]);

  useEffect(() => {
    setPage(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [localSearchTerm, assemblyLineFilter, gmsoaFilter, partyFilter, dateFrom, dateTo, showUrgentOnly ,  showRemarksOnly,]);

  // selection helpers
  const rowKey = (o: AssemblyOrderData) => {
    if (o.splittedCode) return String(o.splittedCode);
    if (o.split_id) return String(o.split_id);
    const hasComposite = (o.uniqueCode || o.soaSrNo || o.gmsoaNo || o.codeNo || o.assemblyLine);
    if (hasComposite) {
      return [o.uniqueCode, o.soaSrNo, o.gmsoaNo, o.codeNo, o.assemblyLine]
        .map((v) => v ?? "")
        .join("|");
    }
    return `${o.id}-${o.originalIndex ?? ""}`;
  };

   const selectedTotals = useMemo(() => {
    const selectedData = filteredOrders.filter((o) =>
      selectedRows.has(rowKey(o))
    );

    return {
      count: selectedData.length,
      qty: selectedData.reduce((s, o) => s + (o.totalQty || o.qty || 0), 0),
      qtyExe: selectedData.reduce((s, o) => s + (o.qtyExe || 0), 0),
      qtyPending: selectedData.reduce((s, o) => s + (o.qtyPending || 0), 0),
    };
  }, [selectedRows, filteredOrders]);

  const toggleRowSelection = (orderId: string) => {
    setSelectedRows((prev) => {
      const copy = new Set(prev);
      if (copy.has(orderId)) copy.delete(orderId);
      else copy.add(orderId);
      return copy;
    });
  };

  const toggleSelectAll = () => {
    setSelectedRows((prev) => {
      if (prev.size === filteredOrders.length) return new Set();
      return new Set(filteredOrders.map((o) => rowKey(o)));
    });
  };

  const allRowsSelected =
    filteredOrders.length > 0 && selectedRows.size === filteredOrders.length;

  const currentStep = "material-issue"; // or derive from login role
  const nextSteps = getNextSteps(currentStep);

  console.log("Next step(s):", nextSteps.map(getStepLabel)); // → ["Semi QC"]
  console.log("Is final step?", isFinalStep(currentStep)); // → false

  const handleQuickAssign = (order: AssemblyOrderData) => {
    const currentStep = "material-issue"; // 👈 set dynamically based on page
    const nextSteps = getNextSteps(currentStep);

    setSelectedOrder(order);
    setQuickAssignOpen(true);

    // Pre-select first next step if available
    setQuickAssignStep(nextSteps[0] || "");
    setQuickAssignQty(String(order.qtyPending ?? order.qty ?? 0));

    setAssignStatus(null);
  setIsAssigning(false);

    // Reset split state
    setSplitOrder(false);
    setSplitAssignStep("");
    setSplitAssignQty("");
    setQuickAssignErrors({});
  };

  const validateQuickAssign = () => {
    const errs: { [k: string]: string } = {};
    const maxQty = Number(selectedOrder?.qtyPending ?? 0);
    const mainQty = Number(quickAssignQty || 0);
    const splitQty = Number(splitAssignQty || 0);

    // Determine next step value from selection or workflow
    const nextStepValue =
      quickAssignStep ||
      (Array.isArray(nextSteps) ? nextSteps[0] : "") ||
      "semi-qc";

    // ✅ Basic validations
    if (!quickAssignStep)
      errs.quickAssignStep = "Please select a workflow step.";
    if (!quickAssignQty || mainQty <= 0)
      errs.quickAssignQty = "Quantity must be greater than 0.";
    if (mainQty > maxQty)
      errs.quickAssignQty = `Cannot exceed available (${maxQty})`;

    // ✅ Split order validation
    if (splitOrder) {
      if (!splitAssignStep) errs.splitAssignStep = "Choose split step.";
      if (!splitAssignQty || splitQty <= 0)
        errs.splitAssignQty = "Split quantity is required.";

      // Prevent assigning same step twice
      if (quickAssignStep === splitAssignStep)
        errs.sameEngineer = "Split step cannot be the same as main step.";

      // Ensure total quantity matches
      const total = mainQty + splitQty;
      if (total !== maxQty)
        errs.totalQtyMismatch = `Total quantity (${total}) must equal available (${maxQty}).`;
    }

    setQuickAssignErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleQuickAssignCancel = () => {
    setIsAssigning(false);
    setAssignStatus(null);
    setQuickAssignOpen(false);
    setSelectedOrder(null);
    setQuickAssignStep("");
    setQuickAssignQty("");
    setSplitOrder(false);
    setSplitAssignStep("");
    setSplitAssignQty("");
    setQuickAssignErrors({});
  };

  // Bin Card / Print
  const selectedOrdersData = orders.filter((o) => selectedRows.has(rowKey(o)));
  const handleShowBinCard = () => setBinCardDialogOpen(true);

const handlePrintBinCard = () => {
  const cards = selectedOrdersData
    .map(
      (order) => `
      <div class="bin-card">
        <div class="content">

          <h1 class="company-name">G M Valve Pvt. Ltd.</h1>

          <h6 class="company-address">
            Plot no. 2732-33, Road No. 1-1, Kranti Gate, G.I.D.C. Lodhika,
            Village Metoda, Dist. Rajkot-360 021
          </h6>

          <h3 class="tag-title process-border">In Process Material Tag</h3>
          <div class="meta">
            <div class="meta-item">
              <div><span class="label">Date:</span> ${order.assemblyDate}</div>
              <div>
                <span class="label">SOA:</span>
                ${String(order.gmsoaNo).replace(/^SOA/i, "")}-${order.soaSrNo}
              </div>

            </div>
              <div class="title assembly-title">
                <p>Assembly Line: ${order.assemblyLine}</p>
              </div>
              <div class="meta-item">
                <p>GMV-L4-F-PRD 01 A</p>
                <p>(02/10.09.2020)</p>
              </div>
         </div>

           

          <div class="desc">
            <div clas="description party-desc">
              <span class="label">Party:</span><p>${order.party}</p>
            </div>
            <div clas="description item-label-description">
              <span class="label item-label">Item:</span><p>${order.product}</p>
            </div>
          </div>

          <div class="qty-logo">
           <div class="meta meta-logo">
            <div class="meta-qty"><span class="label">QTY:</span> ${order.qty}</div>
            <div class="detail-items meta-qty detail-logo"><span class="label ">Logo:</span> ${order.gmLogo}</div>
             </div>
            <div class="detail-items"><span class="label ">Special Note:</span> <span>${order.specialNotes || ""}</span> </div>
            </div>

          <div class="inspect">
            <span class="label">Inspected by:</span>
            <div class="inspect-line"></div>
          </div>

        </div>
      </div>`
    )
    .join("");

  const html = `<!doctype html>
  <html>
    <head>
      <meta charset="utf-8" />
      <title>Bin Card</title>

      <style>
        @page {
          size: 130mm 85mm;
          margin: 0;
        }

        html, body {
          width: 130mm;
          height: 85mm;
          margin: 0;
          padding: 0;
          font-family: Arial, Helvetica, sans-serif;
        }

        .item-label,
        .party-desc {
        padding-bottom: 2mm;}

        .item-label {
        line-height: 1.8em;}

        .bin-card {
          width: 130mm;
          height: 85mm;
          padding: 6mm;
          box-sizing: border-box;
          page-break-after: always;
        }

      .item-label-description {
      padding-top: 50px;}

        .meta-qty {
        width: 50%;}

        .process-border {
        border-top:1px solid #000;
        border-bottom:1px solid #000;
        padding-top: 1.5mm;
        padding-bottom: 1.5mm;
        }

        .detail-logo {
          padding-bottom: 0.9mm;
        }

        .description {
          padding-bottom: 2mm;
        }

        .content {
          width: 100%;
          height: 100%;
          border: 1.5px solid #000;
          border-radius: 10px;
          padding-top: 2mm;
          padding-bottom: 4mm;
             padding-left: 6mm;
                padding-right: 6mm;
          box-sizing: border-box;
          display: flex;
          flex-direction: column;
        }

        .meta-item {
          padding-top: 2mm;
        }

        /* RESET DEFAULT P TAG SPACE */
        p {
          margin: 0;
        }

        /* HEADER */
        .company-name {
          font-size: 12px;
          font-weight: 700;
          text-align: center;
          margin: 0 0 1mm;
          
        }

        .assembly-title p {
        border: 1px solid #000;
          display: inline-block;
          padding-top: 1mm;
          padding-bottom: 0.9mm;
          padding-left: 1mm;
          padding-right: 1mm;
        }

        .company-address {
          font-size: 8px;
          font-weight: 400;
          text-align: center;
          line-height: 1.2;
          margin: 0 0 1.2mm;
        }

        .tag-title {
          font-size: 11px;
          font-weight: 700;
          text-align: center;
          margin: 0 0 1.5mm;
        }

        .doc-row {
          display: flex;
          justify-content: space-between;
          font-size: 9px;
          margin-bottom: 0.5mm; /* 🔥 reduced */
        }

        /* ASSEMBLY LINE */
        .title {
          text-align: center;
          font-size: 11px;
          font-weight: 700;
          margin-top: 0;       /* 🔥 no top gap */
          margin-bottom: 0.5mm;
          //  border: 1px solid #000;
          // display: inline-block;
        }

        .title-line {
          border-bottom: 1px solid #000;
          margin-bottom: 1.5mm;
          margin-top: 0.5mm;
        }

        /* META */
        .meta {
          font-size: 10px;
          line-height: 1.25;
          margin-bottom: 0.8mm;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .meta div {
          margin-bottom: 0.5mm;
        }

        /* ITEM */
        .desc {
          font-size: 9px;
          margin-bottom: 0.8mm;
        }

        .desc p {
        padding-bottom: 0.6mm;}

        .desc span {
          display: block;
          padding-bottom: 0.1mm;
        }

        .desc .label {
          display: block;
          font-size: 10px;
          margin-bottom: 0.8mm;
          margin-top: 0.8mm;
        }

        .desc .text {
          word-break: break-word;
          
        }

        /* QTY */
        .qty-logo {
          font-size: 10px;
          line-height: 1.3;
          margin-bottom: 0.4mm;
           margin-top: 0.8mm;
        }

        /* INSPECTION */
        .inspect {
          margin-top: auto;
          font-size: 10px;
        }

        .inspect-line {
          height: 3mm;
          border-bottom: 1px solid #000;
        }

        .label {
          font-weight: 600;
        }
      </style>
    </head>

    <body>${cards}</body>
  </html>`;

  const iframe = document.createElement("iframe");
  iframe.style.position = "fixed";
  iframe.style.right = "0";
  iframe.style.bottom = "0";
  iframe.style.width = "0";
  iframe.style.height = "0";
  iframe.style.border = "0";

  document.body.appendChild(iframe);

  const doc = iframe.contentDocument || iframe.contentWindow?.document;
  if (!doc) return;

  doc.open();
  doc.write(html);
  doc.close();

  setTimeout(() => {
    iframe.contentWindow?.focus();
    iframe.contentWindow?.print();
    setTimeout(() => document.body.removeChild(iframe), 500);
  }, 300);
};


const handleExport = () => {
  const isUrgentMode = showUrgentOnly === true;
  const isRemarksMode = showRemarksOnly === true;
  const hasSelection = selectedRows.size > 0;

  if (!isUrgentMode && !isRemarksMode && !hasSelection) {
    alert(
      "Export is available only for Urgent or Remarks views. Use 'Export All' for the complete list."
    );
    return;
  }

  const dataToExport = hasSelection
    ? filteredOrders.filter((o) => selectedRows.has(rowKey(o)))
    : filteredOrders;

  if (!dataToExport.length) {
    alert("No data available to export");
    return;
  }

  exportToExcel(dataToExport);
};


const handleExportAll = () => {
  // Prefer fullOrders (global search mode), else fallback to orders
  const allData =
    fullOrders && fullOrders.length > 0 ? fullOrders : orders;

  if (!allData || allData.length === 0) {
    alert("No data available to export");
    return;
  }

  exportToExcel(allData);
};

const exportToExcel = (data: AssemblyOrderData[]) => {
  const exportData = data.map((order, index) => ({
    "No": index + 1,
    "Assembly Line": order.assemblyLine,
    "GMSOA No": order.gmsoaNo,
    "SOA Sr No": order.soaSrNo,
    "Assembly Date": order.assemblyDate,
    "Unique Code": order.uniqueCode,
    "Splitted Code": order.splittedCode || "-",
    "Party": order.party,
    "Customer PO No": order.customerPoNo,
    "Code No": order.codeNo,
    "Product": order.product,
    "PO Qty": order.poQty,
    "Qty": order.qty,
    "Qty Executed": order.qtyExe,
    "Qty Pending": order.qtyPending,
    "Finished Valve": order.finishedValve,
    "GM Logo": order.gmLogo,
    "Name Plate": order.namePlate,
    "Special Notes": order.specialNotes || "",
    "Product Special 1": order.productSpcl1,
    "Product Special 2": order.productSpcl2,
    "Product Special 3": order.productSpcl3,
    "Inspection": order.inspection,
    "Painting": order.painting,
    "Remarks": order.remarks || "",
  }));

  const worksheet = XLSX.utils.json_to_sheet(exportData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Orders");

  const excelBuffer = XLSX.write(workbook, {
    bookType: "xlsx",
    type: "array",
  });

  saveAs(
    new Blob([excelBuffer], { type: "application/octet-stream" }),
    `Orders_${new Date().toISOString().slice(0, 10)}.xlsx`
  );
};


  // View details
  const handleViewDetails = (order: AssemblyOrderData) => {
    setViewedOrder(order);
    setViewDetailsDialogOpen(true);
  };

  // Remarks dialog
  const handleOpenRemarks = (order: AssemblyOrderData) => {
    setRemarksOrder(order);
    setRemarksText(order.remarks || ""); // use backend value
    setRemarksDialogOpen(true);
  };

  const handleSaveRemarks = async () => {
    if (!remarksOrder) return;

    // Build form-data
    const formData = new FormData();
    formData.append("orderId", String(remarksOrder.id));
    formData.append("remarks", remarksText);

    try {
      // Send to backend
      const res = await axios.post(`${API_URL}/add-remarks`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      console.log("Add Remarks Response:", res.data);

      const success =
        res.data?.Resp_code === "true" || res.data?.Resp_code === true;

      if (success) {
        // 🔥 Update LOCAL orders list UI also!
        setOrders((prev) =>
          prev.map((o) =>
            o.id === remarksOrder.id ? { ...o, remarks: remarksText } : o
          )
        );

        // OPTIONAL: update context too if you need it
        try {
          updateRemark(remarksOrder.id, remarksText);
        } catch {}

        // Close dialog
        setRemarksDialogOpen(false);
        setRemarksOrder(null);
        setRemarksText("");
      } else {
        console.warn("Backend rejected remarks:", res.data);
      }
    } catch (err) {
      console.error("Error saving remarks:", err);
    }
  };

  // ✅ Marks urgent one-time only, persists after refresh
  const toggleAlertStatus = async (orderId: string) => {
    const order = orders.find((o) => o.id === orderId);
    const currentStatus = order?.alertStatus === true;
    const newStatus = !currentStatus;

    // Optimistic update
    setOrders((prev) => {
      const updated = prev.map((o) =>
        o.id === orderId ? { ...o, alertStatus: newStatus } : o
      );

      return sortOrders(updated);
    });

    const payload = {
      orderId: String(orderId),
      urgent: newStatus ? "1" : "0",
    };

    try {
      const res = await axios.post(`${API_URL}/mark-urgent`, payload, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const success =
        res.data?.Resp_code === "true" ||
        res.data?.Resp_code === true ||
        res.data?.status === true;

      if (!success) {
        // revert optimistic update
        setOrders((prev) => {
          const reverted = prev.map((o) =>
            o.id === orderId ? { ...o, alertStatus: currentStatus } : o
          );

          return sortOrders(reverted);
        });
      }
    } catch (error) {
      console.error("Urgent API failed:", error);

      // revert on error
      setOrders((prev) => {
        const reverted = prev.map((o) =>
          o.id === orderId ? { ...o, alertStatus: currentStatus } : o
        );

        return sortOrders(reverted);
      });
    }
  };

  const sortOrders = (list: AssemblyOrderData[]) => {
    return [...list].sort((a, b) => {
      // urgent first
      // const aUrg = a.alertStatus ? 1 : 0;
      // const bUrg = b.alertStatus ? 1 : 0;
      // if (aUrg !== bUrg) return bUrg - aUrg;

      // otherwise restore original order
      return (a.originalIndex ?? 0) - (b.originalIndex ?? 0);
    });
  };
  // 🧭 Add inside component (top with other states)
  const [assignStatus, setAssignStatus] = useState<{
    type: "success" | "error" | "info";
    message: string;
  } | null>(null);
  const [isAssigning, setIsAssigning] = useState(false);

  // Removed legacy commented assign-order block to prevent stray references

  const handleAssignOrder = async () => {
    if (isAssigning) return;
    setIsAssigning(true);
    if (!selectedOrder) return;
    if (!validateQuickAssign()) return;

    setAssignStatus({
      type: "info",
      message: "Assigning order, please wait...",
    });

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        setAssignStatus({
          type: "error",
          message: "Token missing. Please log in again.",
        });
        return;
      }

      const mainQty = Number(quickAssignQty || 0);
      const splitQty = Number(splitAssignQty || 0);

      // Resolve next step key and human-readable label consistently
      const nextStepKey =
        quickAssignStep ||
        (Array.isArray(nextSteps) ? nextSteps[0] : "semi-qc");
      const nextStepLabel = getStepLabel(nextStepKey);
      const currentStepLabel = getStepLabel(currentStep);

      //
      // ---------------------------
      // MAIN ASSIGNMENT
      // ---------------------------
      //
      const formData = new FormData();
      formData.append("orderId", String(selectedOrder.id));
      formData.append("totalQty", String(selectedOrder.totalQty ?? selectedOrder.qty ?? 0));
      formData.append("executedQty", String(mainQty));
      formData.append("currentSteps", currentStepLabel);
      formData.append("nextSteps", nextStepLabel);
      formData.append("split_id", String(selectedOrder.split_id || ""));

      console.log("📤 MAIN PAYLOAD:");
      for (const p of formData.entries()) console.log(p[0], p[1]);

      const responseMain = await axios.post(
        `${API_URL}/assign-order`,
        formData,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const mainSuccess =
        responseMain.data?.Resp_code === "true" ||
        responseMain.data?.Resp_code === true;

      if (!mainSuccess) {
        setAssignStatus({
          type: "error",
          message: responseMain.data?.Resp_desc || "Main assignment failed.",
        });
        return;
      }

      let successMessage = `✔ Assigned ${mainQty} → ${nextStepLabel}`;

      //
      // ---------------------------
      // SPLIT ASSIGNMENT
      // ---------------------------
      //
      if (splitOrder && splitQty > 0) {
        const formDataSplit = new FormData();
        formDataSplit.append("orderId", String(selectedOrder.id));
        formDataSplit.append("totalQty", String(selectedOrder.totalQty ?? selectedOrder.qty ?? 0));
        formDataSplit.append("executedQty", String(splitQty));
          formDataSplit.append("currentSteps", currentStepLabel);
        formDataSplit.append("nextSteps", nextStepLabel);
        formDataSplit.append("split_id", String(selectedOrder.split_id || ""));

        console.log("📤 SPLIT PAYLOAD:");
        for (const p of formDataSplit.entries())
          console.log("SPLIT:", p[0], p[1]);

        const responseSplit = await axios.post(
          `${API_URL}/assign-order`,
          formDataSplit,
          { headers: { Authorization: `Bearer ${token}` } }
        );

        const splitSuccess =
          responseSplit.data?.Resp_code === "true" ||
          responseSplit.data?.Resp_code === true;

        if (splitSuccess) {
          successMessage += `\n✔ Split ${splitQty} → ${nextStepLabel}`;
        } else {
          setAssignStatus({
            type: "error",
            message:
              "Main assigned but split failed: " +
              (responseSplit.data?.Resp_desc || "Unknown error"),
          });
        }
      }

      setAssignStatus({ type: "success", message: successMessage });

      // const selectedKey = rowKey(selectedOrder);
      // setOrders((prev) => prev.filter((o) => rowKey(o) !== selectedKey));
      // setSelectedRows((prev) => {
      //   const copy = new Set(prev);
      //   copy.delete(selectedKey);
      //   return copy;
      // });
       await fetchOrders();

      setQuickAssignOpen(false);

  } catch (error) {
    console.error("❌ Error assigning order:", error);
      setAssignStatus({
        type: "error",
        message: "Server error while assigning.",
      });
  } finally {
    setIsAssigning(false);
  }
  };

  // Upload file
  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      setMessage("Please select a file first");
      return;
    }

    const fd = new FormData();
    fd.append("file", file);

    try {
      setUploading(true);

      // NOTE: Do NOT set Content-Type explicitly for multipart/form-data; let browser set the boundary
      const res = await axios.post(`${API_URL}/upload-order-file`, fd, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      // Accept several possible success markers from your backend
      if (
        res.data?.status === true ||
        res.data?.Resp_code === "RCS" ||
        res.data?.Resp_code === "true"
      ) {
        setMessage("✅ File uploaded successfully");

        // reset file input UI
        setFile(null);
        if (fileInputRef.current) fileInputRef.current.value = "";

        // refresh list
        await fetchOrders();
      } else {
        setMessage(res.data?.message || "Upload failed");
      }
    } catch (err) {
      console.error("Upload error", err);
      setMessage("Error uploading file");
    } finally {
      setUploading(false);
      setTimeout(() => setMessage(null), 5000);
    }
  };

  // PDF export (simple version) - uses window.print or jsPDF if present
  const handlePrint = () => {
    try {
      // If you prefer jsPDF, dynamically import and generate PDF as earlier code did.
      window.print();
    } catch (err) {
      console.error("Print error", err);
    }
  };

  // Clear filters
  const clearFilters = () => {
    setAssemblyLineFilter("all");
    setGmsoaFilter("all");
    setPartyFilter("all");
    setDateFilterMode("range");
    setDateFrom(undefined);
    setDateTo(undefined);
  };

  // UI render
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
        onUploadSuccess={() => fetchOrders()}
      />
      <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in bg-white min-h-screen">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col lg:flex-row lg:justify-between lg:items-start gap-4">
            <div className="flex-row-main">
              <h1 className="text-gray-900 mb-2 text-2xl font-semibold">
                Material Issue
              </h1>
              <p className="text-sm text-gray-600">
                Track and manage assembly line orders and manufacturing workflow
              </p>
            </div>

            <div className="flex flex-col gap-4 w-full">
              <div className="flex flex-col sm:flex-row gap-4 lg:items-center justify-end">
                {/* Search */}
                {/* <div className="relative max-input">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 z-10 pointer-events-none text-gray-400" />
                  <Input
                    type="text"
                    placeholder="Search by Unique Code, GMSOA NO, Party ,Customer PO No,Code No.,Product..."
                    value={localSearchTerm}
                    onChange={(e) => setLocalSearchTerm(e.target.value)}
                    className="pl-10 w-full sm:w-80 bg-white/80 backdrop-blur-sm border-gray-200/60 relative z-0"
                  />
                </div> */}

                <div className="flex items-center gap-4">
                  <Button
                    onClick={handleShowBinCard}
                    variant="outline"
                    disabled={selectedRows.size === 0}
                    className="flex items-center gap-2 ctm-btn-disable"
                  >
                    <Printer className="h-4 w-4" />
                    Print Bin Card
                  </Button>

                  <Button
                    onClick={() => setShowUrgentOnly(!showUrgentOnly)}
                    className={`btn-urgent flex items-center gap-2 ${
                      showUrgentOnly
                        ? "bg-red-600 text-white"
                        : "bg-red-50 text-red-700"
                    }`}
                  >
                    <Siren className="h-4 w-4" />
                    {showUrgentOnly
                      ? "Show All Projects"
                      : "Urgent Projects Only"}
                  </Button>

                  <Button
                    onClick={() => setShowRemarksOnly(!showRemarksOnly)}
                    className={`btn-urgent flex items-center gap-2 ${
                      showRemarksOnly
                        ? "bg-btn-gradient text-white shadow-md transition-all btn-remark"
                        : "bg-btn-gradient text-white shadow-md transition-all btn-remark"
                    }`}
                  >
                    {showRemarksOnly ? "Show All Projects" : "Remarks only"}
                  </Button>
                </div>
              </div>
              {/* Option row - could include more buttons */}
            </div>

             <Button
             disabled={filteredOrders.length === 0}
                          onClick={handleExport}
                          className="bg-gradient-to-r from-[#174a9f] to-[#1a5cb8] hover:from-[#123a80] hover:to-[#174a9f] text-white shadow-lg hover:shadow-xl transition-all duration-300"
                        >
                          <Download className="h-4 w-4 mr-2" />
                          Export Data
                        </Button>
            
                         <Button
                          onClick={handleExportAll}
                          className="bg-gradient-to-r from-[#174a9f] to-[#1a5cb8] hover:from-[#123a80] hover:to-[#174a9f] text-white shadow-lg hover:shadow-xl transition-all duration-300"
                        >
                          <Download className="h-4 w-4 mr-2" />
                          Export all Data
                        </Button>
          </div>

          {/* Filters */}
          <div className="mt-4">
            <OrderFilters
            currentStage="default"

            searchTerm={localSearchTerm}
  setSearchTerm={setLocalSearchTerm}

              assemblyLineFilter={assemblyLineFilter}
              setAssemblyLineFilter={setAssemblyLineFilter}
              dateFilterMode={dateFilterMode}
              setDateFilterMode={setDateFilterMode}
              dateFrom={dateFrom}
              setDateFrom={setDateFrom}
              dateTo={dateTo}
              setDateTo={setDateTo}
              assemblyLines={assemblyLines}
              onClearFilters={clearFilters}
              hasActiveFilters={
                assemblyLineFilter !== "all" ||
                gmsoaFilter !== "all" ||
                partyFilter !== "all" ||
                !!dateFrom ||
                !!dateTo
              }
            />
          </div>
        </div>

        {/* Upload Section */}
        {/* <form onSubmit={handleUpload} className="bg-white shadow-md p-4 rounded-xl mb-6">
        <h2 className="text-lg font-semibold mb-3 text-gray-700">Upload Order File</h2>
        <div className="flex items-center gap-3 flex-wrap">
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.csv"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
            className="border p-2 rounded-md"
          />
          <Button
            type="submit"
            className="bg-gradient-to-r from-[#174a9f] to-[#1a5cb8] text-white flex items-center gap-2"
            disabled={uploading}
          >
            <Plus className="h-4 w-4" />
            {uploading ? 'Uploading...' : 'Upload'}
          </Button>

          <Button onClick={() => fetchOrders()} variant="outline" className="ml-2">
            Refresh
          </Button>

          <Button onClick={handlePrint} variant="outline" className="ml-2">
            Export / Print
          </Button>
        </div>

        {message && <div className="mt-3 text-sm text-yellow-800 bg-yellow-100 p-2 rounded">{message}</div>}
      </form> */}

        {/* Table */}
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
          <div
            ref={tableScrollRef}
            className="relative overflow-x-auto max-w-full"
            style={{ scrollbarGutter: "stable" }}
          >
            <div className="inline-block min-w-full align-middle">
              {loading && orders.length === 0 ? (
                <div className="p-10 text-center text-gray-600 ctm-load">Loading...</div>
              ) : (
                <div>
              <table className="min-w-full border-collapse">
                <thead>
                  <tr>
                    {/* Select all sticky checkbox */}
                    <th className="sticky left-0 z-20 bg-white px-3 py-2 text-center border-r border-gray-200 w-12">
                      <button
                        type="button"
                        role="checkbox"
                        aria-checked={String(allRowsSelected)}
                        onClick={toggleSelectAll}
                        className="peer rounded border p-0.5"
                        aria-label="Select all rows"
                      >
                        {/* small box visual */}
                        <div
                          className={`w-4 h-4 ${
                            allRowsSelected ? "bg-blue-600" : "bg-white border"
                          }`}
                        />
                      </button>
                    </th>

                    <th className="sticky left-10 z-20 bg-white px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200 w-20">
                      Assembly Line
                    </th>
                    <th className="sticky left-164 z-20 bg-white px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200 min-w-28">
                      SOA NO.
                    </th>
                   <th
  className="sticky left-274 z-20 bg-white px-3 py-2 text-center
             text-xs font-medium text-gray-500 uppercase tracking-wider
             border-r border-gray-200 min-w-24 cursor-pointer select-none"
  onClick={() =>
    setSoaSort((prev) =>
      prev === "asc" ? "desc" : prev === "desc" ? null : "asc"
    )
  }
>
  Sr. No.
  {soaSort === "asc" && " ▲"}
  {soaSort === "desc" && " ▼"}
</th>
                    <th className="sticky left-364 z-20 bg-white px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider border-r-2 border-gray-300 min-w-32 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">
                      Assembly Date
                    </th>

                    <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200 min-w-36">
                      Unique Code
                    </th>
                    <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200">
                      Splitted Code
                    </th>
                    <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200 w-20">
                      Party
                    </th>
                    <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200">
                      Customer PO No.
                    </th>
                    <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200">
                      Code No
                    </th>
                    <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200">
                      Product
                    </th>
                    <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200">
                      Qty
                    </th>
                    <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200">
                      Qty Exe.
                    </th>
                    <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200">
                      Qty Pending
                    </th>
                    <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200">
                      finished valve
                    </th>
                    <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200">
                      GM LOGO
                    </th>
                    <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200">
                      NAME PLATE
                    </th>
                      <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200">
                          SPECIAL NOTES
                        </th>
                    <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200">
                      PRODUCT SPCL1
                    </th>
                    <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200">
                      PRODUCT SPCL2
                    </th>
                    <th
                      className="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200"
                      style={{ width: "400px" }}
                    >
                      PRODUCT SPCL3
                    </th>
                    <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200">
                      INSPECTION
                    </th>
                    <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200">
                      PAINTING
                    </th>
                    <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200">
                      remarks
                    </th>

                    <th className="sticky right-0 z-20 bg-white px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider border-l border-gray-200">
                      Actions
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-gray-200">
                  {paginatedOrders.map((order) => (
                    <tr key={rowKey(order)} className="group hover:bg-gray-50">
                      <td className="sticky left-0 z-10 bg-white group-hover:bg-gray-50 px-3 py-2 text-center border-r border-gray-200 w-12">
                        <Checkbox
                          checked={selectedRows.has(rowKey(order))}
                          onCheckedChange={() => toggleRowSelection(rowKey(order))}
                          aria-label={`Select row ${order.id}`}
                        />
                      </td>

                      <td className="sticky left-10 z-10 bg-white group-hover:bg-gray-50 px-3 py-2 whitespace-nowrap text-center border-r border-gray-200 w-20">
                        <Badge
                          variant="outline"
                          className="bg-gray-50 text-gray-700 border-gray-200"
                        >
                          {order.assemblyLine}
                        </Badge>
                      </td>

                      <td className="sticky left-164 z-10 bg-white group-hover:bg-gray-50 px-3 py-2 whitespace-nowrap text-center text-sm text-gray-900 border-r border-gray-200 min-w-28">
                        {order.gmsoaNo}
                      </td>
                      <td className="sticky left-274 z-10 bg-white group-hover:bg-gray-50 px-3 py-2 whitespace-nowrap text-center text-sm text-gray-900 border-r border-gray-200 min-w-24">
                        {order.soaSrNo}
                      </td>
                      <td className="sticky left-364 z-10 bg-white group-hover:bg-gray-50 px-3 py-2 whitespace-nowrap text-center text-sm text-gray-900 border-r-2 border-gray-300 min-w-32 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">
                        {order.assemblyDate}
                      </td>

                      <td className="px-3 py-2 whitespace-nowrap text-center text-sm text-gray-900 font-mono min-w-36">
                        {order.uniqueCode}
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap text-center text-sm text-gray-900">
                        {order.splittedCode}
                      </td>
                       <td className="px-3 py-2 text-center text-sm text-gray-900 max-w-xs">
                           <div  style={{ width: "120px" }}
 
                                title={order.party} 
                          >
                            {truncateWords(order.party, 4)}
                          </div>

                        </td>
                      <td className="px-3 py-2 whitespace-nowrap text-center text-sm text-gray-900">
                        {order.customerPoNo}
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap text-center text-sm text-gray-900">
                        {order.codeNo}
                      </td>

                      <td className="px-3 py-2 text-center text-sm text-gray-900 w-80">
                         <div
    className="line-clamp-2"
    style={{ width: "300px" }}
    title={order.product}   // 👈 shows full text on hover
  >{order.product}</div>
                      </td>

                      <td className="px-3 py-2 whitespace-nowrap text-center text-sm text-gray-900">
                        {order.totalQty}
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap text-center text-sm text-gray-900">
                        {order.qtyExe}
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap text-center text-sm text-gray-900">
                        {order.qtyPending}
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap text-center text-sm text-gray-900">
                        {order.finishedValve}
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap text-center text-sm text-gray-900">
                        {order.gmLogo}
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap text-center text-sm text-gray-900">
                        {order.namePlate}
                      </td>
                      <td className="px-3 py-2 text-center text-sm text-gray-900">
                            <div
                              className="line-clamp-2"
                              style={{ width: "200px" }}
                              title={order.specialNotes}
                            >
                              {order.specialNotes || "-"}
                            </div>
                          </td>
                      <td className="px-3 py-2 whitespace-nowrap text-center text-sm text-gray-900">
                        {order.productSpcl1}
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap text-center text-sm text-gray-900">
                        {order.productSpcl2}
                      </td>
                      <td
                        className="px-3 py-2 text-center text-sm text-gray-900"
                        style={{ width: "400px" }}
                      >
                        <div className="line-clamp-2">{order.productSpcl3}</div>
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap text-center text-sm text-gray-900">
                        {order.inspection}
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap text-center text-sm text-gray-900">
                        {order.painting}
                      </td>

 <td className="px-3 py-2 text-center text-sm text-gray-900">
  <div className="relative inline-block group">
   <Button
  size="sm"
  variant="ghost"
  title={order.remarks || "Add / Edit Remarks"}
  className={`h-7 w-7 p-0 ${
    order.remarks?.trim()
      ? "bg-[#174a9f] hover:bg-[#123a7f]"
      : "hover:bg-[#d1e2f3]"
  }`}
  onClick={() => handleOpenRemarks(order)}
>
  <MessageSquarePlus
    className={`h-4 w-4 ${
      order.remarks?.trim() ? "text-white" : "text-blue-600"
    }`}
  />
</Button>


    {/* ✅ SHOW REMARK TEXT ON HOVER */}
    {order.remarks?.trim() && (
      <div
        className="
          absolute bottom-full left-1/2 -translate-x-1/2 mb-2
          hidden group-hover:block
          bg-gray-900 text-white text-xs
          px-3 py-2 rounded-md shadow-lg
          max-w-[260px] break-words z-[999]
        "
      >
        {order.remarks}
      </div>
    )}
  </div>
</td>

                      <td className="sticky right-0 z-10 bg-white group-hover:bg-gray-50 px-3 py-2 whitespace-nowrap border-l border-gray-200">
                        <div className="flex items-center space-x-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 w-7 p-0 hover:bg-blue-100"
                            title="View Details"
                            onClick={() => handleViewDetails(order)}
                          >
                            <Eye className="h-4 w-4 text-blue-600" />
                          </Button>

                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 w-7 p-0 hover:bg-green-100"
                            title="Assign Next"
                            onClick={() => handleQuickAssign(order)}
                          >
                            <ArrowRight className="h-4 w-4 text-green-600" />
                          </Button>

                          <Button
                            size="sm"
                            variant="ghost"
                            className={`h-7 w-7 p-0 transition-all duration-200 ${
                              order.alertStatus
                                ? "bg-red-100 border border-red-200 shadow-sm"
                                : "hover:bg-red-50"
                            }`}
                            title={"Urgent status is read-only"}
                            disabled
                          >
                            <Siren
                              className={`h-4 w-4 ${
                                order.alertStatus
                                  ? "text-red-600 animate-siren-pulse"
                                  : "text-gray-400"
                              }`}
                            />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
               {filteredOrders.length === 0 && (
                <div className="p-6 text-center text-gray-500">
                  No orders found.
                </div>
              )}
              </div>
              )}
             
            </div>
          </div>
        </div>

        {selectedTotals.count > 0 && (
  <div className="border-t bg-gray-50 px-6 py-3 flex flex-wrap gap-6 justify-end text-sm font-semibold">
    <div>
      Selected Rows: <span className="text-blue-700">{selectedTotals.count}</span>
    </div>
    <div>
      Total Qty: <span className="text-gray-900">{selectedTotals.qty}</span>
    </div>
    <div>
      Qty Executed: <span className="text-green-700">{selectedTotals.qtyExe}</span>
    </div>
    <div>
      Qty Pending: <span className="text-red-600">{selectedTotals.qtyPending}</span>
    </div>
  </div>
)}


         <TablePagination
          page={page}
          perPage={perPage}
          total={filteredOrders.length}
          lastPage={Math.max(1, Math.ceil(filteredOrders.length / Math.max(perPage, 1)))}
          onChangePage={setPage}
          onChangePerPage={setPerPage}
          disabled={loading}
        />

        {/* Quick Assign Dialog */}
        <Dialog open={quickAssignOpen} onOpenChange={(open) => {if (!open) {
      setQuickAssignOpen(false);
      setIsAssigning(false);       // <-- STOP assigning
      setAssignStatus(null);       // <-- clear status message
    }
  }}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Quick Assign Order</DialogTitle>
              <DialogDescription>
                Assign {selectedOrder?.uniqueCode} to the next workflow step
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6 py-4">
              {/* Main Assignment Section */}
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="assignStep">Assign to Workflow Step</Label>
                    <Select
                      value={quickAssignStep}
                      onValueChange={setQuickAssignStep}
                    >
                      <SelectTrigger id="assignStep">
                        <SelectValue placeholder="Select next step" />
                      </SelectTrigger>
                      <SelectContent>
                        {nextSteps.map((step) => (
                          <SelectItem key={step} value={step}>
                            {getStepLabel(step)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="assignQty">Quantity</Label>
                    <Input
                      id="assignQty"
                      type="number"
                      value={quickAssignQty}
                      onChange={(e) => {
                        const v = e.target.value;
                        setQuickAssignQty(v);
                        const max = Number(selectedOrder?.qtyPending ?? 0);
                        const n = Number(v || 0);
                        setQuickAssignErrors((prev) => {
                          const next = { ...prev } as any;
                          if (n > max) next.quickAssignQty = `Cannot exceed available (${max})`;
                          else {
                            if (next.quickAssignQty) delete next.quickAssignQty;
                          }
                          return next;
                        });
                      }}
                      max={selectedOrder?.qtyPending}
                    />
                    {quickAssignErrors.quickAssignQty && (
                      <div className="text-red-600 text-sm mt-1">
                        {quickAssignErrors.quickAssignQty}
                      </div>
                    )}
                  </div>
                </div>

                <div className="text-sm text-gray-500">
                  Available Quantity:{" "}
                  <span className="font-medium text-gray-900">
                    {selectedOrder?.qtyPending}
                  </span>
                </div>
              </div>

            </div>

            {/* Status Message */}
            {assignStatus && (
              <div
                className={`p-3 mt-3 rounded-md text-sm ${
                  assignStatus.type === "success"
                    ? "bg-green-50 text-green-700 border border-green-200"
                    : assignStatus.type === "error"
                    ? "bg-red-50 text-red-700 border border-red-200"
                    : "bg-blue-50 text-blue-700 border border-blue-200"
                }`}
              >
                {assignStatus.message.split("\n").map((line, i) => (
                  <div key={i}>{line}</div>
                ))}
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex justify-end space-x-3 pt-4 border-t border-gray-100">
              <Button
  variant="outline"
  onClick={handleQuickAssignCancel}
  disabled={isAssigning}   // 🔒 DISABLE WHILE ASSIGNING
>
  Cancel
</Button>

              <Button
                onClick={handleAssignOrder}
                disabled={
                  isAssigning ||
                  !!quickAssignErrors.quickAssignQty
                }
                className="bg-black hover:bg-gray-800 text-white"
              >
                {isAssigning ? "Assigning..." : "Assign"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Bin Card Dialog */}
        <Dialog open={binCardDialogOpen} onOpenChange={setBinCardDialogOpen}>
          <DialogContent className="!max-w-[700px] max-h-[90vh] overflow-y-auto dialog-content-wrp">
            <DialogHeader>
              <DialogTitle className="text-lg font-semibold text-gray-900">
                Bin Card Preview
              </DialogTitle>
              <DialogDescription className="text-sm text-gray-500">
                This preview matches the printed bin card layout.
              </DialogDescription>
            </DialogHeader>

            <div className="py-6 space-y-8">
              {selectedOrdersData.map((order) => (
                <div
                  key={order.id}
                  className="mx-auto w-full max-w-[640px] rounded-[16px] border-2 border-black bg-white px-6 py-5 dialog-inline"
                >
                  {/* COMPANY NAME */}
                  <h1 className="text-center text-lg font-bold">
                    G M Valve Pvt. Ltd.
                  </h1>

                  {/* ADDRESS */}
                  <p className="mt-1 text-center text-[11px] leading-tight">
                    Plot no. 2732-33, Road No. 1-1, Kranti Gate, G.I.D.C. Lodhika,
                    Village Metoda, Dist. Rajkot-360 021
                  </p>

                  {/* TAG */}
                  <div className="mt-3 border-y-2 border-black py-1 text-center text-sm font-semibold">
                    In Process Material Tag
                  </div>

                  {/* DATE / SOA / DOC */}
                  <div className="mt-3 grid grid-cols-3 items-start text-sm">
                    <div>
                      <div>
                        <span className="font-semibold">Date:</span>{" "}
                        {order.assemblyDate}
                      </div>
                      <div>
                        <span className="font-semibold">SOA:</span>{" "}
                        {String(order.gmsoaNo).replace(/^SOA/i, "")}-{order.soaSrNo}
                      </div>
                    </div>

                    <div className="flex justify-center">
                      <span className="border-2 border-black px-3 py-1 text-sm font-semibold">
                        Assembly Line: {order.assemblyLine}
                      </span>
                    </div>

                    <div className="text-right text-xs leading-tight">
                      <div>GMV-L4-F-PRD 01 A</div>
                      <div>(02/10.09.2020)</div>
                    </div>
                  </div>

                  {/* PARTY */}
                  <div className="mt-4 text-sm">
                    <span className="font-semibold">Party:</span>
                    <div className="mt-1">{order.party}</div>
                  </div>

                  {/* ITEM */}
                  <div className="mt-3 text-sm">
                    <span className="font-semibold">Item:</span>
                    <div className="mt-1 leading-snug">{order.product}</div>
                  </div>

                  {/* QTY & LOGO */}
                  <div className="mt-4 flex justify-between text-sm">
                    <div>
                      <span className="font-semibold">QTY:</span> {order.qty}
                    </div>
                    <div>
                      <span className="font-semibold">Logo:</span> {order.gmLogo}
                    </div>
                  </div>

                  {/* SPECIAL NOTE */}
                  <div className="mt-4 text-sm">
                    <span className="font-semibold">Special Note:</span>
                    <div className="mt-1 h-5 border-b border-black">
                      {order.specialNotes || ""}
                    </div>
                  </div>

                  {/* INSPECTED BY */}
                  <div className="mt-6 inspected text-sm">
                    <span className="font-semibold">Inspected by:</span>
                    <div className="mt-1 h-6 border-b border-black"></div>
                  </div>
                </div>
              ))}
            </div>

            {/* ACTIONS */}
            <div className="flex justify-end gap-3 border-t pt-4">
              <Button variant="outline" onClick={() => setBinCardDialogOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={handlePrintBinCard}
                className="flex items-center gap-2 bg-gradient-to-r from-[#174a9f] to-[#1a5cb8] hover:from-[#123a80] hover:to-[#174a9f] text-white shadow-md"
              >
                <Printer className="h-4 w-4" />
                Print
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* View Order Details Dialog */}
        <Dialog
          open={viewDetailsDialogOpen}
          onOpenChange={setViewDetailsDialogOpen}
        >
          <DialogContent className="sm:max-w-[900px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Order Details</DialogTitle>
              <DialogDescription>
                Complete information for {viewedOrder?.uniqueCode}
              </DialogDescription>
            </DialogHeader>

            {viewedOrder && (
              <div className="space-y-6 py-4">
                <div className="bg-blue-50/50 rounded-lg p-4">
                  <h3 className="font-medium text-gray-900 mb-3">
                    Basic Information
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-gray-500 text-sm">
                        Assembly Line
                      </Label>
                      <p className="text-gray-900 mt-1">
                        {viewedOrder.assemblyLine}
                      </p>
                    </div>
                    <div>
                      <Label className="text-gray-500 text-sm">SOA No.</Label>
                      <p className="text-gray-900 mt-1">
                        {viewedOrder.gmsoaNo}
                      </p>
                    </div>
                    <div>
                      <Label className="text-gray-500 text-sm">
                        Sr. No.
                      </Label>
                      <p className="text-gray-900 mt-1">
                        {viewedOrder.soaSrNo}
                      </p>
                    </div>
                    <div>
                      <Label className="text-gray-500 text-sm">
                        Assembly Date
                      </Label>
                      <p className="text-gray-900 mt-1">
                        {viewedOrder.assemblyDate}
                      </p>
                    </div>
                    <div>
                      <Label className="text-gray-500 text-sm">
                        Unique Code
                      </Label>
                      <p className="text-gray-900 mt-1">
                        {viewedOrder.uniqueCode}
                      </p>
                    </div>
                    <div>
                      <Label className="text-gray-500 text-sm">
                        Splitted Code
                      </Label>
                      <p className="text-gray-900 mt-1">
                        {viewedOrder.splittedCode || "-"}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-green-50/50 rounded-lg p-4">
                  <h3 className="font-medium text-gray-900 mb-3">
                    Customer & Product Information
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-gray-500 text-sm">Party</Label>
                      <p className="text-gray-900 mt-1">{viewedOrder.party}</p>
                    </div>
                    <div>
                      <Label className="text-gray-500 text-sm">
                        Customer PO No.
                      </Label>
                      <p className="text-gray-900 mt-1">
                        {viewedOrder.customerPoNo}
                      </p>
                    </div>
                    <div>
                      <Label className="text-gray-500 text-sm">Code No</Label>
                      <p className="text-gray-900 mt-1">{viewedOrder.codeNo}</p>
                    </div>
                    <div className="col-span-2">
                      <Label className="text-gray-500 text-sm">Product</Label>
                      <p className="text-gray-900 mt-1">
                        {viewedOrder.product}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-purple-50/50 rounded-lg p-4">
                  <h3 className="font-medium text-gray-900 mb-3">
                    Quantity Information
                  </h3>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <Label className="text-gray-500 text-sm">Qty</Label>
                      <p className="text-gray-900 mt-1">{viewedOrder.totalQty}</p>
                    </div>
                    <div>
                      <Label className="text-gray-500 text-sm">Qty Exe.</Label>
                      <p className="text-gray-900 mt-1">{viewedOrder.qtyExe}</p>
                    </div>
                    <div>
                      <Label className="text-gray-500 text-sm">
                        Qty Pending
                      </Label>
                      <p className="text-gray-900 mt-1">
                        {viewedOrder.qtyPending}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-amber-50/50 rounded-lg p-4">
                  <h3 className="font-medium text-gray-900 mb-3">
                    Product Specifications
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-gray-500 text-sm">
                        Finished Valve
                      </Label>
                      <p className="text-gray-900 mt-1">
                        {viewedOrder.finishedValve || "-"}
                      </p>
                    </div>
                    <div>
                      <Label className="text-gray-500 text-sm">GM Logo</Label>
                      <p className="text-gray-900 mt-1">{viewedOrder.gmLogo}</p>
                    </div>
                    <div>
                      <Label className="text-gray-500 text-sm">
                        Name Plate
                      </Label>
                      <p className="text-gray-900 mt-1">
                        {viewedOrder.namePlate}
                      </p>
                    </div>
                    <div>
                      <Label className="text-gray-500 text-sm">
                        Product SPCL1
                      </Label>
                      <p className="text-gray-900 mt-1">
                        {viewedOrder.productSpcl1 || "-"}
                      </p>
                    </div>
                    <div>
                      <Label className="text-gray-500 text-sm">
                        Product SPCL2
                      </Label>
                      <p className="text-gray-900 mt-1">
                        {viewedOrder.productSpcl2 || "-"}
                      </p>
                    </div>
                     <div>
                        <Label className="text-gray-500 text-sm">
                          Special notes
                        </Label>
                        <p className="text-gray-900 mt-1">
                          {viewedOrder.specialNotes || "-"}
                        </p>
                      </div>
                    <div className="col-span-2">
                      <Label className="text-gray-500 text-sm">
                        Product SPCL3
                      </Label>
                      <p className="text-gray-900 mt-1">
                        {viewedOrder.productSpcl3 || "-"}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="font-medium text-gray-900 mb-3">
                    Additional Information
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-gray-500 text-sm">
                        Inspection
                      </Label>
                      <p className="text-gray-900 mt-1">
                        {viewedOrder.inspection}
                      </p>
                    </div>
                    <div>
                      <Label className="text-gray-500 text-sm">Painting</Label>
                      <p className="text-gray-900 mt-1">
                        {viewedOrder.painting}
                      </p>
                    </div>
                    <div className="col-span-2">
                      <Label className="text-gray-500 text-sm">Remarks</Label>
                      <p className="text-gray-900 mt-1">
                        {viewedOrder.remarks || "No remarks"}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="flex justify-end pt-4 border-t border-gray-100">
              <Button
                variant="outline"
                onClick={() => setViewDetailsDialogOpen(false)}
              >
                Close
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Remarks Dialog */}
        <Dialog open={remarksDialogOpen} onOpenChange={setRemarksDialogOpen}>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Add/Edit Remarks</DialogTitle>
              <DialogDescription>
                {remarksOrder ? `Order: ${remarksOrder.uniqueCode}` : ""}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <Label htmlFor="remarks">Remarks</Label>
              <Textarea
                id="remarks"
                placeholder="Enter remarks..."
                value={remarksText}
                onChange={(e) => setRemarksText(e.target.value)}
                rows={6}
                className="resize-none"
              />
            </div>

            <div className="flex justify-end space-x-3 pt-4 border-t border-gray-100">
              <Button
                variant="outline"
                onClick={() => setRemarksDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSaveRemarks}
                className="bg-blue-600 text-white"
              >
                Save Remarks
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </>
  );
}

export default MaterialIssuePage;
