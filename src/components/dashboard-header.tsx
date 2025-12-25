import React, { useState, useRef } from "react";
import axios from "axios";
import {
  Bell,
  LogOut,
  Plus,
  Upload,
  X,
  FileText,
  CheckCircle,
  XCircle,
  AlertTriangle,
} from "lucide-react";
import { Button } from "./ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "./ui/dialog";
import gmLogo from "../assets/gm-logo.png";
import * as XLSX from "xlsx";
import { FileSpreadsheet } from "lucide-react";

const handleDownloadDemoExcel = () => {
  const data = [
    {
      "SOA Number": "",
      "Unique Code": "",
      "Product": "",
      "Quantity": "",
      "Assembly Line": "",
      "Finished Valve": "Y/N",
    },
  ];
  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Order Format");
  XLSX.writeFile(wb, "GMV_Order_Format.xlsx");
};

interface DashboardHeaderProps {
  onLogout: () => void;
  currentPage?: string;
  onNavigate?: (page: string) => void;
  onUploadSuccess?: () => void;
  role?: string | null;
}

export const DashboardHeader: React.FC<DashboardHeaderProps> = ({
  onLogout,
  currentPage = "Dashboard",
  onNavigate,
  onUploadSuccess,
  role,
}) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const handleDialogOpenChange = (open: boolean) => {
    setIsDialogOpen(open);
    if (open) {
      setStatusType(null);
      setStatusMessage(null);
      setMismatchFileUrl(null);
      setLastErrorType(null);
      setUploading(false);
      setFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };
  const [file, setFile] = useState<File | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [statusType, setStatusType] = useState<"success" | "error" | "warning" | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const token = localStorage.getItem("token");

 
  const [mismatchFileUrl, setMismatchFileUrl] = useState<string | null>(null);
  const [lastErrorType, setLastErrorType] = useState<"header" | "validation" | null>(null);


const handleUpload = async (e: React.FormEvent) => {
  e.preventDefault();

  if (!file) {
    setStatusType("warning");
    setStatusMessage("⚠️ Please select a file first.");
    return;
  }

  const formData = new FormData();
  formData.append("file", file);

  try {
    setUploading(true);
    setMismatchFileUrl(null);
    setStatusMessage("Uploading...");
    setStatusType(null);

    const res = await axios.post(
      "https://gmvalve.lvpro.live/api/upload-order-file",
      formData,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          // ❌ don't manually set multipart header
        },
      }
    );

    const { Resp_code, Resp_desc, file_url } = res.data;
    console.log("Upload Response:", res.data);

if (Resp_code === "true") {
  setStatusType("success");
  setStatusMessage("File imported successfully!");
  setMismatchFileUrl(null);
  setLastErrorType(null);
  setFile(null);
  fileInputRef.current && (fileInputRef.current.value = "");
  onUploadSuccess?.();
  // setTimeout(() => {
    setIsDialogOpen(false);
    try { window.location.reload(); } catch {}
  // }, 300);

} else if (Resp_desc?.toLowerCase().includes("header mismatch")) {

  setStatusType("error");
  setStatusMessage("⚠️ Header mismatch found in your Excel file.");
  setMismatchFileUrl(file_url || null);
  setLastErrorType("header");

} else if (Resp_desc?.toLowerCase().includes("validation errors")) {

  setStatusType("error");
  setStatusMessage("Validation errors found in uploaded data.");
  setMismatchFileUrl(file_url || null);
  setLastErrorType("validation");

} else {
  setStatusType("error");
  setStatusMessage(`❌ ${Resp_desc || "Error uploading file."}`);
  setMismatchFileUrl(null);
  setLastErrorType(null);
}


  } catch (error) {
    console.error("Upload Error:", error);
    setStatusType("error");
    setStatusMessage("❌ Error uploading file.");
  } finally {
    setUploading(false);
  }
};


  // ✅ File handling (drag-drop + input)
  const handleFileSelect = (file: File) => {
    const allowedTypes = [
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "application/vnd.ms-excel",
      "text/csv",
    ];
    const allowedExtensions = [".xlsx", ".xls", ".csv"];
    const hasValidExtension = allowedExtensions.some((ext) =>
      file.name.toLowerCase().endsWith(ext)
    );

    if (allowedTypes.includes(file.type) || hasValidExtension) {
      setFile(file);
      setStatusMessage(null);
    } else {
      setStatusType("error");
      setStatusMessage("❌ Please select a valid Excel (.xlsx, .xls) or CSV (.csv) file.");
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) handleFileSelect(droppedFile);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleChooseFile = () => fileInputRef.current?.click();

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const chosenFile = e.target.files?.[0];
    if (chosenFile) handleFileSelect(chosenFile);
  };

  const handleRemoveFile = () => {
    setFile(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // ✅ Role-based navigation items
  const allNavItems = [
    { id: "Dashboard", label: "Dashboard" },
    { id: "Planning", label: "Planning" },
    { id: "MaterialIssue", label: "Material Issue" },
    { id: "SemiQC", label: "Semi QC" },
    { id: "PhosphatingQC", label: "After Phosphating QC" },
     { id: "Assembly-A", label: "Assembly A" },
  { id: "Assembly-B", label: "Assembly B" },
  { id: "Assembly-C", label: "Assembly C" },
  { id: "Assembly-D", label: "Assembly D" },
    { id: "Testing", label: "Testing" },
    { id: "SVS", label: "SVS" },
    { id: "Marking", label: "Marking" },
    { id: "PDI", label: "PDI" },
    { id: "TPI", label: "TPI" },
    { id: "Dispatch", label: "Dispatch" },
  ];

  const roleVisibility: Record<string, string[]> = {
    planning: ["Planning"],
    "material-issue": ["MaterialIssue"],
    "semi-qc": ["SemiQC"],
    "phosphating-qc": ["PhosphatingQC"],
    "assembly-a": ["Assembly-A"],
  "assembly-b": ["Assembly-B"],
  "assembly-c": ["Assembly-C"],
  "assembly-d": ["Assembly-D"],
    testing: ["Testing"],
    marking: ["Marking"],
    svs: ["SVS"],
    pdi: ["PDI"],
    tpi: ["TPI"],
    dispatch: ["Dispatch"],
    admin: allNavItems.map((i) => i.id),
  };

  const visibleNavItems =
    role && roleVisibility[role]
      ? allNavItems.filter((i) => roleVisibility[role].includes(i.id))
      : [];

  return (
    <>
      {/* HEADER */}
      <header className="glass-header relative z-50">
        <div className="mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex items-center space-x-8">
              <img src={gmLogo} alt="GM Logo" className="h-8 w-auto object-contain" />
            </div>

           
            <div className="flex items-center space-x-3">
  {role === "planning" && (
    <>
      {/* 📄 Demo Excel Button */}
      {/* Mobile: Actions dropdown (visible below 991px via CSS classes) */}
      <div className="relative mobile-only">
        <button
          className="w-full flex items-center justify-center gap-2 border-[#174a9f] text-[#174a9f] hover:bg-[#e8f0f9] transition-all shadow-sm px-3 py-2 rounded-md"
          aria-label="Menu"
          onClick={() => setMobileMenuOpen((v) => !v)}
        >
          <svg
            className="h-4 w-4"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="3" y1="6" x2="21" y2="6" />
            <line x1="3" y1="12" x2="21" y2="12" />
            <line x1="3" y1="18" x2="21" y2="18" />
          </svg>
        </button>
        {mobileMenuOpen && (
          <div className="absolute right-0 mt-2 w-48 rounded-md bg-white shadow-lg border z-50">
            <button
              className="w-full px-3 py-2 text-left hover:bg-gray-50 flex items-center gap-2"
              onClick={() => {
                const headers = [
                  "Assembly Line",
                  "SOA No.",
                  "SR. No.",
                  "Assembly Date",
                  "Unique Code",
                  "Splitted Code",
                  "Party",
                  "Customer PO No.",
                  "Code No",
                  "Product",
                  "Po Qty",
                  "Qty",
                  "Qty Exe.",
                  "Qty Pending",
                  "finished valve",
                  "GM Logo",
                  "Name Plate",
                  "Special Notes",
                  "Product Spcl 1",
                  "Product Spcl 2",
                  "Product Spcl 3",
                  "Inspection",
                  "Painting",
                  "Remarks",
                ];

                const row: Record<string, string> = {};
                headers.forEach((h) => (row[h] = ""));
                row["Assembly Date"] = "(dd-mm-yyyy)";

                const ws = XLSX.utils.json_to_sheet([row]);
                const wb = XLSX.utils.book_new();
                XLSX.utils.book_append_sheet(wb, ws, "Order Format");
                XLSX.writeFile(wb, "GMV_Order_Format.xlsx");
                setMobileMenuOpen(false);
              }}
            >
              <FileSpreadsheet className="h-4 w-4 text-[#174a9f]" />
              Demo Excel
            </button>
            <button
              className="w-full px-3 py-2 text-left hover:bg-gray-50 flex items-center gap-2"
              onClick={() => {
                setIsDialogOpen(true);
                setMobileMenuOpen(false);
              }}
            >
              <Plus className="h-4 w-4 text-[#174a9f]" />
              Add New Order
            </button>
          </div>
        )}
      </div>

      {/* Desktop: keep two buttons visible (992px and above via CSS classes) */}
      <div className="desktop-only gap-2 justify-end">
        <Button
          variant="outline"
          onClick={() => {
            const headers = [
              "Assembly Line",
                  "SOA No.",
                  "SR. No.",
                  "Assembly Date",
                  "Unique Code",
                  "Splitted Code",
                  "Party",
                  "Customer PO No.",
                  "Code No",
                  "Product",
                  "Po Qty",
                  "Qty",
                  "Qty Exe.",
                  "Qty Pending",
                  "finished valve",
                  "GM Logo",
                  "Name Plate",
                  "Special Notes",
                  "Product Spcl 1",
                  "Product Spcl 2",
                  "Product Spcl 3",
                  "Inspection",
                  "Painting",
                  "Remarks",
            ];

            const row: Record<string, string> = {};
            headers.forEach((h) => (row[h] = ""));
            row["Assembly Date"] = "(dd-mm-yyyy)";

            const ws = XLSX.utils.json_to_sheet([row]);
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, "Order Format");
            XLSX.writeFile(wb, "GMV_Order_Format.xlsx");
          }}
          className="flex items-center gap-2 border-[#174a9f] text-[#174a9f] hover:bg-[#e8f0f9] transition-all shadow-sm"
        >
          <FileSpreadsheet className="h-4 w-4" />
          Demo Excel
        </Button>

        {/* ➕ Add New Order Button */}
        <Button
          onClick={() => setIsDialogOpen(true)}
          className="flex items-center gap-2 bg-gradient-to-r from-[#174a9f] to-[#1a5cb8] hover:from-[#123a80] hover:to-[#174a9f] text-white shadow-md transition-all"
        >
          <Plus className="h-4 w-4" />
          Add New Order
        </Button>
      </div>
    </>
  )}

  {/* 🔔 Notifications */}
  <Button
    variant="ghost"
    size="sm"
    className="h-9 w-9 p-0 rounded-lg hover:bg-gray-100 relative"
  >
    <Bell className="h-4 w-4 text-gray-500" />
    <div className="absolute -top-1 -right-1 h-2 w-2 bg-red-500 rounded-full"></div>
  </Button>

  {/* 👤 Profile Menu */}
  <DropdownMenu>
    <DropdownMenuTrigger asChild>
      <Avatar className="h-9 w-9 cursor-pointer ring-2 ring-transparent hover:ring-[#a3c4e7] transition-all duration-300 hover:scale-110">
        <AvatarImage src="/api/placeholder/36/36" />
        <AvatarFallback className="bg-gradient-to-br from-[#2461c7] to-[#174a9f] text-white text-sm font-medium">
          GM
        </AvatarFallback>
      </Avatar>
    </DropdownMenuTrigger>
    <DropdownMenuContent align="end" className="w-48 mt-2">
      <DropdownMenuItem
        onClick={onLogout}
        className="text-red-600 cursor-pointer focus:bg-red-50"
      >
        <LogOut className="h-4 w-4 mr-2" />
        Sign Out
      </DropdownMenuItem>
    </DropdownMenuContent>
  </DropdownMenu>
</div>

          </div>
        </div>
      </header>

     
      {/* 🚀 Modern ADD NEW ORDER DIALOG */}
<Dialog open={isDialogOpen} onOpenChange={handleDialogOpenChange}>
  <DialogContent className="max-w-lg mx-auto bg-white rounded-2xl shadow-2xl border-0">
    <DialogHeader>
      <DialogTitle className="text-2xl font-semibold text-gray-900 text-center">
        Add New Order
      </DialogTitle>
      <DialogDescription className="text-gray-600 text-center">
        Upload an Excel or CSV file to add new orders to your system.
      </DialogDescription>
    </DialogHeader>

    <div className="p-6 space-y-6">
      {/* File Upload Box */}
      <div
        className={`
          relative border-2 border-dashed rounded-xl p-8 text-center transition-all duration-200
          ${isDragOver ? "border-[#174a9f] bg-[#e8f0f9]" : "border-gray-300 hover:border-gray-400"}
          ${file ? "bg-green-50 border-green-300" : ""}
        `}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
      >
        {file ? (
          <div className="space-y-4">
            <div className="mx-auto w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
              <FileText className="w-6 h-6 text-green-600" />
            </div>
            <p className="font-medium text-gray-900">{file.name}</p>
            <p className="text-sm text-gray-500 mt-1">{(file.size / 1024).toFixed(1)} KB</p>
            <Button
              variant="outline"
              size="sm"
              onClick={handleRemoveFile}
              className="text-red-600 border-red-200 hover:bg-red-50"
            >
              <X className="w-4 h-4 mr-2" />
              Remove File
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="mx-auto w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
              <Upload className="w-6 h-6 text-gray-600" />
            </div>
            <p className="text-lg font-medium text-gray-900 mb-2">
              Drag and drop your file here
            </p>
            <p className="text-gray-500 mb-4">or</p>
            <Button
              variant="outline"
              onClick={handleChooseFile}
              className="border-[#174a9f] text-[#174a9f] hover:bg-[#e8f0f9]"
            >
              Choose File
            </Button>
            <p className="text-xs text-gray-400">
              Supports Excel files (.xlsx, .xls) and CSV files (.csv)
            </p>
          </div>
        )}
      </div>

      {/* Upload Status */}
      {statusMessage && (
        <div
          className={`flex flex-col gap-2 text-sm p-3 rounded-md ${
            statusType === "success"
              ? "bg-green-50 text-green-700 border border-green-200"
              : statusType === "warning"
              ? "bg-yellow-50 text-yellow-700 border border-yellow-200"
              : statusType === "error"
              ? "bg-red-50 text-red-700 border border-red-200"
              : "text-gray-600"
          }`}
        >
          <div className="flex items-center gap-2">
            {statusType === "success" && <CheckCircle className="h-4 w-4" />}
            {statusType === "warning" && <AlertTriangle className="h-4 w-4" />}
            {statusType === "error" && <XCircle className="h-4 w-4" />}
            <span>
              {typeof statusMessage === "string" ? statusMessage : statusMessage}
            </span>
          </div>

          {/* 🧾 Show mismatch link if available */}
{mismatchFileUrl && (
  <div className="mt-2">
    <p className="text-sm font-medium text-gray-700">
      {lastErrorType === "header"
        ? "Your uploaded Excel headers don’t match the required format."
        : "Validation errors found in uploaded Excel data."}
    </p>

    <a
      href={mismatchFileUrl}
      download="Error_Report.xlsx"
      target="_blank"
      rel="noopener noreferrer"
      className="text-blue-600 underline hover:text-blue-800 text-sm"
    >
      Download error report
    </a>
  </div>
)}




        </div>
      )}

      {/* Footer Buttons */}
      <div className="flex gap-3 justify-end pt-4 border-t border-gray-100">
        <Button variant="outline" onClick={() => setIsDialogOpen(false)} className="px-6">
          Cancel
        </Button>
        <Button
          onClick={handleUpload}
          disabled={!file || uploading}
          className="px-6 bg-[#1457f6] hover:bg-[#1145d4] text-white shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {uploading ? "Uploading..." : "Submit"}
        </Button>
      </div>
    </div>

    {/* Hidden File Input */}
    <input
      type="file"
      ref={fileInputRef}
      onChange={handleFileInputChange}
      accept=".xlsx,.xls,.csv"
      className="hidden"
    />
  </DialogContent>
</Dialog>

    </>
  );
};
