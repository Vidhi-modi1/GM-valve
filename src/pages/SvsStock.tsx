import React, { useEffect, useMemo, useRef, useState } from "react";
import axios from "axios";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { OrderFilters } from "../components/order-filters";
import { DashboardHeader } from "../components/dashboard-header";
import TablePagination from "../components/table-pagination";
import { API_URL } from "../config/api";
import { getStepLabel } from "../config/workflowSteps";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "../components/ui/dialog";
import { Label } from "../components/ui/label";
import { Eye, Download, Printer, MessageSquarePlus, ArrowLeft } from "lucide-react";
import { Checkbox } from "../components/ui/checkbox";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import { Textarea } from "../components/ui/textarea";
import { useNavigate } from "react-router-dom";

interface StockOrder {
  id: string;
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
  qtyExe: number;
  qtyPending: number;
  finishedValve: string;
  gmLogo: string;
  namePlate: string;
  specialNotes: string;
  productSpcl1: string;
  productSpcl2: string;
  productSpcl3: string;
  inspection: string;
  painting: string;
  remarks: string;
}

export default function SvsStock() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState<StockOrder[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(20);

  const [localSearchTerm, setLocalSearchTerm] = useState("");
  const [assemblyLineFilter, setAssemblyLineFilter] = useState("all");
  const [dateFilterMode, setDateFilterMode] = useState<"year" | "month" | "range">("range");
  const [dateFrom, setDateFrom] = useState<Date | undefined>();
  const [dateTo, setDateTo] = useState<Date | undefined>();
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());
  const [viewDetailsDialogOpen, setViewDetailsDialogOpen] = useState(false);
  const [viewedOrder, setViewedOrder] = useState<StockOrder | null>(null);
  const [binCardDialogOpen, setBinCardDialogOpen] = useState(false);
  const [remarksDialogOpen, setRemarksDialogOpen] = useState(false);
  const [remarksOrder, setRemarksOrder] = useState<StockOrder | null>(null);
  const [remarksText, setRemarksText] = useState("");
  const [soaSort, setSoaSort] = useState<"asc" | "desc" | null>(null);

  const tableScrollRef = useRef<HTMLDivElement | null>(null);
  const token = localStorage.getItem("token");

  /* ================= FETCH SVS STOCK ================= */
  const fetchStock = async () => {
    try {
      setLoading(true);

      const res = await axios.post(
        `${API_URL}/order-list`,
        { menu_name: getStepLabel("svs") },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const ok =
        res.data?.Resp_code === true ||
        res.data?.Resp_code === "true" ||
        res.data?.Resp_code === "RCS";

      if (ok && Array.isArray(res.data.data)) {
        const mapped = res.data.data
          .filter(
            (o: any) =>
              String(o.finished_valve).trim().toLowerCase() === "yes"
          )
          .map((o: any) => ({
            id: String(o.id),
            assemblyLine: o.assembly_no || "",
            gmsoaNo: o.soa_no || "",
            soaSrNo: o.soa_sr_no || "",
            assemblyDate: o.assembly_date || "",
            uniqueCode: o.unique_code || "",
            splittedCode: o.splitted_code || "",
            party: o.party_name || "",
            customerPoNo: o.customer_po_no || "",
            codeNo: o.code_no || "",
            product: o.product || "",
            totalQty: Number(o.total_qty || o.qty || 0),
            qtyExe: Number(o.qty_executed || 0),
            qtyPending: Number(o.qty_pending || 0),
            finishedValve: o.finished_valve || "",
            gmLogo: o.gm_logo || "",
            namePlate: o.name_plate || "",
            specialNotes: o.special_notes || "",
            productSpcl1: o.product_spc1 || "",
            productSpcl2: o.product_spc2 || "",
            productSpcl3: o.product_spc3 || "",
            inspection: o.inspection || "",
            painting: o.painting || "",
            remarks: o.remarks || "",
          }));

        setOrders(mapped);
      } else {
        setOrders([]);
      }
    } catch (e) {
      console.error("SVS Stock fetch error", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStock();
  }, []);

  /* ================= FILTERS ================= */
  const assemblyLines = useMemo(
    () =>
      Array.from(new Set(orders.map((o) => o.assemblyLine))).filter(Boolean),
    [orders]
  );

  const truncateWords = (text = "", wordLimit = 4) => {
    const words = text.trim().split(/\s+/);
    if (words.length <= wordLimit) return text;
    return words.slice(0, wordLimit).join(" ") + "...";
  };

  const filteredOrders = useMemo(() => {
    let list = orders.slice();

    if (assemblyLineFilter !== "all")
      list = list.filter((o) => o.assemblyLine === assemblyLineFilter);

    if (localSearchTerm.trim()) {
      const t = localSearchTerm.toLowerCase();
      list = list.filter(
        (o) =>
          o.uniqueCode.toLowerCase().includes(t) ||
          o.party.toLowerCase().includes(t) ||
          o.product.toLowerCase().includes(t) ||
          o.gmsoaNo.toLowerCase().includes(t)
      );
    }

    // Apply SOA sort
    if (soaSort) {
      list.sort((a, b) => {
        const valA = Number(a.soaSrNo) || 0;
        const valB = Number(b.soaSrNo) || 0;
        return soaSort === "asc" ? valA - valB : valB - valA;
      });
    }

    return list;
  }, [orders, assemblyLineFilter, localSearchTerm, soaSort]);

  const paginatedOrders = useMemo(() => {
    const start = (page - 1) * perPage;
    return filteredOrders.slice(start, start + perPage);
  }, [filteredOrders, page, perPage]);

  useEffect(() => setPage(1), [assemblyLineFilter, localSearchTerm]);

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

  const allRowsSelected = filteredOrders.length > 0 && selectedRows.size === filteredOrders.length;

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
                <div class="meta-qty"><span class="label">QTY:</span> ${order.totalQty}</div>
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

  const handleViewDetails = (order: StockOrder) => {
    setViewedOrder(order);
    setViewDetailsDialogOpen(true);
  };

  const handleOpenRemarks = (order: StockOrder) => {
    setRemarksOrder(order);
    setRemarksText(order.remarks || "");
    setRemarksDialogOpen(true);
  };

  const handleExport = () => {
    const dataToExport =
      selectedRows.size > 0
        ? filteredOrders.filter((o) => selectedRows.has(o.id))
        : filteredOrders;

    if (!dataToExport.length) {
      alert("No data available to export");
      return;
    }

    exportToExcel(dataToExport);
  };

  const exportToExcel = (data: StockOrder[]) => {
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
      "Qty": order.totalQty,
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
    XLSX.utils.book_append_sheet(workbook, worksheet, "SVS Stock");

    const excelBuffer = XLSX.write(workbook, {
      bookType: "xlsx",
      type: "array",
    });

    saveAs(
      new Blob([excelBuffer], { type: "application/octet-stream" }),
      `SVS_Stock_${new Date().toISOString().slice(0, 10)}.xlsx`
    );
  };

  /* ================= RENDER ================= */
  return (
    <>
      <DashboardHeader
        role="svs"
        currentPage="SVS Stock"
        onLogout={() => {
          localStorage.removeItem("token");
          window.location.href = "/login";
        }}
        onNavigate={(p) => (window.location.href = `/${p.toLowerCase()}`)}
      />

      <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 bg-white min-h-screen animate-fade-in">
        <div className="mb-8">
          <div className="flex flex-col lg:flex-row lg:justify-between lg:items-start gap-6">
            <div>
              <h1 className="text-gray-900 mb-2 text-2xl font-semibold">
                SVS Inventory (Stock)
              </h1>
              <p className="text-gray-600">
                Read-only inventory view (Finished Valve = Yes)
              </p>
              <div className="mt-4">
                <Button
                  variant="outline"
                  className="flex items-center gap-2"
                  onClick={() => {
                    // Navigate based on logged-in role
                    try {
                      const s = localStorage.getItem("user");
                      const u = s ? JSON.parse(s) : null;
                      const rawRole = u?.role?.name || u?.role || "";
                      const role = String(rawRole || "").toLowerCase();
                      if (role.includes("planning")) {
                        navigate("/planning");
                      } else {
                        navigate("/svs");
                      }
                    } catch {
                      navigate("/svs");
                    }
                  }}
                  title="Back to SVS"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Back to SVS
                </Button>
              </div>
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
                onClick={handleExport}
                className="bg-gradient-to-r from-[#174a9f] to-[#1a5cb8] hover:from-[#123a80] hover:to-[#174a9f] text-white shadow-lg hover:shadow-xl transition-all duration-300"
              >
                <Download className="h-4 w-4 mr-2" />
                Export Data
              </Button>
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
              onClearFilters={() => {
                setAssemblyLineFilter("all");
                setLocalSearchTerm("");
                setDateFrom(undefined);
                setDateTo(undefined);
              }}
              hasActiveFilters={
                assemblyLineFilter !== "all" || !!dateFrom || !!dateTo
              }
            />
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
          <div
            ref={tableScrollRef}
            className="relative overflow-x-auto max-w-full"
            style={{ scrollbarGutter: "stable" }}
          >
            <div className="inline-block min-w-full align-middle">
              {loading && orders.length === 0 ? (
                <div className="p-10 text-center text-gray-600 ctm-load">
                  Loading...
                </div>
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
                          GMSOA NO.
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
                          SOA Sr. No.
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
                          Finished Valve
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
                          Remarks
                        </th>

                        <th className="sticky right-0 z-20 bg-white px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider border-l border-gray-200">
                          Actions
                        </th>
                      </tr>
                    </thead>

                    <tbody className="divide-y divide-gray-200">
                      {paginatedOrders.map((order) => (
                        <tr key={order.id} className="group hover:bg-gray-50">
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
                                title={order.remarks || "View Remarks"}
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

                              {order.remarks?.trim() && (
                                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block bg-gray-900 text-white text-xs px-3 py-2 rounded-md shadow-lg max-w-[260px] break-words z-[999]">
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
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  {filteredOrders.length === 0 && (
                    <div className="p-6 text-center text-gray-500">
                      No SVS stock found
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
                    <p className="text-gray-900 mt-1">{viewedOrder.gmsoaNo}</p>
                  </div>
                  <div>
                    <Label className="text-gray-500 text-sm">
                      SOA Sr. No.
                    </Label>
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
                    <Label className="text-gray-500 text-sm">Name Plate</Label>
                    <p className="text-gray-900 mt-1">
                      {viewedOrder.namePlate}
                    </p>
                  </div>
                  <div>
                    <Label className="text-gray-500 text-sm">
                      Special Notes
                    </Label>
                    <p className="text-gray-900 mt-1">
                      {viewedOrder.specialNotes || "N/A"}
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

      {/* Remarks Dialog (Read-only) */}
      <Dialog open={remarksDialogOpen} onOpenChange={setRemarksDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>View Remarks</DialogTitle>
            <DialogDescription>
              {remarksOrder ? `Order: ${remarksOrder.uniqueCode}` : ""}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <Label htmlFor="remarks">Remarks</Label>
            <Textarea
              id="remarks"
              value={remarksText}
              readOnly
              rows={6}
              className="resize-none bg-gray-50"
            />
          </div>

          <div className="flex justify-end pt-4 border-t border-gray-100">
            <Button
              variant="outline"
              onClick={() => setRemarksDialogOpen(false)}
            >
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}