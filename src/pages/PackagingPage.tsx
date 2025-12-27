import React, { useState, useRef, useEffect, useMemo } from "react";
import axios from "axios";
import {
  Siren,
  Eye,
  MessageSquarePlus,
  Download,
  ArrowLeft,
  Printer,
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
import { Checkbox } from "../components/ui/checkbox";
import { Input } from "../components/ui/input";
import { useOrderContext } from "../components/order-context";
import { OrderFilters } from "../components/order-filters";
import { API_URL } from "../config/api";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import { DashboardHeader } from "../components/dashboard-header";
import TablePagination from "../components/table-pagination";
import { useNavigate } from "react-router-dom";

interface PackagingOrderData {
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
  totalQty: number;
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
  specialNotes: string;
  alertStatus: boolean;
  packaging: number;
  oclNo: string;
  completedDate: string;
  originalIndex: number;
}

// Local helper to safely truncate by word count
const truncateWords = (text: string, maxWords: number): string => {
  if (!text) return "";
  const words = String(text).trim().split(/\s+/);
  if (words.length <= maxWords) return text;
  return words.slice(0, maxWords).join(" ") + "...";
};

export function PackagingPage() {
  const navigate = useNavigate();
  const { updateRemark, getRemark, getAlertStatus } = useOrderContext();
  const token = localStorage.getItem("token");

  const [orders, setOrders] = useState<PackagingOrderData[]>([]);
  const [fullOrders, setFullOrders] = useState<PackagingOrderData[] | null>(
    null
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(20);

  const [soaSort, setSoaSort] = useState<"asc" | "desc" | null>(null);
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

  const [remarksDialogOpen, setRemarksDialogOpen] = useState(false);
  const [remarksOrder, setRemarksOrder] = useState<PackagingOrderData | null>(
    null
  );
  const [remarksText, setRemarksText] = useState("");
  const [viewDetailsDialogOpen, setViewDetailsDialogOpen] = useState(false);
  const [viewedOrder, setViewedOrder] = useState<PackagingOrderData | null>(
    null
  );

  const tableScrollRef = useRef<HTMLDivElement | null>(null);

  /* ================= FETCH ================= */

  const fetchOrders = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await axios.post(
        `${API_URL}/packaging-orders`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const ok =
        res.data?.status === true ||
        res.data?.status === "true" ||
        Array.isArray(res.data?.data);
      if (ok && Array.isArray(res.data.data)) {
        const mapped: PackagingOrderData[] = res.data.data.map(
          (item: any, index: number) => ({
            id: String(item.id),
            assemblyLine: item.assembly_no || "",
            gmsoaNo: item.soa_no || "",
            soaSrNo: item.soa_sr_no || "",
            assemblyDate: item.assembly_date || "",
            uniqueCode: item.unique_code || item.order_no || "",
            splittedCode: item.split_code || item.splitted_code || "",
            split_id:
              item.split_id || item.split_code || item.splitted_code || "",
            party: item.party_name || item.party || "",
            customerPoNo: item.customer_po_no || "",
            codeNo: item.code_no || "",
            product: item.product || "",
            totalQty: Number(
              item.totalQty || item.total_qty || item.qty || item.po_qty || 0
            ),
            qtyExe: Number(item.qty_executed || item.assigned_qty || 0),
            qtyPending: Number(item.qty_pending || item.remaining_qty || 0),
            finishedValve: item.finished_valve || "",
            gmLogo: item.gm_logo || "",
            namePlate: item.name_plate || "",
            productSpcl1: item.product_spc1 || "",
            productSpcl2: item.product_spc2 || "",
            productSpcl3: item.product_spc3 || "",
            inspection: item.inspection || "",
            painting: item.painting || "",
            remarks: item.remarks || "",
            specialNotes: item.special_notes || item.special_note || "",
            alertStatus:
              item.is_urgent === true ||
              item.is_urgent === "true" ||
              item.alert_status === true ||
              item.alert_status === "true" ||
              item.urgent === 1 ||
              item.urgent === "1",
            packaging:
              item.is_packaging === 1 ||
              item.is_packaging === "1" ||
              item.packaging === 1 ||
              item.packaging === "1"
                ? 1
                : 0,
            oclNo: item.ocl_no || "",
            completedDate: item.completed_date || "",
            originalIndex: index,
          })
        );
        setOrders(mapped);
        setFullOrders(mapped);
      } else {
        setOrders([]);
        setError(
          res?.data?.message ||
            res?.data?.Resp_desc ||
            "Failed to fetch packaging orders"
        );
      }
    } catch (err: any) {
      setError("Error fetching packaging orders");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

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

  const filteredOrders = useMemo(() => {
    let filtered = orders.slice();
    if (showUrgentOnly) {
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
        if (!order.assemblyDate || order.assemblyDate === "HOLD") return false;
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

  /* ================= SELECTION ================= */

  const rowKey = (o: PackagingOrderData) =>
    o.splittedCode || o.split_id
      ? o.splittedCode || o.split_id
      : [o.uniqueCode, o.soaSrNo, o.gmsoaNo, o.codeNo, o.assemblyLine]
          .map((v) => v ?? "")
          .join("|");

  const toggleRowSelection = (key: string) => {
    setSelectedRows((prev) => {
      const s = new Set(prev);
      s.has(key) ? s.delete(key) : s.add(key);
      return s;
    });
  };

  const toggleSelectAll = () => {
    if (selectedRows.size === filteredOrders.length) {
      setSelectedRows(new Set());
    } else {
      setSelectedRows(new Set(filteredOrders.map(rowKey)));
    }
  };
  const selectedOrdersData = useMemo(
    () => orders.filter((o) => selectedRows.has(rowKey(o))),
    [orders, selectedRows]
  );

  const [binCardDialogOpen, setBinCardDialogOpen] = useState(false);
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
                <div><span class="label">Date:</span> ${
                  order.assemblyDate
                }</div>
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
                <span class="label item-label">Item:</span><p>${
                  order.product
                }</p>
              </div>
            </div>
            <div class="qty-logo">
              <div class="meta meta-logo">
                <div class="meta-qty"><span class="label">QTY:</span> ${
                  order.totalQty
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
          @page { size: 130mm 85mm; margin: 0; }
          html, body { width: 130mm; height: 85mm; margin: 0; padding: 0; font-family: Arial, Helvetica, sans-serif; }
          .item-label, .party-desc { padding-bottom: 2mm; }
          .item-label { line-height: 1.8em; }
          .bin-card { width: 130mm; height: 85mm; padding: 6mm; box-sizing: border-box; page-break-after: always; }
          .item-label-description { padding-top: 50px; }
          .meta-qty { width: 50%; }
          .process-border { border-top:1px solid #000; border-bottom:1px solid #000; padding-top: 1.5mm; padding-bottom: 1.5mm; }
          .detail-logo { padding-bottom: 0.9mm; }
          .description { padding-bottom: 2mm; }
          .content { width: 100%; height: 100%; border: 1.5px solid #000; border-radius: 10px; padding-top: 2mm; padding-bottom: 4mm; padding-left: 6mm; padding-right: 6mm; box-sizing: border-box; display: flex; flex-direction: column; }
          .meta-item { padding-top: 2mm; }
          p { margin: 0; }
          .company-name { font-size: 12px; font-weight: 700; text-align: center; margin: 0 0 1mm; }
          .assembly-title p { border: 1px solid #000; display: inline-block; padding-top: 1mm; padding-bottom: 0.9mm; padding-left: 1mm; padding-right: 1mm; }
          .company-address { font-size: 8px; font-weight: 400; text-align: center; line-height: 1.2; margin: 0 0 1.2mm; }
          .tag-title { font-size: 11px; font-weight: 700; text-align: center; margin: 0 0 1.5mm; }
          .doc-row { display: flex; justify-content: space-between; font-size: 9px; margin-bottom: 0.5mm; }
          .title { text-align: center; font-size: 11px; font-weight: 700; margin-top: 0; margin-bottom: 0.5mm; }
          .title-line { border-bottom: 1px solid #000; margin-bottom: 1.5mm; margin-top: 0.5mm; }
          .meta { font-size: 10px; line-height: 1.25; margin-bottom: 0.8mm; display: flex; align-items: center; justify-content: space-between; }
          .meta div { margin-bottom: 0.5mm; }
          .desc { font-size: 9px; margin-bottom: 0.8mm; }
          .desc p { padding-bottom: 0.6mm; }
          .desc span { display: block; padding-bottom: 0.1mm; }
          .desc .label { display: block; font-size: 10px; margin-bottom: 0.8mm; margin-top: 0.8mm; }
          .desc .text { word-break: break-word; }
          .qty-logo { font-size: 10px; line-height: 1.3; margin-bottom: 0.4mm; margin-top: 0.8mm; }
          .inspect { margin-top: auto; font-size: 10px; }
          .inspect-line { height: 3mm; border-bottom: 1px solid #000; }
          .label { font-weight: 600; }
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

  // Reflect whether every visible row is currently selected
  const allRowsSelected =
    filteredOrders.length > 0 && selectedRows.size === filteredOrders.length;

  /* ================= EXPORT ================= */

  const exportToExcel = (data: PackagingOrderData[]) => {
    const sheetData = data.map((o, i) => ({
      No: i + 1,
      "Assembly Line": o.assemblyLine,
      "GMSOA No": o.gmsoaNo,
      "SOA Sr No": o.soaSrNo,
      "Assembly Date": o.assemblyDate,
      "Unique Code": o.uniqueCode,
      "Splitted Code": o.splittedCode || "-",
      Party: o.party,
      "Customer PO No": o.customerPoNo,
      "Code No": o.codeNo,
      Product: o.product,
      Qty: o.totalQty,
      "Qty Executed": o.qtyExe,
      "Qty Pending": o.qtyPending,
      "Finished Valve": o.finishedValve,
      "GM Logo": o.gmLogo,
      "Name Plate": o.namePlate,
      "Special Notes": o.specialNotes || "",
      "Product Special 1": o.productSpcl1,
      "Product Special 2": o.productSpcl2,
      "Product Special 3": o.productSpcl3,
      Inspection: o.inspection,
      Painting: o.painting,
      OCL: o.oclNo,
      "Completed Date": o.completedDate,
      Remarks: o.remarks || "",
    }));
    const ws = XLSX.utils.json_to_sheet(sheetData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Packaging");
    const buf = XLSX.write(wb, { bookType: "xlsx", type: "array" });
    saveAs(new Blob([buf]), "Packaging.xlsx");
  };

  const handleExport = () => {
    // if (!showUrgentOnly && !showRemarksOnly && selectedRows.size === 0) {
    //   alert("Export allowed only for Urgent / Remarks / Selected rows");
    //   return;
    // }

    const data =
      selectedRows.size > 0
        ? filteredOrders.filter((o) => selectedRows.has(rowKey(o)))
        : filteredOrders;

    exportToExcel(data);
  };

  const handleExportAll = () => {
    if (fullOrders) exportToExcel(fullOrders);
  };

  /* ================= REMARKS ================= */

  const openRemarks = (order: PackagingOrderData) => {
    setRemarksOrder(order);
    setRemarksText(getRemark(order.id) || order.remarks || "");
    setRemarksDialogOpen(true);
  };

  const saveRemarks = () => {
    if (remarksOrder) {
      updateRemark(remarksOrder.id, remarksText);
      setRemarksDialogOpen(false);
    }
  };

  /* ================= UI ================= */

  return (
    <>
      <DashboardHeader
        role="svs"
        currentPage="Packaging"
        onLogout={() => {
          localStorage.removeItem("token");
          window.location.href = "/login";
        }}
        onNavigate={(p) => (window.location.href = `/${p.toLowerCase()}`)}
      />

      <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 bg-white min-h-screen">
        <div className="mb-8">
          <div className="flex flex-col lg:flex-row lg:justify-between lg:items-start gap-4">
            <div className="flex-row-main">
              <h1 className="text-gray-900 mb-2 text-2xl font-semibold">
                Packaging
              </h1>
              <p className="text-sm text-gray-600">
                Completed and packaged orders
              </p>
            </div>
            <div className="flex gap-4 w-full justify-end">
              <div className="flex flex-col sm:flex-row gap-4 lg:items-center justify-end">
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

                  {/* <Button
                    onClick={() => setShowUrgentOnly(!showUrgentOnly)}
                    className={`btn-urgent flex items-center gap-2 ${
                      showUrgentOnly ? "bg-red-600 text-white" : "bg-red-50 text-red-700"
                    }`}
                  >
                    <Siren className="h-4 w-4" />
                    {showUrgentOnly ? "Show All Projects" : "Urgent Projects Only"}
                  </Button>
                  <Button
                    onClick={() => setShowRemarksOnly(!showRemarksOnly)}
                    className="bg-btn-gradient text-white shadow-md transition-all btn-remark"
                  >
                    {showRemarksOnly ? "Show All Projects" : "Remarks only"}
                  </Button> */}
                </div>
              </div>

              <Button
                disabled={filteredOrders.length === 0}
                onClick={handleExport}
                className="bg-gradient-to-r from-[#174a9f] to-[#1a5cb8] hover:from-[#123a80] hover:to-[#174a9f] text-white shadow-lg hover:shadow-xl transition-all duration-300"
              >
                <Download className="h-4 w-4 mr-2" />
                Export Data
              </Button>
              {/* <Button
                onClick={handleExportAll}
                className="bg-gradient-to-r from-[#174a9f] to-[#1a5cb8] hover:from-[#123a80] hover:to-[#174a9f] text-white shadow-lg hover:shadow-xl transition-all duration-300"
              >
                <Download className="h-4 w-4 mr-2" />
                Export all Data
              </Button> */}
            </div>
          </div>
          <div className="mt-4">
            <Button
              variant="outline"
              onClick={() => {
                try {
                  const s = localStorage.getItem("user");
                  const u = s ? JSON.parse(s) : null;
                  const rawRole = u?.role?.name || u?.role || "";
                  const role = String(rawRole || "").toLowerCase();
                  if (role.includes("planning")) {
                    navigate("/planning");
                  } else {
                    navigate("/dispatch");
                  }
                } catch {
                  navigate("/dispatch");
                }
              }}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Dispatch
            </Button>
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
              onClearFilters={() => {
                setAssemblyLineFilter("all");
                setGmsoaFilter("all");
                setPartyFilter("all");
                setDateFilterMode("range");
                setDateFrom(undefined);
                setDateTo(undefined);
              }}
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
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
          <div
            ref={tableScrollRef}
            className="relative overflow-x-auto max-w-full"
            style={{
              maxHeight: "80vh",
              overflowY: "auto",
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
                        <th className="sticky left-0 z-20 bg-white px-3 py-2 text-center border-r border-gray-200 w-12">
                          <button
                            type="button"
                            role="checkbox"
                            aria-checked={String(allRowsSelected)}
                            onClick={toggleSelectAll}
                            className="peer rounded border p-0.5"
                            aria-label="Select all rows"
                          >
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
                          className="sticky left-274 z-20 bg-white px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200 min-w-24 cursor-pointer select-none"
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
                        <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200">
                          OCL Number
                        </th>
                        {/* <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200">
                          Completed Date
                        </th> */}
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
                              checked={selectedRows.has(rowKey(order))}
                              onCheckedChange={() =>
                                toggleRowSelection(rowKey(order))
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
                                onClick={() => openRemarks(order)}
                              >
                                <MessageSquarePlus
                                  className={`h-4 w-4 ${
                                    order.remarks?.trim()
                                      ? "text-white"
                                      : "text-blue-600"
                                  }`}
                                />
                              </Button>
                              {order.remarks?.trim() && (
                                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block bg-gray-900 text-white text-xs px-3 py-2 rounded-md shadow-lg max-w-[260px] break-words z-[999]">
                                  {order.remarks}
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="px-3 py-2 whitespace-nowrap text-center text-sm text-gray-900">
                            {order.oclNo || "-"}
                          </td>
                          {/* <td className="px-3 py-2 whitespace-nowrap text-center text-sm text-gray-900">
                            {order.completedDate || "-"}
                          </td> */}
                          <td className="sticky right-0 z-10 bg-white group-hover:bg-gray-50 px-3 py-2 whitespace-nowrap border-l border-gray-200">
                            <div className="flex items-center space-x-1">
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-7 w-7 p-0 hover:bg-blue-100"
                                title="View Details"
                                onClick={() =>
                                  setViewedOrder(order) ||
                                  setViewDetailsDialogOpen(true)
                                }
                              >
                                <Eye className="h-4 w-4 text-blue-600" />
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
                </>
              )}
            </div>
          </div>
        </div>
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
      </div>

      <Dialog open={remarksDialogOpen} onOpenChange={setRemarksDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remarks</DialogTitle>
          </DialogHeader>
          <Textarea
            value={remarksText}
            onChange={(e) => setRemarksText(e.target.value)}
          />
          <Button onClick={saveRemarks}>Save</Button>
        </DialogContent>
      </Dialog>
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
                    <p className="text-gray-900 mt-1">{viewedOrder.gmsoaNo}</p>
                  </div>
                  <div>
                    <Label className="text-gray-500 text-sm">Sr. No.</Label>
                    <p className="text-gray-900 mt-1">{viewedOrder.soaSrNo}</p>
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
                    <Label className="text-gray-500 text-sm">Unique Code</Label>
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
                    <p className="text-gray-900 mt-1">{viewedOrder.product}</p>
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
                    <Label className="text-gray-500 text-sm">Qty Pending</Label>
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
                    <Label className="text-gray-500 text-sm">Name Plate</Label>
                    <p className="text-gray-900 mt-1">
                      {viewedOrder.namePlate}
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
                    <Label className="text-gray-500 text-sm">Inspection</Label>
                    <p className="text-gray-900 mt-1">
                      {viewedOrder.inspection}
                    </p>
                  </div>
                  <div>
                    <Label className="text-gray-500 text-sm">Painting</Label>
                    <p className="text-gray-900 mt-1">{viewedOrder.painting}</p>
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
                    <span className="font-semibold">Logo:</span> {order.gmLogo}
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
    </>
  );
}
export default PackagingPage;
