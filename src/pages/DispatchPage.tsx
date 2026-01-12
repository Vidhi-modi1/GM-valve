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
  Download,
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
import { useNavigate } from "react-router-dom";

// const API_URL = 'http://192.168.1.17:2010/api';

interface AssemblyOrderData {
  id: string;
  specialNotes: string;
  assemblyLine: string;
  gmsoaNo: string;
  soaSrNo: string;
  assemblyDate: string;
  uniqueCode: string;
  splittedCode: string;
  split_id: string;
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
  packaging: number;
  oclAdded?: boolean;
  originalIndex: number;
}

export function DispatchPage() {
  const navigate = useNavigate();
  // context for remarks & alert status (from your existing order-context)
  const {
    updateRemark,
    toggleAlertStatus: toggleAlertStatusContext,
    getRemark,
    getAlertStatus,
  } = useOrderContext();

  // API data + UI state
  const [orders, setOrders] = useState<AssemblyOrderData[]>([]);
  const [fullOrders, setFullOrders] = useState<AssemblyOrderData[] | null>(
    null
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState<number>(1);
  const [perPage, setPerPage] = useState<number>(100);

  const [soaSort, setSoaSort] = useState<"asc" | "desc" | null>(null);

  // search / selection / filters / dialogs etc.
  const [localSearchTerm, setLocalSearchTerm] = useState("");
  const [showUrgentOnly, setShowUrgentOnly] = useState(false);
    const [showOclAddedOnly, setShowOclAddedOnly] = useState(false);
  const [showRemarksOnly, setShowRemarksOnly] = useState(false);
  const [assemblyLineFilter, setAssemblyLineFilter] = useState("all");
  const [gmsoaFilter, setGmsoaFilter] = useState("all");
  const [partyFilter, setPartyFilter] = useState("all");
  const [dateFilterMode, setDateFilterMode] = useState<
    "year" | "month" | "range" | "single"
  >("single");
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

  const [packagingDialogOpen, setPackagingDialogOpen] = useState(false);
  const [packagingOrder, setPackagingOrder] = useState<any>(null);
  const [oclNo, setOclNo] = useState("");
  const [isSubmittingPackaging, setIsSubmittingPackaging] = useState(false);
  const [packagingToast, setPackagingToast] = useState(false);
  const [showPackagingPopup, setShowPackagingPopup] = useState(false);

  // const handlePackagingCheckbox = async (

  //   checked: boolean,
  //   order: any
  // ) => {

  //   try {
  //     const token = localStorage.getItem("token");

  //     if (checked) {
  //       const fd = new FormData();
  //       fd.append("split_id", String(order.split_id));
  //       fd.append("packaging", "1");

  //       await axios.post(`${API_URL}/change-to-packaging`, fd, {
  //         headers: { Authorization: `Bearer ${token}` },
  //       });

  //       setOrders((prev) =>
  //         prev.map((o) => (o.id === order.id ? { ...o, packaging: 1 } : o))
  //       );
  //     } else {
  //       // Once packaging is set to 1, do not allow reverting to 0
  //       if (order.packaging === 1) {
  //         setOrders((prev) =>
  //           prev.map((o) => (o.id === order.id ? { ...o, packaging: 1 } : o))
  //         );
  //         alert("Packaging is permanent once set.");
  //       } else {
  //         setOrders((prev) =>
  //           prev.map((o) => (o.id === order.id ? { ...o, packaging: 0 } : o))
  //         );
  //       }
  //     }

  //     // Close popup if open
  //     setPackagingDialogOpen(false);
  //     setPackagingOrder(null);
  //     setOclNo("");
  //   } catch (err) {
  //     console.error("Packaging toggle failed", err);
  //     alert("Failed to update packaging status");
  //   }
  // };

  const handlePackagingCheckbox = async (checked: boolean, order: any) => {
    if (!checked) return;

    try {
      const token = localStorage.getItem("token");

      // Show immediate 1-second dialog when checked
      setShowPackagingPopup(true);
      setTimeout(() => setShowPackagingPopup(false), 2000);

      const fd = new FormData();
      fd.append("split_id", String(order.split_id));
      fd.append("packaging", "1");

      await axios.post(`${API_URL}/change-to-packaging`, fd, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setOrders((prev) =>
        prev.map((o) => (o.id === order.id ? { ...o, packaging: 1 } : o))
      );

      // ✅ SHOW TOAST
      setPackagingToast(true);
      setTimeout(() => setPackagingToast(false), 1000);
    } catch (err) {
      console.error("Packaging toggle failed", err);
    }
  };

  const handleOpenOclPopup = (order: any) => {
    console.log("Opening OCL for order:", order); // debug once
    setPackagingOrder(order); // FULL object
    setOclNo("");
    setPackagingDialogOpen(true);
  };


  const handleConfirmPackaging = async () => {
    console.log("CONFIRM CLICKED", packagingOrder, oclNo);

    if (!packagingOrder?.id) {
      alert("Order ID missing");
      return;
    }

    if (!oclNo.trim()) {
      alert("Enter OCL number");
      return;
    }

    try {
      setIsSubmittingPackaging(true);

      const token = localStorage.getItem("token");
      if (!token) {
        alert("Token missing. Please login again.");
        return;
      }

      const fd = new FormData();
      fd.append("split_id", packagingOrder.split_id);
      fd.append("order_id", packagingOrder.id);
      fd.append("currentSteps", "Dispatch");
      fd.append("nextSteps", "Packaging");
      fd.append("ocl_no", oclNo);

      await axios.post(`${API_URL}/dispatch-to-packaging`, fd, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setOrders((prev) =>
        prev.map((o) =>
          o.id === packagingOrder.id ? { ...o, oclAdded: true } : o
        )
      );

      alert("OCL Number saved successfully");

      setPackagingDialogOpen(false);
      setPackagingOrder(null);
      setOclNo("");

      fetchOrders(); // refresh list
    } catch (error: any) {
      console.error("Dispatch to packaging failed", error);

      alert(
        error.response?.data?.message ||
          error.response?.data?.Resp_desc ||
          "Failed to move order to Packaging"
      );
    } finally {
      setIsSubmittingPackaging(false);
    }
  };

  const handleCancelPackagingPopup = () => {
    setPackagingDialogOpen(false);
    setPackagingOrder(null);
    setOclNo("");
  };

  // Fetch orders from API (POST)
  const fetchOrders = async () => {
    try {
      setLoading(true);
      setError(null);

      const currentStage = "dispatch";
      const stageLabel = getStepLabel(currentStage);

      const res = await axios.post(
        `${API_URL}/order-list`,
        { menu_name: stageLabel },
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
          (item: any) => ({
            id: String(item.id),
            assemblyLine: item.assembly_no || "",
            gmsoaNo: item.soa_no || "",
            soaSrNo: item.soa_sr_no || "",
            assemblyDate: item.assembly_date || "",
            uniqueCode: item.unique_code || item.order_no || "",
            splittedCode: item.splitted_code || "",
            split_id: item.split_id || item.splitted_code || "",
            party: item.party_name || item.party || "",
            customerPoNo: item.customer_po_no || "",
            codeNo: item.code_no || "",
            product: item.product || "",
            qty: Number(item.totalQty || item.total_qty || item.qty || 0),
            totalQty: Number(item.totalQty || item.total_qty || item.qty || 0),
            // qty: Number(item.qty || 0),
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
            packaging: item.packaging === 1 || item.packaging === "1" ? 1 : 0,
            oclAdded: Boolean(item.ocl_no), 


            // ✅ Preserve urgent flag properly (backend sends 0 or 1)
            alertStatus:
              item.is_urgent === true ||
              item.is_urgent === "true" ||
              item.alert_status === true ||
              item.alert_status === "true" ||
              item.urgent === 1 ||
              item.urgent === "1",
          })
        );

        console.log("✅ Orders fetched:", apiOrders.length, "records");
        setOrders(sortOrders(apiOrders));
        setFullOrders(null);
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

  // 🔥 GLOBAL SEARCH FLAG
  const useGlobalSearch = useMemo(() => {
    const hasSearch = localSearchTerm.trim().length > 0;
    const hasFilters =
      assemblyLineFilter !== "all" ||
      gmsoaFilter !== "all" ||
      partyFilter !== "all";
    const hasDate = Boolean(dateFrom) || Boolean(dateTo);

    return (
      hasSearch || hasFilters || hasDate || showUrgentOnly || showRemarksOnly
    );
  }, [
    localSearchTerm,
    assemblyLineFilter,
    gmsoaFilter,
    partyFilter,
    dateFrom,
    dateTo,
    showUrgentOnly,
    showRemarksOnly,
  ]);

  useEffect(() => {
    if (!useGlobalSearch) {
      fetchOrders();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, perPage, useGlobalSearch]);

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
    let filtered = orders.slice();

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
    if (showOclAddedOnly) {
  filtered = filtered.filter((o) => o.oclAdded === true);
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

        /** 🔥 RANGE + SINGLE (same logic) */
        if (dateFilterMode === "range" || dateFilterMode === "single") {
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
        const aNo = parseSoaSrNo(a.soaSrNo);
        const bNo = parseSoaSrNo(b.soaSrNo);

        return soaSort === "asc" ? aNo - bNo : bNo - aNo;
      });
    }

    return filtered;
  }, [
    orders,
    localSearchTerm,
    showUrgentOnly,
    showRemarksOnly,
        showOclAddedOnly,
    assemblyLineFilter,
    gmsoaFilter,
    partyFilter,
    dateFilterMode,
    dateFrom,
    dateTo,
    getAlertStatus,
    soaSort,
  ]);
  

  const paginatedOrders = useMemo(() => {
    const start = (page - 1) * perPage;
    return filteredOrders.slice(start, start + perPage);
  }, [filteredOrders, page, perPage]);

  useEffect(() => {
    setPage(1);
  }, [
    localSearchTerm,
    assemblyLineFilter,
    gmsoaFilter,
    partyFilter,
    dateFrom,
    dateTo,
    showUrgentOnly,
    showRemarksOnly,
    showOclAddedOnly
  ]);

  const truncateWords = (text = "", wordLimit = 4) => {
    const words = text.trim().split(/\s+/);
    if (words.length <= wordLimit) return text;
    return words.slice(0, wordLimit).join(" ") + "...";
  };

  // selection helpers
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
      return new Set(filteredOrders.map((o) => o.id));
    });
  };

  const allRowsSelected =
    filteredOrders.length > 0 && selectedRows.size === filteredOrders.length;

  // Quick Assign logic (local; you can replace with API calls as needed)
  // const handleQuickAssign = (order: AssemblyOrderData) => {
  //   setSelectedOrder(order);
  //   setQuickAssignOpen(true);
  //   // Match PlanningPage behavior: allow selecting any next step
  //   setQuickAssignStep('');
  //   setQuickAssignQty(String(order.qtyPending ?? order.qty ?? 0));
  //   setSplitOrder(false);
  //   setSplitAssignStep('');
  //   setSplitAssignQty('');
  //   setQuickAssignErrors({});
  // };

  // const validateQuickAssign = () => {
  //   const errs: { [k: string]: string } = {};
  //   const maxQty = Number(selectedOrder?.qtyPending ?? 0);
  //   const mainQty = Number(quickAssignQty || 0);
  //   const splitQty = Number(splitAssignQty || 0);

  //   if (!quickAssignQty || mainQty <= 0) errs.quickAssignQty = 'Quantity is required and must be > 0';
  //   if (mainQty > maxQty) errs.quickAssignQty = `Cannot exceed available (${maxQty})`;

  //   if (splitOrder) {
  //     if (!splitAssignStep) errs.splitAssignStep = 'Choose second step';
  //     if (!splitAssignQty || splitQty <= 0) errs.splitAssignQty = 'Split qty required';
  //     if (quickAssignStep && splitAssignStep && quickAssignStep === splitAssignStep) errs.sameEngineer = 'Choose different steps';
  //     const total = mainQty + splitQty;
  //     if (total !== maxQty) errs.totalQtyMismatch = `Split total must equal ${maxQty} (current ${total})`;
  //   }

  //   setQuickAssignErrors(errs);
  //   return Object.keys(errs).length === 0;
  // };
  // const currentStep = "dispatch";
  const currentStep = "dispatch"; // or derive from login role
  const nextSteps = getNextSteps(currentStep);

  console.log("Next step(s):", nextSteps.map(getStepLabel)); // → ["Semi QC"]
  console.log("Is final step?", isFinalStep(currentStep)); // → false

  const handleQuickAssign = (order: AssemblyOrderData) => {
    const currentStep = "dispatch"; // 👈 set dynamically based on page
    const nextSteps = getNextSteps(currentStep);

    setSelectedOrder(order);
    setQuickAssignOpen(true);

    // Pre-select first next step if available
    setQuickAssignStep(nextSteps[0] || "");
    setQuickAssignQty(String(order.qtyPending ?? order.qty ?? 0));

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
    // setAssignStatus(null);
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
  const selectedOrdersData = orders.filter((o) => selectedRows.has(o.id));
  const handleShowBinCard = () => setBinCardDialogOpen(true);
  // const handlePrintBinCard = () => window.print();

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
            <div class="meta-qty"><span class="label">QTY:</span> ${
              order.qty
            }</div>
            <div class="detail-items meta-qty detail-logo"><span class="label ">Logo:</span> ${
              order.gmLogo
            }</div>
             </div>
            <div class="detail-items"><span class="label ">Special Note:</span> <span>${
              order.specialNotes || ""
            }</span></div>
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

  const rowKey = (o: AssemblyOrderData) =>
    o.splittedCode || o.split_id
      ? o.splittedCode || o.split_id
      : [o.uniqueCode, o.soaSrNo, o.gmsoaNo, o.codeNo, o.assemblyLine]
          .map((v) => v ?? "")
          .join("|");

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

  const handleExport = () => {
    const isUrgentMode = showUrgentOnly === true;
    const isRemarksMode = showRemarksOnly === true;
    const hasSelection = selectedRows.size > 0;

    if (!isUrgentMode && !isRemarksMode && !hasSelection) {
      // alert(
      //   "Export is available only for Urgent or Remarks views. Use 'Export All' for the complete list."
      // );
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
    const allData = fullOrders && fullOrders.length > 0 ? fullOrders : orders;

    if (!allData || allData.length === 0) {
      alert("No data available to export");
      return;
    }

    exportToExcel(allData);
  };

  const exportToExcel = (data: AssemblyOrderData[]) => {
    const exportData = data.map((order, index) => ({
      No: index + 1,
      "Assembly Line": order.assemblyLine,
      "GMSOA No": order.gmsoaNo,
      "SOA Sr No": order.soaSrNo,
      "Assembly Date": order.assemblyDate,
      "Unique Code": order.uniqueCode,
      "Splitted Code": order.splittedCode || "-",
      Party: order.party,
      "Customer PO No": order.customerPoNo,
      "Code No": order.codeNo,
      Product: order.product,
      "PO Qty": order.poQty,
      Qty: order.qty,
      "Qty Executed": order.qtyExe,
      "Qty Pending": order.qtyPending,
      "Finished Valve": order.finishedValve,
      "GM Logo": order.gmLogo,
      "Name Plate": order.namePlate,
      "Special Notes": order.specialNotes || "",
      "Product Special 1": order.productSpcl1,
      "Product Special 2": order.productSpcl2,
      "Product Special 3": order.productSpcl3,
      Inspection: order.inspection,
      Painting: order.painting,
      Remarks: order.remarks || "",
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
    setRemarksText(getRemark(order.id) || order.remarks || "");
    setRemarksDialogOpen(true);
  };

  const handleSaveRemarks = () => {
    if (remarksOrder) {
      updateRemark(remarksOrder.id, remarksText);
      setRemarksDialogOpen(false);
      setRemarksOrder(null);
      setRemarksText("");
    }
  };

  // ✅ Marks urgent one-time only, persists after refresh
  const toggleAlertStatus = async (orderId: string) => {
    console.log("----");
    console.log("TOGGLE CALLED for:", orderId);

    try {
      const order = orders.find((o) => o.id === orderId);
      const currentStatus = order?.alertStatus === true;

      const newStatus = !currentStatus;
      const urgentValue = newStatus ? "1" : "0";

      console.log("CURRENT:", currentStatus, " → NEW:", newStatus);

      // 🔥 Optimistic UI update + SORTING FIX
      setOrders((prev) => {
        const updated = prev.map((o) =>
          o.id === orderId ? { ...o, alertStatus: newStatus } : o
        );

        // 🔥 Sort here: urgent (true) → non urgent (false)
        updated.sort((a, b) => {
          return (b.alertStatus === true) - (a.alertStatus === true);
        });

        return updated;
      });

      const payload = {
        orderId: String(orderId),
        urgent: urgentValue,
      };

      console.log("SENDING PAYLOAD:", payload);

      const res = await axios.post(`${API_URL}/mark-urgent`, payload, {
        headers: { Authorization: `Bearer ${token}` },
      });

      console.log("BACKEND RESPONSE:", res.data);

      const success =
        res.data?.Resp_code === "true" ||
        res.data?.Resp_code === true ||
        res.data?.status === true;

      if (!success) {
        console.log("BACKEND FAILED, REVERTING");

        // Revert + re-sort
        setOrders((prev) => {
          const reverted = prev.map((o) =>
            o.id === orderId ? { ...o, alertStatus: currentStatus } : o
          );

          reverted.sort((a, b) => {
            return (b.alertStatus === true) - (a.alertStatus === true);
          });

          return reverted;
        });

        return;
      }

      console.log("TOGGLE SUCCESSFUL 👍");
    } catch (err) {
      console.error("ERROR:", err);

      // revert on error + sort
      setOrders((prev) => {
        const reverted = prev.map((o) =>
          o.id === orderId ? { ...o, alertStatus: order?.alertStatus } : o
        );

        reverted.sort((a, b) => {
          return (b.alertStatus === true) - (a.alertStatus === true);
        });

        return reverted;
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

  // ✅ Assign order to next workflow stage
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

      const formData = new FormData();
      formData.append("orderId", String(selectedOrder.id));
      formData.append(
        "totalQty",
        String(selectedOrder.totalQty ?? selectedOrder.qty ?? 0)
      );
      formData.append("executedQty", String(mainQty));
      formData.append("split_id", String(selectedOrder.split_id || ""));

      console.log("📤 Assign main payload (FormData):", {
        orderId: selectedOrder.id,
        totalQty: selectedOrder.qty,
        executedQty: mainQty,
      });

      const responseMain = await axios.post(
        `${API_URL}/assign-order`,
        formData,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      console.log("✅ Main assign response:", responseMain.data);

      const isSuccess =
        responseMain.data?.Resp_code === true ||
        responseMain.data?.Resp_code === "true" ||
        responseMain.data?.status === true;

      if (isSuccess) {
        // --- Split assignment ---
        if (splitOrder && splitQty > 0) {
          const formDataSplit = new FormData();
          formDataSplit.append("orderId", String(selectedOrder.id));
          formDataSplit.append(
            "totalQty",
            String(selectedOrder.totalQty ?? selectedOrder.qty ?? 0)
          );
          formDataSplit.append("executedQty", String(splitQty));
          formDataSplit.append(
            "split_id",
            String(selectedOrder.split_id || "")
          );
          formDataSplit.append("splitOrder", "true");

          const responseSplit = await axios.post(
            `${API_URL}/assign-order`,
            formDataSplit,
            {
              headers: { Authorization: `Bearer ${token}` },
            }
          );

          const isSplitSuccess =
            responseSplit.data?.Resp_code === true ||
            responseSplit.data?.Resp_code === "true" ||
            responseSplit.data?.status === true;

          if (isSplitSuccess) {
            const currentStep = "dispatch";
            const defaultNext = getNextSteps(currentStep)[0] || "";
            const nextMainLabel = getStepLabel(
              quickAssignStep || defaultNext || ""
            );
            const nextSplitLabel = getStepLabel(
              splitAssignStep || defaultNext || ""
            );
            const msg =
              `✔ Assigned ${mainQty} → ${nextMainLabel || "next stage"}` +
              `\n✔ Split ${splitQty} → ${nextSplitLabel || "next stage"}`;
            setAssignStatus({ type: "success", message: msg });
          } else {
            setAssignStatus({
              type: "error",
              message: `⚠️ Main assigned, but split failed: ${
                responseSplit.data?.Resp_desc || "Unknown error"
              }`,
            });
          }
        } else {
          const currentStep = "dispatch";
          const defaultNext = getNextSteps(currentStep)[0] || "";
          const nextMainLabel = getStepLabel(
            quickAssignStep || defaultNext || ""
          );
          const msg = `✔ Assigned ${mainQty} → ${
            nextMainLabel || "next stage"
          }`;
          setAssignStatus({ type: "success", message: msg });
        }

        const makeKey = (o: AssemblyOrderData) =>
          o.splittedCode || o.split_id
            ? o.splittedCode || o.split_id
            : [o.uniqueCode, o.soaSrNo, o.gmsoaNo, o.codeNo, o.assemblyLine]
                .map((v) => v ?? "")
                .join("|");
        const selectedKey = makeKey(selectedOrder);

        setOrders((prev) => prev.filter((o) => makeKey(o) !== selectedKey));
        setSelectedRows((prev) => {
          const copy = new Set(prev);
          copy.delete(selectedKey);
          return copy;
        });

        setQuickAssignOpen(false);
        // setAssignStatus(null);
      } else {
        setAssignStatus({
          type: "error",
          message: `⚠️ ${
            responseMain.data?.Resp_desc || "Order assignment failed."
          }`,
        });
      }
    } catch (error: any) {
      console.error("❌ Error assigning order:", error);

      if (error.response) {
        const msg =
          error.response.data?.message ||
          error.response.data?.Resp_desc ||
          "Validation failed.";

        const detailed =
          error.response.data?.errors &&
          Object.entries(error.response.data.errors)
            .map(([field, messages]: [string, any]) => `${field}: ${messages}`)
            .join("\n");

        setAssignStatus({
          type: "error",
          message: `❌ ${msg}\n${detailed || ""}`,
        });
      } else if (error.request) {
        setAssignStatus({
          type: "error",
          message: "❌ No response from server. Please check your connection.",
        });
      } else {
        setAssignStatus({
          type: "error",
          message: `❌ ${error.message}`,
        });
      }
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
          <div className="flex flex-wrap flex-col lg:flex-row lg:justify-between lg:items-start gap-4">
            <div className="flex-row-main">
              <h1 className="text-gray-900 mb-2 text-2xl font-semibold">
                Dispatch
              </h1>
              <p className="text-sm text-gray-600">
                Track and manage assembly line orders and manufacturing workflow
              </p>
            </div>

            <div className="flex flex-col gap-4 w-full">
              <div className="flex flex-col sm:flex-row gap-4 lg:items-center justify-end flex-inner-wrapper">
                <div className="flex items-center gap-4 flex-inner-wrapper">
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
                <Button
                  variant="outline"
                  s
                  // disabled={filteredOrders.length === 0}
                  onClick={handleExport}
                  className="flex items-center gap-0 border-[#174a9f] text-[#174a9f] hover:bg-[#e8f0f9] transition-all shadow-sm"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Export Data
                </Button>

                <Button
                  variant="outline"
                  onClick={handleExportAll}
                  className="flex items-center gap-0 border-[#174a9f] text-[#174a9f] hover:bg-[#e8f0f9] transition-all shadow-sm"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Export all Data
                </Button>
                <Button
                  variant="outline"
                  className="flex items-center gap-0 border-[#174a9f] text-[#174a9f] hover:bg-[#e8f0f9] transition-all shadow-sm"
                  onClick={() => navigate("/packaging")}
                >
                  Completed Projects
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowOclAddedOnly(true);
                    setShowUrgentOnly(false);
                    setShowRemarksOnly(false);
                  }}
                  className="flex items-center gap-0 border-[#174a9f] text-[#174a9f] hover:bg-[#e8f0f9] transition-all shadow-sm"
                >
                  OCL Only
                </Button>
              </div>
              {/* Option row - could include more buttons */}
            </div>
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
            style={{
              maxHeight: "80vh", // ✅ TABLE HEIGHT
              overflowY: "auto", // ✅ VERTICAL SCROLL
              scrollbarGutter: "stable",
            }}
          >
            <div className="inline-block min-w-full align-middle">
              {loading && orders.length === 0 ? (
                <div className="p-10 text-center text-gray-600 ctm-load">
                  Loading...
                </div>
              ) : (
                <>
                  <table className="min-w-full border-collapse">
                    <thead className="table-head sticky top-16 z-30 bg-white">
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
                                allRowsSelected
                                  ? "bg-blue-600"
                                  : "bg-white border"
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
                              prev === "asc"
                                ? "desc"
                                : prev === "desc"
                                ? null
                                : "asc"
                            )
                          }
                        >
                          Sr.No.
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
                        <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200 w-80">
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
                        <tr
                          key={[
                            order.id,
                            order.splittedCode || order.split_id,
                            order.uniqueCode,
                            order.soaSrNo,
                          ].join("-")}
                          className="group hover:bg-gray-50"
                        >
                          <td className="sticky left-0 z-10 bg-white group-hover:bg-gray-50 px-3 py-2 text-center border-r border-gray-200 w-12">
                            <Checkbox
                              checked={selectedRows.has(order.id)}
                              onCheckedChange={() =>
                                toggleRowSelection(order.id)
                              }
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
                            <div style={{ width: "120px" }} title={order.party}>
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
                              title={order.product}
                            >
                              {order.product}
                            </div>
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
                            <div className="line-clamp-2">
                              {order.productSpcl3}
                            </div>
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
                                    order.remarks?.trim()
                                      ? "text-white"
                                      : "text-blue-600"
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

                              {/* <Button
                            size="sm"
                            variant="ghost"
                            className={`h-7 w-7 p-0 transition-all duration-200 ${getAlertStatus(order.id) || order.alertStatus ? 'bg-red-100 hover:bg-red-200 shadow-sm border border-red-200' : 'hover:bg-red-50'}`}
                            title={getAlertStatus(order.id) || order.alertStatus ? 'Alert ON - Click to turn OFF' : 'Alert OFF - Click to turn ON'}
                            onClick={() => { if (!getAlertStatus(order.id)) toggleAlertStatus(order.id); }} disabled={getAlertStatus(order.id)}
                          >
                            <Siren className={`h-4 w-4 ${getAlertStatus(order.id) || order.alertStatus ? 'text-red-600 animate-siren-pulse' : 'text-gray-400'}`} />
                          </Button> */}
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

                              <div
                                onClick={(e) => e.stopPropagation()} // ✅ IMPORTANT
                                className="flex items-center gap-2"
                              >
                                <Checkbox
                                  checked={order.packaging === 1}
                                  disabled={order.packaging === 1}
                                  onCheckedChange={(checked) => {
                                    handlePackagingCheckbox(
                                      Boolean(checked),
                                      order
                                    );
                                  }}
                                  title="Toggle Packaging"
                                />

                                {showPackagingPopup && (
                                  <Dialog
                                    open={showPackagingPopup}
                                    onOpenChange={setShowPackagingPopup}
                                  >
                                    <DialogContent className="max-w-[400px]">
                                      <DialogHeader>
                                        <DialogTitle>
                                          Moved to Packaging
                                        </DialogTitle>
                                        <DialogDescription></DialogDescription>
                                      </DialogHeader>
                                    </DialogContent>
                                  </Dialog>
                                )}

                                {order.packaging === 1 && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleOpenOclPopup(order)}
                                  >
                                    OCL
                                  </Button>
                                )}
                              </div>
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
                </>
              )}
            </div>
          </div>
        </div>

        {selectedTotals.count > 0 && (
          <div className="border-t bg-gray-50 px-6 py-3 flex flex-wrap gap-6 justify-end text-sm font-semibold">
            <div>
              Selected Rows:{" "}
              <span className="text-blue-700">{selectedTotals.count}</span>
            </div>
            <div>
              Total Qty:{" "}
              <span className="text-gray-900">{selectedTotals.qty}</span>
            </div>
            <div>
              Qty Executed:{" "}
              <span className="text-green-700">{selectedTotals.qtyExe}</span>
            </div>
            <div>
              Qty Pending:{" "}
              <span className="text-red-600">{selectedTotals.qtyPending}</span>
            </div>
          </div>
        )}

        <TablePagination
          page={page}
          perPage={perPage}
          total={filteredOrders.length}
          lastPage={Math.max(
            1,
            Math.ceil(filteredOrders.length / Math.max(perPage, 1))
          )}
          onChangePage={setPage}
          onChangePerPage={setPerPage}
          disabled={loading}
        />

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
                    Plot no. 2732-33, Road No. 1-1, Kranti Gate, G.I.D.C.
                    Lodhika, Village Metoda, Dist. Rajkot-360 021
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
                        {String(order.gmsoaNo).replace(/^SOA/i, "")}-
                        {order.soaSrNo}
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
                  <div className="mt-4 text-sm flex gap-2 items-center">
                    <span className="font-semibold">Party:</span>
                    <div className="mt-1">{order.party}</div>
                  </div>

                  {/* ITEM */}
                  <div className="mt-4 text-sm flex gap-2 items-start">
                    <span className="font-semibold">Item:</span>
                    <div className="mt-1 leading-snug">{order.product}</div>
                  </div>

                  {/* QTY & LOGO */}
                  <div className="mt-4 flex justify-between text-sm">
                    <div>
                      <span className="font-semibold">QTY:</span> {order.qty}
                    </div>
                    <div>
                      <span className="font-semibold">Logo:</span>{" "}
                      {order.gmLogo}
                    </div>
                  </div>

                  {/* SPECIAL NOTE */}
                  <div className="mt-4 text-sm flex gap-2 items-center">
                    <span className="font-semibold">Special Note:</span>
                    <div className="mt-1 h-5">{order.specialNotes || ""}</div>
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
              <Button
                variant="outline"
                onClick={() => setBinCardDialogOpen(false)}
              >
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

        <Dialog
          open={packagingDialogOpen}
          onOpenChange={setPackagingDialogOpen}
        >
          <DialogContent className="max-w-[400px]">
            <DialogHeader>
              <DialogTitle>Move to Packaging</DialogTitle>
              <DialogDescription>
                Enter OCL Number to continue
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <Label>OCL Number</Label>
              <Input
                value={oclNo}
                onChange={(e) => setOclNo(e.target.value)}
                placeholder="Enter OCL No"
              />
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button variant="outline" onClick={handleCancelPackagingPopup}>
                Cancel
              </Button>

              <Button
                onClick={handleConfirmPackaging}
                disabled={isSubmittingPackaging}
              >
                {isSubmittingPackaging ? "Processing..." : "Confirm"}
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
                      <Label className="text-gray-500 text-sm">Sr. No.</Label>
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
                      <p className="text-gray-900 mt-1">
                        {viewedOrder.totalQty}
                      </p>
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

export default DispatchPage;
