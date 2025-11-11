import React, { useState, useRef } from "react";
import axios from "axios";
import {
  Bell,
  LogOut,
  Plus,
  FileSpreadsheet,
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
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [statusType, setStatusType] = useState<"success" | "error" | "warning" | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const token = localStorage.getItem("token");

  // ✅ Handle upload
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
      setStatusType(null);
      setStatusMessage("Uploading...");

      const res = await axios.post(
        "http://192.168.1.17:2010/api/upload-order-file",
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
        }
      );

      console.log("Upload Response:", res.data);
      const msg = res.data?.Resp_desc || res.data?.message || "Upload response received.";

      if (res.data?.Resp_code === "true" || res.data?.status === true) {
        setStatusType("success");
        setStatusMessage("✅ File uploaded successfully!");
        setFile(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
        onUploadSuccess?.();
        setTimeout(() => setIsDialogOpen(false), 1000);
      } else if (msg.toLowerCase().includes("header mismatch")) {
        setStatusType("warning");
        setStatusMessage("⚠️ Header mismatch found. Please check your Excel headers.");
      } else if (msg.toLowerCase().includes("invalid format")) {
        setStatusType("error");
        setStatusMessage("❌ Invalid format. Please upload a valid Excel or CSV file.");
      } else {
        setStatusType("error");
        setStatusMessage(`❌ ${msg}`);
      }
    } catch (err) {
      console.error(err);
      setStatusType("error");
      setStatusMessage("❌ Error uploading file.");
    } finally {
      setUploading(false);
    }
  };

  // ✅ All navigation options
  const allNavItems = [
    { id: "Dashboard", label: "Dashboard" },
    { id: "Planning", label: "Planning" },
    { id: "MaterialIssue", label: "Material Issue" },
    { id: "SemiQC", label: "Semi QC" },
    { id: "PhosphatingQC", label: "After Phosphating QC" },
    { id: "Assembly", label: "Assembly" },
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
    assembly: ["Assembly"],
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
      <header className="bg-white shadow-md backdrop-blur-lg border-b border-gray-100">
        <div className="mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo + Navigation */}
            <div className="flex items-center space-x-8">
              <div className="flex items-center flex-shrink-0">
                <img src={gmLogo} alt="GM Logo" className="h-8 w-auto object-contain" />
              </div>

              <nav className="hidden md:flex items-center space-x-1">
                {visibleNavItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => onNavigate?.(item.id)}
                    className={`px-3 py-2 text-sm font-medium rounded-md transition-all duration-200 ${
                      currentPage === item.id
                        ? "text-[#174a9f] border-b-2 border-[#174a9f]"
                        : "text-gray-600 hover:text-[#174a9f]"
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </nav>
            </div>

            {/* Right Section */}
            <div className="flex items-center space-x-3">
              {role === "planning" && (
                <Button
                  onClick={() => setIsDialogOpen(true)}
                  className="flex items-center gap-2 bg-gradient-to-r from-[#174a9f] to-[#1a5cb8] hover:from-[#123a80] hover:to-[#174a9f] text-white shadow-md transition-all"
                >
                  <Plus className="h-4 w-4" />
                  Add New Order
                </Button>
              )}

              <Button
                variant="ghost"
                size="sm"
                className="h-9 w-9 p-0 rounded-lg hover:bg-gray-100 relative"
              >
                <Bell className="h-4 w-4 text-gray-500" />
                <div className="absolute -top-1 -right-1 h-2 w-2 bg-red-500 rounded-full"></div>
              </Button>

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

        <div className="bg-gradient-to-r from-[#e8f0f9]/50 to-indigo-50/50 border-t border-gray-100/60">
          <div className="max-w-7xl mx-auto px-4 py-3">
            <p className="text-gray-600 text-sm">Your manufacturing operations dashboard.</p>
          </div>
        </div>
      </header>

      {/* ADD NEW ORDER DIALOG */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold text-[#174a9f] flex items-center gap-2">
              <FileSpreadsheet className="h-5 w-5 text-[#174a9f]" />
              Upload Order File
            </DialogTitle>
            <DialogDescription>
              Select and upload an Excel (.xlsx) or CSV file containing new orders.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleUpload} className="space-y-5 pt-4">
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-gray-700">Choose File</label>
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.csv"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
                className="border border-gray-300 rounded-lg p-2 text-sm cursor-pointer bg-white hover:border-[#174a9f]/60 transition-all duration-200 py-2 px-4"
              />
              {file && (
                <p className="text-xs text-gray-600 mt-1">
                  Selected file: <span className="font-medium">{file.name}</span>
                </p>
              )}
            </div>

            {statusMessage && (
              <div
                className={`flex items-center gap-2 text-sm p-2 rounded-md ${
                  statusType === "success"
                    ? "bg-green-50 text-green-700 border border-green-200"
                    : statusType === "warning"
                    ? "bg-yellow-50 text-yellow-700 border border-yellow-200"
                    : statusType === "error"
                    ? "bg-red-50 text-red-700 border border-red-200"
                    : "text-gray-600"
                }`}
              >
                {statusType === "success" && <CheckCircle className="h-4 w-4" />}
                {statusType === "warning" && <AlertTriangle className="h-4 w-4" />}
                {statusType === "error" && <XCircle className="h-4 w-4" />}
                <span>{statusMessage}</span>
              </div>
            )}

            <div className="flex justify-end gap-3 pt-3 border-t border-gray-100">
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={uploading}
                className="bg-gradient-to-r from-[#174a9f] to-[#1a5cb8] text-white"
              >
                {uploading ? "Uploading..." : "Upload"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
};
