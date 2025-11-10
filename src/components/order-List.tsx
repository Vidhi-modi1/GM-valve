import React, { useEffect, useState } from "react";
import { fetchOrderList, Order } from "../services/order-services";

export default function OrderList() {
  const [rows, setRows] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setErr(null);
    try {
      const data = await fetchOrderList();
      setRows(data);
    } catch (e: any) {
      setErr(e?.message || "Failed to load orders");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  if (loading) return <p>Loading orders...</p>;
  if (err) return <p className="text-red-600">{err}</p>;

  return (
    <div className="overflow-auto rounded-xl border">
      <table className="min-w-full text-sm">
        <thead className="bg-gray-50">
          <tr>
            <th className="text-left p-3">#</th>
            <th className="text-left p-3">Order No</th>
            <th className="text-left p-3">Party</th>
            <th className="text-left p-3">Qty</th>
            <th className="text-left p-3">Status</th>
            <th className="text-left p-3">Urgent</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={r.id ?? i} className="border-t">
              <td className="p-3">{i + 1}</td>
              <td className="p-3">{r.order_no ?? "-"}</td>
              <td className="p-3">{(r as any).party ?? "-"}</td>
              <td className="p-3">{r.qty ?? "-"}</td>
              <td className="p-3">{r.status ?? "-"}</td>
              <td className="p-3">{r.urgent ? "Yes" : "No"}</td>
            </tr>
          ))}
          {rows.length === 0 && (
            <tr><td className="p-3" colSpan={6}>No orders</td></tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
