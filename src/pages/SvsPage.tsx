// src/pages/SvsPage.tsx - PART 1 OF 2
import React, { useState, useRef, useEffect, useMemo } from 'react';
import axios from 'axios';
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
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../components/ui/dialog';
import { Textarea } from '../components/ui/textarea';
import { Label } from '../components/ui/label';
import { Input } from '../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Checkbox } from '../components/ui/checkbox';
import { useOrderContext } from '../components/order-context';
import { OrderFilters } from '../components/order-filters';
import { API_URL } from '../config/api.ts';
import { getNextSteps, getStepLabel } from "../config/workflowSteps";
import { DashboardHeader } from "../components/dashboard-header.tsx";
import TablePagination from "../components/table-pagination";

import { useNavigate } from "react-router-dom";

  import * as XLSX from "xlsx";
  import { saveAs } from "file-saver";

interface AssemblyOrderData {
  id: string;
     specialNotes: string;
  assemblyLine: string;
  gmsoaNo: string;
  soaSrNo: string;
  assemblyDate: string;
  uniqueCode: string;
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

export function SvsPage() {
  const {
    updateRemark,
    toggleAlertStatus: toggleAlertStatusContext,
    getRemark,
    getAlertStatus
  } = useOrderContext();

  const navigate = useNavigate();

  const [orders, setOrders] = useState<AssemblyOrderData[]>([]);
     const [fullOrders, setFullOrders] = useState<AssemblyOrderData[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState<number>(1);
  const [perPage, setPerPage] = useState<number>(20);

    const [soaSort, setSoaSort] = useState<"asc" | "desc" | null>(null);

  const [localSearchTerm, setLocalSearchTerm] = useState('');
  const [showUrgentOnly, setShowUrgentOnly] = useState(false);
  const [showRemarksOnly, setShowRemarksOnly] = useState(false);
  const [assemblyLineFilter, setAssemblyLineFilter] = useState('all');
  const [gmsoaFilter, setGmsoaFilter] = useState('all');
  const [partyFilter, setPartyFilter] = useState('all');
  const [dateFilterMode, setDateFilterMode] = useState<'year' | 'month' | 'range'>('range');
  const [dateFrom, setDateFrom] = useState<Date | undefined>(undefined);
  const [dateTo, setDateTo] = useState<Date | undefined>(undefined);

  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());
  const [quickAssignOpen, setQuickAssignOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<AssemblyOrderData | null>(null);
  const [quickAssignStep, setQuickAssignStep] = useState('');
  const [quickAssignQty, setQuickAssignQty] = useState('');
  const [splitOrder, setSplitOrder] = useState(false);
  const [splitAssignStep, setSplitAssignStep] = useState('');
  const [splitAssignQty, setSplitAssignQty] = useState('');
  const [quickAssignErrors, setQuickAssignErrors] = useState<{ [k: string]: string }>({});

  const [binCardDialogOpen, setBinCardDialogOpen] = useState(false);
  const [viewDetailsDialogOpen, setViewDetailsDialogOpen] = useState(false);
  const [viewedOrder, setViewedOrder] = useState<AssemblyOrderData | null>(null);

  const [remarksDialogOpen, setRemarksDialogOpen] = useState(false);
  const [remarksOrder, setRemarksOrder] = useState<AssemblyOrderData | null>(null);
  const [remarksText, setRemarksText] = useState('');

  const [message, setMessage] = useState<string | null>(null);
  const [assignStatus, setAssignStatus] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);

  const tableScrollRef = useRef<HTMLDivElement | null>(null);

  const [inventoryOpen, setInventoryOpen] = useState(false);


  const token = localStorage.getItem('token');
  // role helper
  const getCurrentUserRole = () => {
    try {
      const s = localStorage.getItem('user');
      if (!s) return '';
      const u = JSON.parse(s);
      const raw = typeof u.role === 'object' ? u.role?.name : u.role;
      return String(raw || '').toLowerCase();
    } catch {
      return '';
    }
  };
  const isAdmin = getCurrentUserRole().includes('admin');

  const fetchOrders = async () => {
    try {
      setLoading(true);
      setError(null);

      const currentStage = 'svs';
      const stageLabel = getStepLabel(currentStage);
      const payload = { menu_name: stageLabel };

      const res = await axios.post(
        `${API_URL}/order-list`,
        payload,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      const ok =
        res?.data?.Resp_code === 'true' ||
        res?.data?.Resp_code === true ||
        res?.data?.Resp_code === 'RCS';

      if (ok && Array.isArray(res.data.data)) {
        const apiOrders: AssemblyOrderData[] = res.data.data.map((item: any) => ({
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
          finishedValve: item.finished_valve || '',
          gmLogo: item.gm_logo || '',
          namePlate: item.name_plate || '',
          specialNotes: item.special_notes || '',
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
        }));

        // 🔍 DEBUG: check finished valve coming from backend
console.log(
  "SVS orders raw:",
  apiOrders.map(o => ({
    id: o.id,
    finishedValve: o.finishedValve
  }))
);


        const finishedValveOrders = apiOrders.filter(
          (o) => String(o.finishedValve).trim().toLowerCase() === 'yes'
        );

        console.log('✅ SVS Orders fetched:', finishedValveOrders.length, 'records');
        setOrders(finishedValveOrders);
        setFullOrders(apiOrders);
        setError(null);
        setMessage(null);
      } else {
        console.warn('⚠️ No valid order data received', res.data);
        setOrders([]);
        setError(res?.data?.Resp_desc || 'Failed to fetch orders');
      }

    } catch (err: any) {
      console.error('Error fetching orders:', err);
      setError('Error fetching order list. Please check your token or server.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const assemblyLines = useMemo(() => Array.from(new Set(orders.map((o) => o.assemblyLine))).filter(Boolean).sort(), [orders]);
  const gmsoaNos = useMemo(() => Array.from(new Set(orders.map((o) => o.gmsoaNo))).filter(Boolean).sort(), [orders]);
  const parties = useMemo(() => Array.from(new Set(orders.map((o) => o.party))).filter(Boolean).sort(), [orders]);

  const filteredOrders = useMemo(() => {
    let filtered = orders.slice();

    if (showUrgentOnly) {
      filtered = filtered.filter((o) => getAlertStatus(String(o.id)) || o.alertStatus);
    }

    
      if (showRemarksOnly) {
      filtered = filtered.filter(
        (o) => typeof o.remarks === "string" && o.remarks.trim().length > 0
      );
    }

    if (assemblyLineFilter !== 'all') filtered = filtered.filter((o) => o.assemblyLine === assemblyLineFilter);
    if (gmsoaFilter !== 'all') filtered = filtered.filter((o) => o.gmsoaNo === gmsoaFilter);
    if (partyFilter !== 'all') filtered = filtered.filter((o) => o.party === partyFilter);

    if (dateFrom || dateTo) {
      filtered = filtered.filter((order) => {
        if (!order.assemblyDate || order.assemblyDate === 'HOLD') return false;

        const partsRaw = order.assemblyDate.split(/[\/-]/).map((p) => p.trim());
        const partsNum = partsRaw.map((p) => Number(p));
        if (partsNum.some((n) => isNaN(n))) return false;

        let orderDate: Date | null = null;

        if (partsNum.length >= 3) {
          const [d, m, y] = partsNum;
          orderDate = new Date(y, m - 1, d);
        } else if (partsNum.length === 2) {
          const [m, y] = partsNum;
          orderDate = new Date(y, m - 1, 1);
        } else if (partsNum.length === 1) {
          const [y] = partsNum;
          orderDate = new Date(y, 0, 1);
        } else {
          return false;
        }

        if (!orderDate || isNaN(orderDate.getTime())) return false;

        if (dateFilterMode === 'year' && dateFrom) {
          return orderDate.getFullYear() === dateFrom.getFullYear();
        }
        if (dateFilterMode === 'month' && dateFrom) {
          return orderDate.getFullYear() === dateFrom.getFullYear() && orderDate.getMonth() === dateFrom.getMonth();
        }
        if (dateFilterMode === 'range') {
          if (dateFrom && dateTo) return orderDate >= dateFrom && orderDate <= dateTo;
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
    showRemarksOnly,
    showUrgentOnly,
    assemblyLineFilter,
    gmsoaFilter,
    partyFilter,
    dateFilterMode,
    dateFrom,
    dateTo,
    getAlertStatus,
  ]);

  const paginatedOrders = useMemo(() => {
    const start = (page - 1) * perPage;
    return filteredOrders.slice(start, start + perPage);
  }, [filteredOrders, page, perPage]);

  useEffect(() => {
    setPage(1);
  }, [localSearchTerm, assemblyLineFilter, gmsoaFilter, partyFilter, dateFrom, dateTo, showUrgentOnly ,showRemarksOnly]);

  const toggleRowSelection = (orderId: string) => {
    setSelectedRows((prev) => {
      const copy = new Set(prev);
      if (copy.has(orderId)) copy.delete(orderId);
      else copy.add(orderId);
      return copy;
    });
  };

     const truncateWords = (text = "", wordLimit = 4) => {
  const words = text.trim().split(/\s+/);
  if (words.length <= wordLimit) return text;
  return words.slice(0, wordLimit).join(" ") + "...";
};

  const toggleSelectAll = () => {
    setSelectedRows((prev) => {
      if (prev.size === filteredOrders.length) return new Set();
      return new Set(filteredOrders.map((o) => o.id));
    });
  };

  const allRowsSelected = filteredOrders.length > 0 && selectedRows.size === filteredOrders.length;

  const handleQuickAssign = (order: AssemblyOrderData) => {
    setSelectedOrder(order);
    setQuickAssignOpen(true);
    // SVS can only move to Marking 1
    setQuickAssignStep('marking1');
    setQuickAssignQty(String(order.qtyPending ?? order.qty ?? 0));
    setSplitOrder(false);
    setSplitAssignStep('');
    setSplitAssignQty('');
    setQuickAssignErrors({});
  };

  const validateQuickAssign = () => {
    const errs: { [k: string]: string } = {};
    const maxQty = Number(selectedOrder?.qtyPending ?? 0);
    const mainQty = Number(quickAssignQty || 0);
    const splitQty = Number(splitAssignQty || 0);

    if (!quickAssignQty || mainQty <= 0) errs.quickAssignQty = 'Quantity is required and must be > 0';
    if (mainQty > maxQty) errs.quickAssignQty = `Cannot exceed available (${maxQty})`;

    if (splitOrder) {
      if (!splitAssignStep) errs.splitAssignStep = 'Choose second step';
      if (!splitAssignQty || splitQty <= 0) errs.splitAssignQty = 'Split qty required';
      if (quickAssignStep && splitAssignStep && quickAssignStep === splitAssignStep) errs.sameEngineer = 'Choose different steps';
      const total = mainQty + splitQty;
      if (total !== maxQty) errs.totalQtyMismatch = `Split total must equal ${maxQty} (current ${total})`;
    }

    setQuickAssignErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleQuickAssignCancel = () => {
    setQuickAssignOpen(false);
  };

  const selectedOrdersData = orders.filter((o) => selectedRows.has(o.id));
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
            <div class="detail-items"><span class="label ">Special Note:</span> <span>${order.specialNotes || ""}</span></div>
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

  const handleViewDetails = (order: AssemblyOrderData) => {
    setViewedOrder(order);
    setViewDetailsDialogOpen(true);
  };

const handleExport = () => {
  const dataToExport =
    selectedRows.size > 0
      ? filteredOrders.filter((o) => selectedRows.has(rowKey(o))) // ❌ rowKey not defined
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

  const handleOpenRemarks = (order: AssemblyOrderData) => {
    setRemarksOrder(order);
    setRemarksText(getRemark(order.id) || order.remarks || '');
    setRemarksDialogOpen(true);
  };

const handleSaveRemarks = async () => {
  if (!remarksOrder) return;

  const formData = new FormData();
  formData.append("orderId", String(remarksOrder.id));
  formData.append("remarks", remarksText);

  try {
    const res = await axios.post(`${API_URL}/add-remarks`, formData, {
      headers: { Authorization: `Bearer ${token}` },
    });

    const success =
      res.data?.Resp_code === "true" || res.data?.Resp_code === true;

    if (success) {
      // ✅ Update local SVS orders list
      setOrders((prev) =>
        prev.map((o) =>
          o.id === remarksOrder.id ? { ...o, remarks: remarksText } : o
        )
      );

      // ✅ Update context (for filters / tooltip / urgent logic)
      updateRemark(remarksOrder.id, remarksText);

      setRemarksDialogOpen(false);
      setRemarksOrder(null);
      setRemarksText("");
    }
  } catch (err) {
    console.error("Error saving SVS remarks:", err);
  }
};


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


  const [isAssigning, setIsAssigning] = useState(false);


// const handleAssignOrder = async () => {
//   if (isAssigning) return;
//   setIsAssigning(true);
//   if (!selectedOrder) return;
//   if (!validateQuickAssign()) return;

//   setAssignStatus({
//     type: "info",
//     message: "Assigning order, please wait...",
//   });

//   try {
//     const token = localStorage.getItem("token");
//     if (!token) {
//       setAssignStatus({
//         type: "error",
//         message: "Token missing. Please log in again.",
//       });
//       return;
//     }

//     const mainQty = Number(quickAssignQty || 0);
//     const splitQty = Number(splitAssignQty || 0);

//     // ✅ Ensure current step exists — fallback safe
//     const currentStep = selectedOrder?.currentStep || selectedOrder?.stage || "svs";
//     const currentStepLabel = getStepLabel(currentStep);

//     // ✅ Determine next step dynamically
//     const fallbackStep = (getNextSteps(currentStep)[0] || "");
//     const nextMainStep = quickAssignStep || fallbackStep;
//     const nextMainLabel = getStepLabel(nextMainStep);

//     // ✅ MAIN ASSIGNMENT PAYLOAD
//     const formData = new FormData();
//     formData.append("orderId", String(selectedOrder.id));
//     formData.append("totalQty", String(selectedOrder.qty));
//     formData.append("executedQty", String(mainQty));
//     formData.append("nextSteps", nextMainLabel);
//     formData.append("currentSteps", currentStepLabel); // ✅ REQUIRED field name
//     formData.append("split_id", String(selectedOrder.splittedCode || ""));

//     console.log("📤 MAIN PAYLOAD");
//     for (const p of formData.entries()) console.log(p[0], p[1]);

//     const responseMain = await axios.post(
//       `${API_URL}/assign-order`,
//       formData,
//       { headers: { Authorization: `Bearer ${token}` } }
//     );

//     const mainSuccess =
//       responseMain.data?.Resp_code === true ||
//       responseMain.data?.Resp_code === "true" ||
//       responseMain.data?.status === true;

//     if (!mainSuccess) {
//       setAssignStatus({
//         type: "error",
//         message:
//           responseMain.data?.Resp_desc || "Order assignment failed.",
//       });
//       return;
//     }

//     let successMsg = `✔ Assigned ${mainQty} → ${nextMainLabel}`;

//     // ✅ SPLIT ASSIGNMENT
//     if (splitOrder && splitQty > 0) {
//       const splitStep = splitAssignStep || nextMainStep;
//       const splitLabel = getStepLabel(splitStep);

//       const formDataSplit = new FormData();
//       formDataSplit.append("orderId", String(selectedOrder.id));
//       formDataSplit.append("totalQty", String(selectedOrder.qty));
//       formDataSplit.append("executedQty", String(splitQty));
//       formDataSplit.append("nextSteps", splitLabel);
//       formDataSplit.append("currentSteps", currentStepLabel); // ✅ required
//       formDataSplit.append("split_id", String(selectedOrder.splittedCode || ""));

//       console.log("📤 SPLIT PAYLOAD");
//       for (const p of formDataSplit.entries())
//         console.log("SPLIT:", p[0], p[1]);

//       const responseSplit = await axios.post(
//         `${API_URL}/assign-order`,
//         formDataSplit,
//         { headers: { Authorization: `Bearer ${token}` } }
//       );

//       const splitSuccess =
//         responseSplit.data?.Resp_code === true ||
//         responseSplit.data?.Resp_code === "true";

//       if (splitSuccess) {
//         successMsg += `\n✔ Split ${splitQty} → ${splitLabel}`;
//       } else {
//         setAssignStatus({
//           type: "error",
//           message:
//             "Main assigned but split failed: " +
//             (responseSplit.data?.Resp_desc || "Unknown error"),
//         });
//       }
//     }

//     setAssignStatus({ type: "success", message: successMsg });

//     await fetchOrders();

//     setQuickAssignOpen(false);
//     setAssignStatus(null);
//   } catch (error: any) {
//     console.error("❌ Error assigning order:", error);

//     if (error.response) {
//       const msg =
//         error.response.data?.message ||
//         error.response.data?.Resp_desc ||
//         "Validation failed.";

//       const detailed =
//         error.response.data?.errors &&
//         Object.entries(error.response.data.errors)
//           .map(([field, messages]: [string, any]) => `${field}: ${messages}`)
//           .join("\n");

//       setAssignStatus({
//         type: "error",
//         message: `❌ ${msg}\n${detailed || ""}`,
//       });
//     } else if (error.request) {
//       setAssignStatus({
//         type: "error",
//         message:
//           "❌ No response from server. Please check your connection.",
//       });
//     } else {
//       setAssignStatus({
//         type: "error",
//         message: `❌ ${error.message}`,
//       });
//     }
//   }
// };

const currentSteps = "svs"; 

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
      (Array.isArray(nextSteps) ? nextSteps[0] : "svs");

    const nextStepLabel = getStepLabel(nextStepKey);
     const currentStepsLabel = getStepLabel(currentSteps);

    const formData = new FormData();
    formData.append("orderId", String(selectedOrder.id));
    formData.append("totalQty", String(selectedOrder.qty));
    formData.append("executedQty", String(mainQty));
    formData.append("currentSteps", currentStepsLabel);
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


  const handlePrint = () => {
    try {
      window.print();
    } catch (err) {
      console.error('Print error', err);
    }
  };

  const clearFilters = () => {
    setAssemblyLineFilter('all');
    setGmsoaFilter('all');
    setPartyFilter('all');
    setDateFilterMode('range');
    setDateFrom(undefined);
    setDateTo(undefined);
  };

  // === PART 2 OF 2 - CONTINUES FROM PART 1 ===

  const renderSvsTable = (data: AssemblyOrderData[]) => (
  <table className="w-full border-collapse text-sm">
    <thead className="sticky top-0 z-20 bg-gray-100">
      <tr>
        <th className="px-3 py-2 text-center">
          <Checkbox
            checked={
              data.length > 0 &&
              selectedRows.size === data.length
            }
            onCheckedChange={toggleSelectAll}
          />
        </th>

        <th className="px-3 py-2 text-left">SOA</th>
        <th className="px-3 py-2 text-left">Party</th>
        <th className="px-3 py-2 text-left">Product</th>
        <th className="px-3 py-2 text-center">Qty</th>
        <th className="px-3 py-2 text-center">Executed</th>
        <th className="px-3 py-2 text-center">Pending</th>
        <th className="px-3 py-2 text-center">Urgent</th>
        <th className="px-3 py-2 text-center">Remarks</th>
        <th className="px-3 py-2 text-center">Action</th>
      </tr>
    </thead>

    <tbody>
      {data.length === 0 ? (
        <tr>
          <td colSpan={10} className="text-center py-6 text-gray-500">
            No SVS data found
          </td>
        </tr>
      ) : (
        data.map((o) => (
          <tr key={o.id} className="border-b hover:bg-gray-50">
            <td className="px-3 py-2 text-center">
              <Checkbox
                checked={selectedRows.has(o.id)}
                onCheckedChange={() => toggleRowSelection(o.id)}
              />
            </td>

            <td className="px-3 py-2">
              {o.gmsoaNo}-{o.soaSrNo}
            </td>

            <td className="px-3 py-2">{o.party}</td>
            <td className="px-3 py-2">{o.product}</td>
            <td className="px-3 py-2 text-center">{o.qty}</td>
            <td className="px-3 py-2 text-center">{o.qtyExe}</td>
            <td className="px-3 py-2 text-center">{o.qtyPending}</td>

            <td className="px-3 py-2 text-center">
              <Button
                size="icon"
                variant="ghost"
                onClick={() => toggleAlertStatus(o.id)}
              >
                <Siren
                  className={`h-4 w-4 ${
                    o.alertStatus ? "text-red-600" : "text-gray-400"
                  }`}
                />
              </Button>
            </td>

            <td className="px-3 py-2 text-center">
              <Button
                size="icon"
                variant="ghost"
                onClick={() => handleOpenRemarks(o)}
              >
                <MessageSquarePlus className="h-4 w-4" />
              </Button>
            </td>

            <td className="px-3 py-2 text-center">
              <Button
                size="icon"
                variant="ghost"
                onClick={() => handleViewDetails(o)}
              >
                <Eye className="h-4 w-4" />
              </Button>
            </td>
          </tr>
        ))
      )}
    </tbody>
  </table>
);


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
      <div className="mb-8">
        <div className="flex flex-col lg:flex-row lg:justify-between lg:items-start gap-6">
          <div>
            <h1 className="text-gray-900 mb-2 text-2xl font-semibold">Stock Valve Store (SVS) Management</h1>
            <p className="text-gray-600">Track and manage stock valve store orders and manufacturing workflow (Finished Valve = Yes)</p>
          </div>

          <div className="flex flex-col gap-4 w-full">
            <div className="flex flex-col sm:flex-row gap-4 lg:items-center justify-end">
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
                  className={`btn-urgent flex items-center gap-2 ${showUrgentOnly ? 'bg-red-600 text-white' : 'bg-red-50 text-red-700'}`}
                >
                  <Siren className="h-4 w-4" />
                  {showUrgentOnly ? 'Show All Projects' : 'Urgent Projects Only'}
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

              <Button
  className="bg-gradient-to-r from-[#174a9f] to-[#1a5cb8] text-white shadow-lg hover:shadow-xl"
  onClick={() => navigate("/svs-stock")}
>
  Inventory
</Button>

            </div>
          </div>
        </div>

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
              assemblyLineFilter !== 'all' || gmsoaFilter !== 'all' || partyFilter !== 'all' || !!dateFrom || !!dateTo
            }
          />
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
        <div ref={tableScrollRef} className="relative overflow-x-auto max-w-full" style={{ scrollbarGutter: 'stable' }}>
          <div className="inline-block min-w-full align-middle">
            {loading && orders.length === 0 ? (
              <div className="p-10 text-center text-gray-600 ctm-load">Loading...</div>
            ) : (
              <>
            <table className="min-w-full border-collapse">
              <thead>
                <tr>
                  <th className="sticky left-0 z-20 bg-white px-3 py-2 text-center border-r border-gray-200 w-12">
                    <button
                      type="button"
                      role="checkbox"
                      aria-checked={String(allRowsSelected)}
                      onClick={toggleSelectAll}
                      className="peer rounded border p-0.5"
                      aria-label="Select all rows"
                    >
                      <div className={`w-4 h-4 ${allRowsSelected ? 'bg-blue-600' : 'bg-white border'}`} />
                    </button>
                  </th>

                  <th className="sticky left-10 z-20 bg-white px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200 w-20">Assembly Line</th>
                  <th className="sticky left-164 z-20 bg-white px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200 min-w-28">GMSOA NO.</th>
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
  SOA Sr. No.
  {soaSort === "asc" && " ▲"}
  {soaSort === "desc" && " ▼"}
</th>
                  <th className="sticky left-364 z-20 bg-white px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider border-r-2 border-gray-300 min-w-32 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">Assembly Date</th>

                  <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200 min-w-36">Unique Code</th>
                  <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200">Splitted Code</th>
                  <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200 w-20">Party</th>
                  <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200">Customer PO No.</th>
                  <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200">Code No</th>
                  <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200 w-80">Product</th>
                  <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200">Qty</th>
                  <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200">Qty Exe.</th>
                  <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200">Qty Pending</th>
                  <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200">finished valve</th>
                  <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200">GM LOGO</th>
                  <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200">NAME PLATE</th>
                   <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200">
                          SPECIAL NOTES
                        </th>
                  <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200">PRODUCT SPCL1</th>
                  <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200">PRODUCT SPCL2</th>
                  <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200" style={{ width: '400px' }}>PRODUCT SPCL3</th>
                  <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200">INSPECTION</th>
                  <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200">PAINTING</th>
                  <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200">remarks</th>

                  <th className="sticky right-0 z-20 bg-white px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider border-l border-gray-200">Actions</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-200">
                {paginatedOrders.map((order) => (
                  <tr key={order.id} className="group hover:bg-gray-50">
                    <td className="sticky left-0 z-10 bg-white group-hover:bg-gray-50 px-3 py-2 text-center border-r border-gray-200 w-12">
                      <Checkbox
                        checked={selectedRows.has(order.id)}
                        onCheckedChange={() => toggleRowSelection(order.id)}
                        aria-label={`Select row ${order.id}`}
                      />
                    </td>

                    <td className="sticky left-10 z-10 bg-white group-hover:bg-gray-50 px-3 py-2 whitespace-nowrap text-center border-r border-gray-200 w-20">
                      <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200">
                        {order.assemblyLine}
                      </Badge>
                    </td>

                    <td className="sticky left-164 z-10 bg-white group-hover:bg-gray-50 px-3 py-2 whitespace-nowrap text-center text-sm text-gray-900 border-r border-gray-200 min-w-28">{order.gmsoaNo}</td>
                    <td className="sticky left-274 z-10 bg-white group-hover:bg-gray-50 px-3 py-2 whitespace-nowrap text-center text-sm text-gray-900 border-r border-gray-200 min-w-24">{order.soaSrNo}</td>
                    <td className="sticky left-364 z-10 bg-white group-hover:bg-gray-50 px-3 py-2 whitespace-nowrap text-center text-sm text-gray-900 border-r-2 border-gray-300 min-w-32 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">{order.assemblyDate}</td>

                    <td className="px-3 py-2 whitespace-nowrap text-center text-sm text-gray-900 font-mono min-w-36">{order.uniqueCode}</td>
                    <td className="px-3 py-2 whitespace-nowrap text-center text-sm text-gray-900">{order.splittedCode}</td>
                   <td className="px-3 py-2 text-center text-sm text-gray-900 max-w-xs">
                           <div  style={{ width: "120px" }}
 
                                title={order.party} 
                          >
                            {truncateWords(order.party, 4)}
                          </div>

                        </td>
                    <td className="px-3 py-2 whitespace-nowrap text-center text-sm text-gray-900">{order.customerPoNo}</td>
                    <td className="px-3 py-2 whitespace-nowrap text-center text-sm text-gray-900">{order.codeNo}</td>

                    <td className="px-3 py-2 text-center text-sm text-gray-900 w-80">
                      <div className="line-clamp-2"
                          style={{ width: "300px" }}
                          title={order.product}
                        >{order.product}</div>
                    </td>

                    <td className="px-3 py-2 whitespace-nowrap text-center text-sm text-gray-900">{order.totalQty}</td>
                    <td className="px-3 py-2 whitespace-nowrap text-center text-sm text-gray-900">{order.qtyExe}</td>
                    <td className="px-3 py-2 whitespace-nowrap text-center text-sm text-gray-900">{order.qtyPending}</td>
                    <td className="px-3 py-2 whitespace-nowrap text-center text-sm text-gray-900">{order.finishedValve}</td>
                    <td className="px-3 py-2 whitespace-nowrap text-center text-sm text-gray-900">{order.gmLogo}</td>
                    <td className="px-3 py-2 whitespace-nowrap text-center text-sm text-gray-900">{order.namePlate}</td>
                    <td className="px-3 py-2 text-center text-sm text-gray-900">
                            <div
                              className="line-clamp-2"
                              style={{ width: "200px" }}
                              title={order.specialNotes}
                            >
                              {order.specialNotes || "-"}
                            </div>
                          </td>
                    <td className="px-3 py-2 whitespace-nowrap text-center text-sm text-gray-900">{order.productSpcl1}</td>
                    <td className="px-3 py-2 whitespace-nowrap text-center text-sm text-gray-900">{order.productSpcl2}</td>
                    <td className="px-3 py-2 text-center text-sm text-gray-900" style={{ width: '400px' }}>
                      <div className="line-clamp-2">{order.productSpcl3}</div>
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap text-center text-sm text-gray-900">{order.inspection}</td>
                    <td className="px-3 py-2 whitespace-nowrap text-center text-sm text-gray-900">{order.painting}</td>

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
                        <Button size="sm" variant="ghost" className="h-7 w-7 p-0 hover:bg-blue-100" title="View Details" onClick={() => handleViewDetails(order)}>
                          <Eye className="h-4 w-4 text-blue-600" />
                        </Button>

                        <Button size="sm" variant="ghost" className="h-7 w-7 p-0 hover:bg-green-100" title="Assign Next" onClick={() => handleQuickAssign(order)}>
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
              <div className="p-6 text-center text-gray-500">No SVS orders found.</div>
            )}
              </>
            )}
            
          </div>
        </div>
      </div>
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
      <Dialog open={quickAssignOpen} onOpenChange={setQuickAssignOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Quick Assign Order</DialogTitle>
            <DialogDescription>
              Assign {selectedOrder?.uniqueCode} to the next workflow step
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="assignStep">Assign to Workflow Step</Label>
                  <Select value={quickAssignStep} onValueChange={setQuickAssignStep}>
                    <SelectTrigger id="assignStep" disabled>
                      <SelectValue placeholder="Select step" />
                    </SelectTrigger>
                    <SelectContent>
                      {/* SVS → only Marking 1 */}
                      <SelectItem value="marking1">Marking 1</SelectItem>
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
                <span className="font-medium text-gray-900">{selectedOrder?.qtyPending}</span>
              </div>
            </div>

            {/* <div className="space-y-4 border-t pt-4">
              <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-700">
                SVS orders can only move to <span className="font-medium">Marking 1</span>. Splitting across different steps is disabled.
              </div>
            </div> */}
          </div>

          {assignStatus && (
            <div
              className={`p-3 mt-3 rounded-md text-sm ${assignStatus.type === "success"
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
                      <p className="text-gray-900 mt-1">{order.totalQty}</p>
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
                className="flex items-center gap-2 bg-gradient-to-r from-[#174a9f] to-[#1a5cb8] hover:from-[#123a80] hover:to-[#174a9f] text-white shadow-md transition-all"
              >
                <Printer className="h-4 w-4" />
                Print
              </Button>
            </div>
          </DialogContent>
        </Dialog>

      {/* View Order Details Dialog */}
      <Dialog open={viewDetailsDialogOpen} onOpenChange={setViewDetailsDialogOpen}>
        <DialogContent className="sm:max-w-[900px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Order Details</DialogTitle>
            <DialogDescription>Complete information for {viewedOrder?.uniqueCode}</DialogDescription>
          </DialogHeader>

          {viewedOrder && (
            <div className="space-y-6 py-4">
              <div className="bg-blue-50/50 rounded-lg p-4">
                <h3 className="font-medium text-gray-900 mb-3">Basic Information</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-gray-500 text-sm">Assembly Line</Label>
                    <p className="text-gray-900 mt-1">{viewedOrder.assemblyLine}</p>
                  </div>
                  <div>
                    <Label className="text-gray-500 text-sm">GMSOA No.</Label>
                    <p className="text-gray-900 mt-1">{viewedOrder.gmsoaNo}</p>
                  </div>
                  <div>
                    <Label className="text-gray-500 text-sm">SOA Sr. No.</Label>
                    <p className="text-gray-900 mt-1">{viewedOrder.soaSrNo}</p>
                  </div>
                  <div>
                    <Label className="text-gray-500 text-sm">Assembly Date</Label>
                    <p className="text-gray-900 mt-1">{viewedOrder.assemblyDate}</p>
                  </div>
                  <div>
                    <Label className="text-gray-500 text-sm">Unique Code</Label>
                    <p className="text-gray-900 mt-1">{viewedOrder.uniqueCode}</p>
                  </div>
                  <div>
                    <Label className="text-gray-500 text-sm">Splitted Code</Label>
                    <p className="text-gray-900 mt-1">{viewedOrder.splittedCode || 'N/A'}</p>
                  </div>
                </div>
              </div>

              <div className="bg-green-50/50 rounded-lg p-4">
                <h3 className="font-medium text-gray-900 mb-3">Customer & Product Information</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-gray-500 text-sm">Party</Label>
                    <p className="text-gray-900 mt-1">{viewedOrder.party}</p>
                  </div>
                  <div>
                    <Label className="text-gray-500 text-sm">Customer PO No.</Label>
                    <p className="text-gray-900 mt-1">{viewedOrder.customerPoNo}</p>
                  </div>
                  <div>
                    <Label className="text-gray-500 text-sm">Code No</Label>
                    <p className="text-gray-900 mt-1">{viewedOrder.codeNo}</p>
                  </div>
                  <div className="col-span-2">
                    <Label className="text-gray-500 text-sm">Product</Label>
                    <p className="text-gray-900 mt-1">{viewedOrder.product}</p>
                  </div>
                </div>
              </div>

              <div className="bg-purple-50/50 rounded-lg p-4">
                <h3 className="font-medium text-gray-900 mb-3">Quantity Information</h3>
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
                    <Label className="text-gray-500 text-sm">Qty Pending</Label>
                    <p className="text-gray-900 mt-1">{viewedOrder.qtyPending}</p>
                  </div>
                </div>
              </div>

              <div className="bg-amber-50/50 rounded-lg p-4">
                <h3 className="font-medium text-gray-900 mb-3">Product Specifications</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-gray-500 text-sm">Finished Valve</Label>
                    <p className="text-gray-900 mt-1">{viewedOrder.finishedValve || "-"}</p>
                  </div>
                  <div>
                    <Label className="text-gray-500 text-sm">GM Logo</Label>
                    <p className="text-gray-900 mt-1">{viewedOrder.gmLogo}</p>
                  </div>
                  <div>
                    <Label className="text-gray-500 text-sm">Name Plate</Label>
                    <p className="text-gray-900 mt-1">{viewedOrder.namePlate}</p>
                  </div>
                  <div>
                    <Label className="text-gray-500 text-sm">Product SPCL1</Label>
                    <p className="text-gray-900 mt-1">{viewedOrder.productSpcl1 || 'N/A'}</p>
                  </div>
                  <div>
                    <Label className="text-gray-500 text-sm">Product SPCL2</Label>
                    <p className="text-gray-900 mt-1">{viewedOrder.productSpcl2 || 'N/A'}</p>
                  </div>
                  <div className="col-span-2">
                    <Label className="text-gray-500 text-sm">Product SPCL3</Label>
                    <p className="text-gray-900 mt-1">{viewedOrder.productSpcl3 || 'N/A'}</p>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-medium text-gray-900 mb-3">Additional Information</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-gray-500 text-sm">Inspection</Label>
                    <p className="text-gray-900 mt-1">{viewedOrder.inspection}</p>
                  </div>
                  <div>
                    <Label className="text-gray-500 text-sm">Painting</Label>
                    <p className="text-gray-900 mt-1">{viewedOrder.painting}</p>
                  </div>
                  <div className="col-span-2">
                    <Label className="text-gray-500 text-sm">Remarks</Label>
                    <p className="text-gray-900 mt-1">{viewedOrder.remarks || 'No remarks'}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-end pt-4 border-t border-gray-100">
            <Button variant="outline" onClick={() => setViewDetailsDialogOpen(false)}>Close</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Remarks Dialog */}
      <Dialog open={remarksDialogOpen} onOpenChange={setRemarksDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Add/Edit Remarks</DialogTitle>
            <DialogDescription>{remarksOrder ? `Order: ${remarksOrder.uniqueCode}` : ''}</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <Label htmlFor="remarks">Remarks</Label>
            <Textarea id="remarks" placeholder="Enter remarks..." value={remarksText} onChange={(e) => setRemarksText(e.target.value)} rows={6} className="resize-none" />
          </div>

          <div className="flex justify-end space-x-3 pt-4 border-t border-gray-100">
            <Button variant="outline" onClick={() => setRemarksDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSaveRemarks} className="bg-blue-600 text-white">Save Remarks</Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={inventoryOpen} onOpenChange={setInventoryOpen}>
        <DialogContent className="max-w-7xl h-[85vh] overflow-hidden assmebly-svs-data">
          <DialogHeader>
            <DialogTitle>SVS Inventory</DialogTitle>
            <DialogDescription>
              Orders received from Assembly C → SVS
            </DialogDescription>
          </DialogHeader>

          <div className="h-full overflow-auto border rounded-md">
            {renderSvsTable(filteredOrders)}
          </div>
        </DialogContent>
      </Dialog>


    </div>
    </>
  );
}

export default SvsPage;
