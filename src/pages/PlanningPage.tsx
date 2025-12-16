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

import { Checkbox } from "../components/ui/checkbox";
import { useOrderContext } from "../components/order-context";
import { OrderFilters } from "../components/order-filters";
import { API_URL } from "../config/api.ts";

import { DashboardHeader } from "../components/dashboard-header.tsx";
// import { FullPageLoader } from "../components/loading-skeleton";
import { getStepLabel } from "../config/workflowSteps";
import TablePagination from "../components/table-pagination";

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
  poQty: number;
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
  // Preserve the original list position so items return when unmarked urgent
  originalIndex: number;
}

export function PlanningPage() {
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

  // Upload file
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // refs
  const tableScrollRef = useRef<HTMLDivElement | null>(null);

  // token
  const token = localStorage.getItem("token");
  // role helper
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

  // Fetch orders from API (POST)
  const fetchOrders = async () => {
    try {
      setLoading(true);
      setError(null);

      const currentStage = "planning";
      const stageLabel = getStepLabel(currentStage);
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
            splittedCode: item.splitted_code || "",
            split_id: item.split_id || item.splitted_code || "",
            party: item.party_name || item.party || "",
            customerPoNo: item.customer_po_no || "",
            codeNo: item.code_no || "",
            product: item.product || "",
            poQty: Number(item.po_qty ?? item.qty ?? 0),
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

            // ✅ Preserve urgent flag properly (backend sends 0 or 1)
            alertStatus:
              item.is_urgent === true ||
              item.is_urgent === "true" ||
              item.alert_status === true ||
              item.alert_status === "true" ||
              item.urgent === 1 ||
              item.urgent === "1",

            // Track original position to restore when urgent is cleared
            originalIndex: index,
          })
        );

        console.log("✅ Orders fetched:", apiOrders.length, "records");
        // Sort so urgent items appear at top on initial load
        setOrders(sortOrders(apiOrders));
        setFullOrders(null);
        const p = res?.data?.pagination;
        if (p) {
          const nextTotal = Number(p.total ?? apiOrders.length);
          const nextPer = Number(p.per_page ?? perPage);
          const nextPage = Number(p.current_page ?? page);
          const lastRaw = (p.last_page ?? Math.ceil(nextTotal / Math.max(nextPer, 1)));
          const nextLast = Number(lastRaw || 1);
          setTotal(nextTotal);
          setPerPage(nextPer);
          setPage(nextPage);
          setLastPage(nextLast);
        } else {
          const nextTotal = apiOrders.length;
          setTotal(nextTotal);
          setLastPage(Math.max(1, Math.ceil(nextTotal / Math.max(perPage, 1))));
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

  useEffect(() => {
    fetchOrders();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, perPage]);

  const useGlobalSearch = useMemo(() => {
    const hasSearch = localSearchTerm.trim().length > 0;
    const hasFilters = assemblyLineFilter !== "all" || gmsoaFilter !== "all" || partyFilter !== "all";
    const hasDate = Boolean(dateFrom) || Boolean(dateTo);
    return hasSearch || hasFilters || hasDate || showUrgentOnly;
  }, [localSearchTerm, assemblyLineFilter, gmsoaFilter, partyFilter, dateFrom, dateTo, showUrgentOnly]);

  const fetchAllPages = async () => {
    try {
      setLoading(true);
      const currentStage = "planning";
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
            splittedCode: item.splitted_code || "",
            split_id: item.split_id || item.splitted_code || "",
            party: item.party_name || item.party || "",
            customerPoNo: item.customer_po_no || "",
            codeNo: item.code_no || "",
            product: item.product || "",
            poQty: Number(item.po_qty ?? item.qty ?? 0),
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
      // Deduplicate by composite key
      const seen = new Set<string>();
      const makeRowKey = (o: AssemblyOrderData) => o.splittedCode || o.split_id || o.uniqueCode || o.id;
      const deduped = all.filter((o) => {
        const key = makeRowKey(o);
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });
      setFullOrders(sortOrders(deduped));
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

  const filteredOrders = useMemo(() => {
    const source = useGlobalSearch && fullOrders ? fullOrders : orders;
    let filtered = source.slice();

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

    // ⬇️ UPDATED DATE FILTER SECTION
    if (dateFrom || dateTo) {
      filtered = filtered.filter((order) => {
        // skip HOLD or invalid dates
        if (!order.assemblyDate || order.assemblyDate === "HOLD") return false;

        // Strict dd-mm-yyyy parser
        const parseDMY = (str: string | null | undefined): Date | null => {
          if (!str) return null;

          // Only dd-mm-yyyy accepted
          const match = str.trim().match(/^(\d{1,2})-(\d{1,2})-(\d{4})$/);
          if (!match) return null;

          const [, d, m, y] = match;
          const day = Number(d);
          const month = Number(m);
          const year = Number(y);

          // Create date
          const date = new Date(year, month - 1, day);

          // Validate (avoid auto-correcting by JS Date)
          if (
            date.getFullYear() !== year ||
            date.getMonth() !== month - 1 ||
            date.getDate() !== day
          ) {
            return null;
          }

          return date;
        };

        const orderDate = parseDMY(order.assemblyDate);
        if (!orderDate) return false;

        // Year filter mode
        if (dateFilterMode === "year" && dateFrom) {
          return orderDate.getFullYear() === dateFrom.getFullYear();
        }

        // Month filter mode
        if (dateFilterMode === "month" && dateFrom) {
          return (
            orderDate.getFullYear() === dateFrom.getFullYear() &&
            orderDate.getMonth() === dateFrom.getMonth()
          );
        }

        // Range filter mode
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

    return filtered;
  }, [
    orders,
    fullOrders,
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

  const paginatedOrders = useMemo(() => {
    const start = (page - 1) * perPage;
    return filteredOrders.slice(start, start + perPage);
  }, [filteredOrders, page, perPage]);

  useEffect(() => {
    setPage(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [localSearchTerm, assemblyLineFilter, gmsoaFilter, partyFilter, dateFrom, dateTo, showUrgentOnly]);

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
  const handleQuickAssign = (order: AssemblyOrderData) => {
    setSelectedOrder(order);
    setQuickAssignOpen(true);
    setQuickAssignStep("");
    setQuickAssignQty(String(order.qtyPending ?? order.qty ?? 0));
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

    if (!quickAssignQty || mainQty <= 0)
      errs.quickAssignQty = "Quantity is required and must be > 0";
    if (mainQty > maxQty)
      errs.quickAssignQty = `Cannot exceed available (${maxQty})`;

    if (splitOrder) {
      if (!splitAssignStep) errs.splitAssignStep = "Choose second step";
      if (!splitAssignQty || splitQty <= 0)
        errs.splitAssignQty = "Split qty required";
      if (
        quickAssignStep &&
        splitAssignStep &&
        quickAssignStep === splitAssignStep
      )
        errs.sameEngineer = "Choose different steps";
      const total = mainQty + splitQty;
      if (total !== maxQty)
        errs.totalQtyMismatch = `Split total must equal ${maxQty} (current ${total})`;
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
      <div class="bin-card">
        <div class="content">

          <div class="title">
            Assembly Line: ${order.assemblyLine}
          </div>

          <div class="meta">
            <div><span class="label">Date:</span> ${order.assemblyDate}</div>
            <div><span class="label">SOA:</span> ${order.gmsoaNo}-${order.soaSrNo}</div>
          </div>

          <div class="desc">
            <span class="label">Item:</span>
            <div class="text">${order.product}</div>
          </div>

          <div class="qty-logo">
            <div><span class="label">QTY:</span> ${order.qty}</div>
            <div><span class="label">Logo:</span> ${order.gmLogo}</div>
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

        /* OUTER SAFE AREA */
        .bin-card {
          width: 130mm;
          height: 85mm;
          padding: 6mm;
          box-sizing: border-box;
          page-break-after: always;
        }

        /* BORDER + INNER PADDING */
        .content {
          width: 100%;
          height: 100%;
          border: 1.5px solid #000;
          border-radius: 10px;
          padding: 6mm;
          box-sizing: border-box;

          display: flex;
          flex-direction: column;
        }

        /* HEADER */
        .title {
          text-align: center;
          font-size: 12px;
          font-weight: 700;
          margin-bottom: 2mm;
        }

        /* DATE + SOA */
        .meta {
          font-size: 9.5px;
          line-height: 1.25;
          margin-bottom: 2mm;
        }

        .meta div {
          margin-bottom: 0.5mm;
        }

        /* ITEM */
        .desc {
          font-size: 9px;
          line-height: 1.25;
          margin-bottom: 2.5mm;
        }

        .desc .label {
          display: block;
          font-size: 9.5px;
          margin-bottom: 0.5mm;
        }

        .desc .text {
          word-break: break-word;
        }

        /* QTY + LOGO */
        .qty-logo {
          font-size: 9.5px;
          line-height: 1.3;
          margin-bottom: 4mm;
        }

        .qty-logo div {
          margin-bottom: 0.5mm;
        }

        /* INSPECTED BY */
        .inspect {
          margin-top: auto;
          font-size: 9.5px;
        }

        .inspect .label {
          display: block;
          margin-bottom: 1.5mm;
        }

        .inspect-line {
          height: 6mm;
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
    setTimeout(() => {
      document.body.removeChild(iframe);
    }, 500);
  }, 300);
};

//   const handlePrintBinCard = () => {
//   const CARD_WIDTH = 491; // px
//   const CARD_HEIGHT = 322; // px

//   const cards = selectedOrdersData
//     .map(
//       (order) => `
//       <div class="card">
//         <h2>Assembly Line: ${order.assemblyLine}</h2>
        
//         <div class="row">
//           <div><strong>Assembly Date:</strong> ${order.assemblyDate}</div>
//           <div><strong>GMSOA No - SR. NO:</strong> ${order.gmsoaNo} - ${order.soaSrNo}</div>
//         </div>

//         <div class="desc">
//           <strong>Item Description:</strong>
//           <span>${order.product}</span>
//         </div>

//         <div class="row">
//           <div><strong>QTY:</strong> ${order.qty}</div>
//           <div><strong>GM Logo:</strong> ${order.gmLogo}</div>
//         </div>

//         <div class="inspect">
//           <strong>Inspected by:</strong>
//           <div class="line"></div>
//         </div>
//       </div>`
//     )
//     .join("");

//   const html = `
//   <!doctype html>
//   <html>
//     <head>
//       <meta charset="utf-8" />
//       <style>
//         @page {
//           size: A4;
//           margin: 10mm;
//         }

//         body {
//           font-family: Arial, sans-serif;
//           margin: 0;
//           padding: 20px 152px;
//           display: flex;
//           justify-content: center;
//           align-items: center;
//           flex-direction: column;
//           gap: 5px;
//         }

//         .card {
//         width: 100%;
//           // width: ${CARD_WIDTH}px;
//           // height: ${CARD_HEIGHT}px;
//           height: 322px;
//           border: 1px solid #333;
//           border-radius: 10px;
//           padding: 10px 15px;
//           box-sizing: border-box;
//           display: flex;
//           justify-content: center;
//           // align-items: start;
//           flex-direction: column;
//         }

//         h2 {
//           text-align: center;
//           margin: 0 0 20px 0;
//           font-size: 16px;
//         }

//         .row {
//           display: flex;
//           justify-content: space-between;
//           font-size: 12px;
//         }

//         .desc span {
//           font-size: 11px;
//           line-height: 1.3;
//         }

//         .inspect .line {
//           margin-top: 8px;
//           border-bottom: 1px solid #444;
//           height: 25px;
//         }
//       </style>
//     </head>

//     <body>${cards}</body>
//   </html>`;

//   const iframe = document.createElement("iframe");
//   iframe.style.position = "fixed";
//   iframe.style.width = "0";
//   iframe.style.height = "0";
//   iframe.style.border = "0";

//   document.body.appendChild(iframe);

//   const doc = iframe.contentDocument || iframe.contentWindow.document;
//   doc.open();
//   doc.write(html);
//   doc.close();

//   setTimeout(() => {
//     iframe.contentWindow.print();
//     setTimeout(() => document.body.removeChild(iframe), 500);
//   }, 200);
// };


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

  // ✅ Assign order to next workflow stage
  const handleAssignOrder = async () => {
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
      formData.append("totalQty", String(selectedOrder.qty));
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
          formDataSplit.append("totalQty", String(selectedOrder.qty));
          formDataSplit.append("executedQty", String(splitQty));
          formDataSplit.append("split_id", String(selectedOrder.split_id || ""));
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
            const mainStage = responseMain.data?.data?.to_stage || "next stage";
            const splitStage =
              responseSplit.data?.data?.to_stage || "next stage";
            setAssignStatus({
              type: "success",
              message: `✅ Order assigned successfully! 
Main: ${mainQty} units to ${mainStage} 
Split: ${splitQty} units to ${splitStage}`,
            });
          } else {
            setAssignStatus({
              type: "error",
              message: `⚠️ Main assigned, but split failed: ${
                responseSplit.data?.Resp_desc || "Unknown error"
              }`,
            });
          }
        } else {
          const toStage = responseMain.data?.data?.to_stage || "next stage";
          const fromStage =
            responseMain.data?.data?.from_stage || "current stage";
          setAssignStatus({
            type: "success",
            message: `✅ Order assigned successfully! 
${mainQty} units moved from ${fromStage} → ${toStage}`,
          });
        }

        await fetchOrders();
          setQuickAssignOpen(false);
          setAssignStatus(null);
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
    }
  };

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

        // ✅ Add this block below fetchOrders()
        // This identifies orders with Finished Valve = Yes
        const finishedValveOrders = orders.filter(
          (o) => String(o.finishedValve).trim().toLowerCase() === "yes"
        );

        // Optional debug log — visible in browser console
        console.log(
          "✅ Finished Valve Orders ready for SVS:",
          finishedValveOrders.length
        );
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
      <div id="printable-bin-card" style={{ display: "none" }}></div>

      
      <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in bg-white min-h-screen">
        {/* {loading && orders.length === 0 && <FullPageLoader />} */}
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col lg:flex-row lg:justify-between lg:items-start gap-6">
            <div>
              <h1 className="text-gray-900 mb-2 text-2xl font-semibold">
                Orders Management
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
                    className="pl-10 w-full bg-white/80 backdrop-blur-sm border-gray-200/60 relative z-0 "
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
            currentStage="default"
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
                <>
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
                    <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200 w-20">
                      Party
                    </th>
                    <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200">
                      Customer PO No.
                    </th>
                    <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200">
                      Code No
                    </th>
                    <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-20">
                      Product
                    </th>
                    <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200">
                      PO QTY
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
                        <div  style={{ width: "120px" }}>
                        {order.party}
                        </div>
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap text-center text-sm text-gray-900">
                        {order.customerPoNo}
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap text-center text-sm text-gray-900">
                        {order.codeNo}
                      </td>

                    <td className="px-3 py-2 text-center text-sm text-gray-900 min-w-90">
  <div
    className="line-clamp-2"
    style={{ width: "300px" }}
    title={order.product}   // 👈 shows full text on hover
  >
    {order.product}
  </div>
</td>

                      <td className="px-3 py-2 whitespace-nowrap text-center text-sm text-gray-900">
                        {order.poQty}
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
                        {/* <Button
                          size="sm"
                          variant="ghost"
                          className={`h-7 w-7 p-0 ${
                            getRemark(order.id)
                              ? "bg-[#174a9f] hover:bg-[#123a7f]"
                              : "hover:bg-[#d1e2f3]"
                          }`}
                          title="Add/Edit Remarks"
                          onClick={() => handleOpenRemarks(order)}
                        >
                          <MessageSquarePlus
                            className={`h-4 w-4 ${
                              getRemark(order.id)
                                ? "text-white"
                                : "text-blue-600"
                            }`}
                          />
                        </Button> */}
                        <Button
                          size="sm"
                          variant="ghost"
                          className={`h-7 w-7 p-0 ${
                            order.remarks && order.remarks.trim() !== "" // backend value
                              ? "bg-[#174a9f] hover:bg-[#123a7f]"
                              : "hover:bg-[#d1e2f3]"
                          }`}
                          title="Add/Edit Remarks"
                          onClick={() => handleOpenRemarks(order)}
                        >
                          <MessageSquarePlus
                            className={`h-4 w-4 ${
                              order.remarks && order.remarks.trim() !== ""
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
                            title={
                              order.alertStatus
                                ? "Click to unmark urgent"
                                : "Click to mark as urgent"
                            }
                            onClick={() => {
                              console.clear();
                              console.log(
                                "BUTTON CLICKED → orderId:",
                                order.id
                              );
                              console.log(
                                "BEFORE CLICK → alertStatus:",
                                order.alertStatus
                              );
                              toggleAlertStatus(order.id);
                            }}
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
          lastPage={Math.max(1, Math.ceil(filteredOrders.length / Math.max(perPage, 1)))}
          onChangePage={setPage}
          onChangePerPage={setPerPage}
          disabled={loading}
        />

        {/* Quick Assign Dialog */}
        {/* <Dialog open={quickAssignOpen} onOpenChange={setQuickAssignOpen}>
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
                    <SelectTrigger id="assignStep">
                      <SelectValue placeholder="Select step" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="material-issue">Material Issue</SelectItem>
                      <SelectItem value="semi-qc">Semi QC</SelectItem>
                      <SelectItem value="after-phosphating">After Phosphating QC</SelectItem>
                      <SelectItem value="assembly">Assembly</SelectItem>
                      <SelectItem value="testing">Testing</SelectItem>
                      <SelectItem value="marking">Marking</SelectItem>
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
                  />
                </div>
              </div>

              <div className="text-sm text-gray-500">
                Available Quantity:{" "}
                <span className="font-medium text-gray-900">{selectedOrder?.qtyPending}</span>
              </div>
            </div>

            <div className="space-y-4 border-t pt-4">
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
                          <SelectValue placeholder="Select step" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="material-issue">Material Issue</SelectItem>
                          <SelectItem value="semi-qc">Semi QC</SelectItem>
                          <SelectItem value="after-phosphating">After Phosphating QC</SelectItem>
                          <SelectItem value="assembly">Assembly</SelectItem>
                          <SelectItem value="testing">Testing</SelectItem>
                          <SelectItem value="marking">Marking</SelectItem>
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
            </div>
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
            <Button variant="outline" onClick={handleQuickAssignCancel}>
              Cancel
            </Button>
            <Button
              onClick={() =>
                handleAssignOrder(
                  Number(selectedOrder.id),
                  Number(selectedOrder.qty),
                  Number(quickAssignQty),
                  Number(splitAssignQty),
                  splitOrder
                )
              }
              className="bg-black hover:bg-gray-800 text-white"
            >
              Assign
            </Button>
          </div>
        </DialogContent>
      </Dialog> */}

        {/* Bin Card Dialog */}
        {/* <Dialog open={binCardDialogOpen} onOpenChange={setBinCardDialogOpen}>
        <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">

          <div className="space-y-6 py-4">
            {selectedOrdersData.map((order) => (
              <div key={order.id} className="border border-gray-200 rounded-lg p-6 space-y-4 bg-white">
                <div className="text-center pb-2 border-b border-gray-200">
                  <p className="text-lg"><span className="text-gray-600">Assembly Line:</span> <span className="text-gray-900 font-bold text-xl">{order.assemblyLine}</span></p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-gray-500 text-sm">Assembly Date</Label>
                    <p className="text-gray-900 mt-1">{order.assemblyDate}</p>
                  </div>
                  <div>
                    <Label className="text-gray-500 text-sm">GMSOA No - SR. NO.</Label>
                    <p className="text-gray-900 mt-1">{order.gmsoaNo} - {order.soaSrNo}</p>
                  </div>
                </div>

                <div>
                  <Label className="text-gray-500 text-sm">Item Description</Label>
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
                    <Label className="text-gray-500 text-sm whitespace-nowrap">Inspected by:</Label>
                    <div className="border-b border-gray-400 flex-1 h-8"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-end space-x-3 pt-4 border-t border-gray-100">
            <Button variant="outline" onClick={() => setBinCardDialogOpen(false)}>Cancel</Button>
            <Button onClick={handlePrintBinCard} className="bg-blue-600 text-white">
              <Printer className="h-4 w-4" />
              Print
            </Button>
          </div>
        </DialogContent>
      </Dialog> */}

        {/* Bin Card Preview Dialog */}
        <Dialog open={binCardDialogOpen} onOpenChange={setBinCardDialogOpen}>
          <DialogContent className="!max-w-[1000px] max-h-[90vh] overflow-y-auto print-bin-card">
            <DialogHeader>
              <DialogTitle className="text-xl font-semibold text-gray-900">
                Bin Card Preview
              </DialogTitle>
              <DialogDescription>
                Review the bin card details before printing.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6 py-4">
              {selectedOrdersData.map((order) => (
                <div
                  key={order.id}
                  className="border border-gray-300 rounded-xl p-6 bg-white shadow-sm"
                  style={{ marginBottom: "30px" }} // <- margin bottom fix
                >
                  <h2 className="text-lg font-bold text-center mb-4">
                    Assembly Line: {order.assemblyLine}
                  </h2>

                  <div className="grid grid-cols-2 gap-4 text-sm mb-4">
                    <div>
                      <strong>Assembly Date:</strong> {order.assemblyDate}
                    </div>
                    <div>
                      <strong>GMSOA No - SR. NO:</strong> {order.gmsoaNo} -{" "}
                      {order.soaSrNo}
                    </div>
                  </div>

                  <div className="mb-4">
                    <strong>Item Description:</strong>
                    <p>{order.product}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-sm mb-4">
                    <div>
                      <strong>QTY:</strong> {order.qty}
                    </div>
                    <div>
                      <strong>GM Logo:</strong> {order.gmLogo}
                    </div>
                  </div>

                  <div className="mt-6 pt-4 border-t border-gray-300">
                    <strong>Inspected by:</strong>
                    <div className="border-b border-gray-400 h-8"></div>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
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
                <Printer className="h-4 w-4" /> Print
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
                        {viewedOrder.remarks || "-"}
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

export default PlanningPage;
