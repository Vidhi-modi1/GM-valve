// src/pages/Pdi1Page.tsx
import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
import { Search, Printer } from "lucide-react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Badge } from "../components/ui/badge";
import { API_URL } from "../config/api";
import { useOrderContext } from "../components/order-context";

/**
 * SVS Page:
 * - Shows only orders where Finished Valve = "Yes"
 * - Supports file upload (for SVS updates if needed)
 * - Allows filtering/search and printing
 */

interface OrderData {
  id: string;
  gmsoaNo: string;
  soaSrNo: string;
  uniqueCode: string;
  assemblyDate: string;
  party: string;
  product: string;
  qty: number;
  finishedValve: string;
}

const Pdi1Page: React.FC = () => {
  const { getRemark } = useOrderContext();

  const [orders, setOrders] = useState<OrderData[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<OrderData[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  // File upload states
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const token = localStorage.getItem("token");

  // Fetch only SVS-relevant data (finishedValve = "Yes")
  const fetchOrders = async () => {
    try {
      setLoading(true);
      const res = await axios.post(
        `${API_URL}/order-list`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const ok =
        res?.data?.Resp_code === "true" ||
        res?.data?.Resp_code === true ||
        res?.data?.Resp_code === "RCS";

      if (ok && Array.isArray(res.data.data)) {
        const allOrders = res.data.data.map((item: any) => ({
          id: String(item.id),
          gmsoaNo: item.soa_no || "",
          soaSrNo: item.soa_sr_no || "",
          uniqueCode: item.unique_code || item.order_no || "",
          assemblyDate: item.assembly_date || "",
          party: item.party_name || item.party || "",
          product: item.product || "",
          qty: Number(item.qty || 0),
          finishedValve: item.finished_valve || "",
        }));

        // ✅ Filter only orders where finishedValve = "Yes"
        const finishedOrders = allOrders.filter(
          (o) => String(o.finishedValve).trim().toLowerCase() === "yes"
        );

        setOrders(finishedOrders);
        setFilteredOrders(finishedOrders);
      } else {
        setOrders([]);
      }
    } catch (error) {
      console.error("Error fetching SVS orders:", error);
    } finally {
      setLoading(false);
    }
  };

  // Filter by search term
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredOrders(orders);
    } else {
      const term = searchTerm.toLowerCase();
      setFilteredOrders(
        orders.filter(
          (o) =>
            o.uniqueCode.toLowerCase().includes(term) ||
            o.gmsoaNo.toLowerCase().includes(term) ||
            o.party.toLowerCase().includes(term)
        )
      );
    }
  }, [searchTerm, orders]);

  useEffect(() => {
    fetchOrders();
  }, []);

  // File Upload (if needed for SVS updates)
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
      const res = await axios.post(`${API_URL}/upload-order-file`, fd, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (
        res.data?.status === true ||
        res.data?.Resp_code === "RCS" ||
        res.data?.Resp_code === "true"
      ) {
        setMessage("✅ File uploaded successfully");
        setFile(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
        await fetchOrders();
      } else {
        setMessage(res.data?.message || "Upload failed");
      }
    } catch (err) {
      console.error("Upload error", err);
      setMessage("Error uploading file");
    } finally {
      setUploading(false);
      setTimeout(() => setMessage(null), 4000);
    }
  };

  // Print SVS list
  const handlePrint = () => window.print();

  return (
    <div className="max-w-7xl mx-auto px-6 py-8 bg-white rounded-lg shadow-sm animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Stock Valve Store (SVS)</h1>
          <p className="text-gray-600">
            Orders where <strong>Finished Valve = Yes</strong>
          </p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              type="text"
              placeholder="Search by Unique Code, GMSOA No, or Party..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-72 bg-white border-gray-200"
            />
          </div>

          <Button onClick={handlePrint} variant="outline" className="flex items-center gap-2">
            <Printer className="h-4 w-4" />
            Print
          </Button>
        </div>
      </div>

      {/* Upload file */}
      <form onSubmit={handleUpload} className="bg-gray-50 border border-gray-200 rounded-xl p-4 mb-6">
        <h2 className="text-md font-semibold text-gray-700 mb-3">Upload SVS Update File</h2>
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
            disabled={uploading}
            className="bg-gradient-to-r from-[#174a9f] to-[#1a5cb8] text-white"
          >
            {uploading ? "Uploading..." : "Upload"}
          </Button>
          {message && (
            <div className="text-sm text-blue-700 bg-blue-50 border border-blue-200 px-3 py-1 rounded">
              {message}
            </div>
          )}
        </div>
      </form>

      {/* Orders Table */}
      <div className="border border-gray-200 rounded-lg overflow-hidden">
        <table className="min-w-full text-sm text-gray-900">
          <thead className="bg-gray-100 text-gray-700">
            <tr>
              <th className="px-3 py-2 border">GMSOA No</th>
              <th className="px-3 py-2 border">SOA Sr No</th>
              <th className="px-3 py-2 border">Unique Code</th>
              <th className="px-3 py-2 border">Assembly Date</th>
              <th className="px-3 py-2 border">Party</th>
              <th className="px-3 py-2 border w-80">Product</th>
              <th className="px-3 py-2 border">Qty</th>
              <th className="px-3 py-2 border">Finished Valve</th>
            </tr>
          </thead>
          <tbody>
            {filteredOrders.map((order) => (
              <tr key={order.id} className="hover:bg-gray-50">
                <td className="px-3 py-2 border text-center">{order.gmsoaNo}</td>
                <td className="px-3 py-2 border text-center">{order.soaSrNo}</td>
                <td className="px-3 py-2 border text-center font-mono">{order.uniqueCode}</td>
                <td className="px-3 py-2 border text-center">{order.assemblyDate}</td>
                <td className="px-3 py-2 border text-center">{order.party}</td>
                <td className="px-3 py-2 border">{order.product}</td>
                <td className="px-3 py-2 border text-center">{order.qty}</td>
                <td className="px-3 py-2 border text-center">
                  <Badge
                    variant="outline"
                    className="bg-green-50 text-green-700 border-green-200"
                  >
                    {order.finishedValve}
                  </Badge>
                </td>
              </tr>
            ))}
            {filteredOrders.length === 0 && !loading && (
              <tr>
                <td colSpan={8} className="text-center py-6 text-gray-500">
                  No finished valve orders found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Pdi1Page;
