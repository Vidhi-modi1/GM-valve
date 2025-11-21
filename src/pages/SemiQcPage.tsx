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

import {
  getNextSteps,
  getStepLabel,
  isFinalStep,
} from "../config/workflowSteps";
import { DashboardHeader } from "../components/dashboard-header.tsx";

// const API_URL = 'http://192.168.1.17:2010/api';

interface AssemblyOrderData {
  id: string;
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
}

export function SemiQcPage() {
  // context for remarks & alert status (from your existing order-context)
  const {
    updateRemark,
    toggleAlertStatus: toggleAlertStatusContext,
    getRemark,
    getAlertStatus,
  } = useOrderContext();

  // API data + UI state
  const [orders, setOrders] = useState<AssemblyOrderData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // search / selection / filters / dialogs etc.
  const [localSearchTerm, setLocalSearchTerm] = useState("");
  const [showUrgentOnly, setShowUrgentOnly] = useState(false);
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

  const normalize = (s: string) =>
  s?.trim().toLowerCase().replace(/\s+/g, "-");

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
      const currentStage = "semi-qc";
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
      const payload = { menu_name: stageLabel };

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
      const apiOrders: AssemblyOrderData[] = res.data.data.map((item: any) => ({
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
  qty: Number(item.qty || 0),
  qtyExe: Number(item.qty_executed || 0),
  qtyPending: Number(item.qty_pending || 0),
  finishedValve: item.finished_valve || "",
  gmLogo: item.gm_logo || "",
  namePlate: item.name_plate || "",
  productSpcl1: item.product_spc1 || "",
  productSpcl2: item.product_spc2 || "",
  productSpcl3: item.product_spc3 || "",
  inspection: item.inspection || "",
  painting: item.painting || "",
  remarks: item.remarks || "",

  // ⭐ ADD THIS
  currentStage: "Semi QC",   // 🔥 100% correct for Semi QC page


  alertStatus:
    item.is_urgent === true ||
    item.is_urgent === "true" ||
    item.alert_status === true ||
    item.alert_status === "true" ||
    item.urgent === 1 ||
    item.urgent === "1",
}));


        console.log("✅ Orders fetched:", apiOrders.length, "records");
         setOrders(sortOrders(apiOrders));
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

  useEffect(() => {
    fetchOrders();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

  // Filter logic (search, assembly/pso filters, date, urgent)
  const filteredOrders = useMemo(() => {
    let filtered = orders.slice();
    filtered = filtered.filter((o) => normalize(o.currentStage) === "semi-qc");

    if (showUrgentOnly) {
      filtered = filtered.filter(
        (o) => getAlertStatus(String(o.id)) || o.alertStatus
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

    const seen = new Set<string>();
    filtered = filtered.filter((o) => {
      if (seen.has(o.id)) return false;
      seen.add(o.id);
      return true;
    });

    return filtered;
  }, [
    orders,
    localSearchTerm,
    showUrgentOnly,
    assemblyLineFilter,
    gmsoaFilter,
    partyFilter,
    dateFilterMode,
    dateFrom,
    dateTo,
    getAlertStatus,
  ]);

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

  
  const currentStep = "semi-qc"; // or derive from login role
  const nextSteps = getNextSteps(currentStep);

  console.log("Next step(s):", nextSteps.map(getStepLabel)); // → ["Semi QC"]
  console.log("Is final step?", isFinalStep(currentStep)); // → false

  const handleQuickAssign = (order: AssemblyOrderData) => {
    const currentStep = "semi-qc"; // 👈 set dynamically based on page
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
    setQuickAssignOpen(false);
  };

  // Bin Card / Print
  const selectedOrdersData = orders.filter((o) => selectedRows.has(o.id));
  const handleShowBinCard = () => setBinCardDialogOpen(true);
  const handlePrintBinCard = () => {
    const cards = selectedOrdersData
      .map(
        (order) => `
      <div style="border:1px solid #ccc; padding:20px; border-radius:10px; margin-bottom:30px; page-break-inside: avoid;">
        <h2 style="text-align:center; font-size:20px; font-weight:bold; margin-bottom:15px;">Assembly Line: ${order.assemblyLine}</h2>
        <div style="display:flex; justify-content:space-between; margin-bottom:10px;">
          <div><strong>Assembly Date:</strong> ${order.assemblyDate}</div>
          <div><strong>GMSOA No - SR. NO:</strong> ${order.gmsoaNo} - ${order.soaSrNo}</div>
        </div>
        <div style="margin-bottom:15px;"><strong>Item Description:</strong><br><span style="font-size:12px; line-height:1.4;">${order.product}</span></div>
        <div style="display:flex; justify-content:space-between; margin-bottom:15px;">
          <div><strong>QTY:</strong> ${order.qty}</div>
          <div><strong>GM Logo:</strong> ${order.gmLogo}</div>
        </div>
        <div style="margin-top:20px; border-top:1px solid #aaa; padding-top:15px;">
          <strong>Inspected by:</strong>
          <div style="height:30px; border-bottom:1px solid #555;"></div>
        </div>
      </div>`
      )
      .join("");

    const html = `<!doctype html>
    <html>
      <head>
        <meta charset="utf-8" />
        <title></title>
        <style>
          @page { margin: 12mm; }
          html, body { padding: 0; margin: 0; }
          body { font-family: Arial, sans-serif; }
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
      setTimeout(() => {
        document.body.removeChild(iframe);
      }, 500);
    }, 200);
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
      res.data?.Resp_code === "true" ||
      res.data?.Resp_code === true;

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

    // Determine next step key + readable label
    const nextStepKey =
      quickAssignStep ||
      (Array.isArray(nextSteps) ? nextSteps[0] : "semi-qc");

    const nextStepLabel = getStepLabel(nextStepKey);

    const formData = new FormData();
    formData.append("orderId", String(selectedOrder.id));
    formData.append("totalQty", String(selectedOrder.qty));
    formData.append("executedQty", String(mainQty));
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

    if (splitOrder && splitQty > 0) {
      const formDataSplit = new FormData();
      formDataSplit.append("orderId", String(selectedOrder.id));
      formDataSplit.append("totalQty", String(selectedOrder.qty));
      formDataSplit.append("executedQty", String(splitQty));
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

    await fetchOrders();

      setQuickAssignOpen(false);
      setAssignStatus(null);


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
      setIsAssigning(false);
    } 
  }

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
          <div className="flex flex-col lg:flex-row lg:justify-between lg:items-start gap-6">
            <div>
              <h1 className="text-gray-900 mb-2 text-2xl font-semibold">
                Semi QC
              </h1>
              <p className="text-gray-600">
                Track and manage assembly line orders and manufacturing workflow
              </p>
            </div>

            <div className="flex flex-col gap-4 w-full">
              <div className="flex flex-col sm:flex-row gap-4 lg:items-center justify-end">
                {/* Search */}
                <div className="relative max-input">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 z-10 pointer-events-none text-gray-400" />
                  <Input
                    type="text"
                    placeholder="Search by Unique Code, GMSOA NO, Party ,Customer PO No,Code No.,Product..."
                    value={localSearchTerm}
                    onChange={(e) => setLocalSearchTerm(e.target.value)}
                    className="pl-10 w-full sm:w-80 bg-white/80 backdrop-blur-sm border-gray-200/60 relative z-0"
                  />
                </div>

                <div className="flex items-center gap-3">
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
                </div>
              </div>
              {/* Option row - could include more buttons */}
            </div>
          </div>

          {/* Filters */}
          <div className="mt-4">
            <OrderFilters
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

        {/* Table */}
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
          <div
            ref={tableScrollRef}
            className="relative overflow-x-auto max-w-full"
            style={{ scrollbarGutter: "stable" }}
          >
            <div className="inline-block min-w-full align-middle">
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

                    <th className="sticky left-10 z-20 bg-white px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200 min-w-32">
                      Assembly Line
                    </th>
                    <th className="sticky left-164 z-20 bg-white px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200 min-w-28">
                      GMSOA NO.
                    </th>
                    <th className="sticky left-274 z-20 bg-white px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200 min-w-24">
                      SOA Sr. No.
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
                    <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200">
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
                  {filteredOrders.map((order) => (
                    <tr key={order.id} className="group hover:bg-gray-50">
                      <td className="sticky left-0 z-10 bg-white group-hover:bg-gray-50 px-3 py-2 text-center border-r border-gray-200 w-12">
                        <Checkbox
                          checked={selectedRows.has(order.id)}
                          onCheckedChange={() => toggleRowSelection(order.id)}
                          aria-label={`Select row ${order.id}`}
                        />
                      </td>

                      <td className="sticky left-10 z-10 bg-white group-hover:bg-gray-50 px-3 py-2 whitespace-nowrap text-center border-r border-gray-200 min-w-32">
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
                      <td className="px-3 py-2 whitespace-nowrap text-center text-sm text-gray-900 max-w-xs truncate">
                        {order.party}
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap text-center text-sm text-gray-900">
                        {order.customerPoNo}
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap text-center text-sm text-gray-900">
                        {order.codeNo}
                      </td>

                      <td className="px-3 py-2 text-center text-sm text-gray-900 w-80">
                        <div className="line-clamp-2">{order.product}</div>
                      </td>

                      <td className="px-3 py-2 whitespace-nowrap text-center text-sm text-gray-900">
                        {order.qty}
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
                       <Button
  size="sm"
  variant="ghost"
  className={`h-7 w-7 p-0 ${
    (order.remarks && order.remarks.trim() !== "") // backend value
      ? "bg-[#174a9f] hover:bg-[#123a7f]"
      : "hover:bg-[#d1e2f3]"
  }`}
  title="Add/Edit Remarks"
  onClick={() => handleOpenRemarks(order)}
>
  <MessageSquarePlus
    className={`h-4 w-4 ${
      (order.remarks && order.remarks.trim() !== "")
        ? "text-white"
        : "text-blue-600"
    }`}
  />
</Button>

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
          </div>
        </div>

        {/* Quick Assign Dialog */}
        <Dialog open={quickAssignOpen} onOpenChange={setQuickAssignOpen}>
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
                      <SelectTrigger id="assignStep" disabled>
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
                      onChange={(e) => setQuickAssignQty(e.target.value)}
                      max={selectedOrder?.qtyPending}
                      disabled
                    />
                  </div>
                </div>

                <div className="text-sm text-gray-500">
                  Available Quantity:{" "}
                  <span className="font-medium text-gray-900">
                    {selectedOrder?.qtyPending}
                  </span>
                </div>
              </div>

              {/* Split Order Section (same as PlanningPage) */}
              {/* <div className="space-y-4 border-t pt-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="splitOrder"
                  checked={splitOrder}
                  onCheckedChange={(val) => setSplitOrder(Boolean(val))}
                />
                <Label htmlFor="splitOrder" className="cursor-pointer">
                  Split order to multiple workflow steps
                </Label>
              </div>

              {splitOrder && (
                <div className="space-y-4 pl-6 border-l-2 border-blue-200">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Second Workflow Step</Label>
                      <Select value={splitAssignStep} onValueChange={setSplitAssignStep}>
  <SelectTrigger>
    <SelectValue placeholder="Select split step" />
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
                      <Label>Split Quantity</Label>
                      <Input
                        type="number"
                        value={splitAssignQty}
                        onChange={(e) => setSplitAssignQty(e.target.value)}
                        max={selectedOrder?.qtyPending}
                      />
                    </div>
                  </div>

                  {quickAssignErrors.sameEngineer && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                      <p className="text-sm text-red-600">{quickAssignErrors.sameEngineer}</p>
                    </div>
                  )}

                  {quickAssignErrors.totalQtyMismatch && (
                    <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                      <p className="text-sm text-amber-700">{quickAssignErrors.totalQtyMismatch}</p>
                    </div>
                  )}
                </div>
              )}
            </div> */}
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
              <Button variant="outline" onClick={handleQuickAssignCancel}>
                Cancel
              </Button>
              <Button
                onClick={handleAssignOrder}
                disabled={isAssigning}
                className="bg-black hover:bg-gray-800 text-white"
              >
                {isAssigning ? "Assigning..." : "Assign"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Bin Card Dialog */}
        <Dialog open={binCardDialogOpen} onOpenChange={setBinCardDialogOpen}>
          <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Bin Card - Selected Orders</DialogTitle>
              <DialogDescription>
                Review selected orders and print bin card
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6 py-4">
              {selectedOrdersData.map((order) => (
                <div
                  key={order.id}
                  className="border border-gray-200 rounded-lg p-6 space-y-4 bg-white"
                >
                  <div className="text-center pb-2 border-b border-gray-200">
                    <p className="text-lg">
                      <span className="text-gray-600">Assembly Line:</span>{" "}
                      <span className="text-gray-900 font-bold text-xl">
                        {order.assemblyLine}
                      </span>
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-gray-500 text-sm">
                        Assembly Date
                      </Label>
                      <p className="text-gray-900 mt-1">{order.assemblyDate}</p>
                    </div>
                    <div>
                      <Label className="text-gray-500 text-sm">
                        GMSOA No - SR. NO.
                      </Label>
                      <p className="text-gray-900 mt-1">
                        {order.gmsoaNo} - {order.soaSrNo}
                      </p>
                    </div>
                  </div>

                  <div>
                    <Label className="text-gray-500 text-sm">
                      Item Description
                    </Label>
                    <p className="text-gray-900 mt-1">{order.product}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-gray-500 text-sm">QTY</Label>
                      <p className="text-gray-900 mt-1">{order.qty}</p>
                    </div>
                    <div>
                      <Label className="text-gray-500 text-sm">GM Logo</Label>
                      <p className="text-gray-900 mt-1">{order.gmLogo}</p>
                    </div>
                  </div>

                  <div className="pt-4 mt-4 border-t border-gray-200">
                    <div className="flex items-center gap-3">
                      <Label className="text-gray-500 text-sm whitespace-nowrap">
                        Inspected by:
                      </Label>
                      <div className="border-b border-gray-400 flex-1 h-8"></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-end space-x-3 pt-4 border-t border-gray-100">
              <Button
                variant="outline"
                onClick={() => setBinCardDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={handlePrintBinCard}
                className="bg-blue-600 text-white"
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
                      <Label className="text-gray-500 text-sm">GMSOA No.</Label>
                      <p className="text-gray-900 mt-1">
                        {viewedOrder.gmsoaNo}
                      </p>
                    </div>
                    <div>
                      <Label className="text-gray-500 text-sm">
                        SOA Sr. No.
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
                        {viewedOrder.splittedCode || "N/A"}
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
                      <p className="text-gray-900 mt-1">{viewedOrder.qty}</p>
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
                        {viewedOrder.finishedValve}
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
                        {viewedOrder.productSpcl1 || "N/A"}
                      </p>
                    </div>
                    <div>
                      <Label className="text-gray-500 text-sm">
                        Product SPCL2
                      </Label>
                      <p className="text-gray-900 mt-1">
                        {viewedOrder.productSpcl2 || "N/A"}
                      </p>
                    </div>
                    <div className="col-span-2">
                      <Label className="text-gray-500 text-sm">
                        Product SPCL3
                      </Label>
                      <p className="text-gray-900 mt-1">
                        {viewedOrder.productSpcl3 || "N/A"}
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

export default SemiQcPage;
