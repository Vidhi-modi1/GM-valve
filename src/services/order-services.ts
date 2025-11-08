// src/services/orderService.ts
import { apiFetch } from "../utils/fetchWrapper";

export type Order = {
  id?: number;
  order_no?: string;
  party?: string;
  qty?: number;
  status?: string;
  urgent?: boolean;
  [k: string]: any;
};

// GET /order-list (Bearer)
export async function fetchOrderList(): Promise<Order[]> {
  const data = await apiFetch<any>("/order-list", {
    method: "GET",
  });
  // Support both {data:[...]} and plain [...]
  return Array.isArray(data) ? data : data?.data ?? [];
}

// POST /upload-order-file (form-data with key "file", Bearer)
export async function uploadOrderFile(file: File): Promise<any> {
  const form = new FormData();
  form.append("file", file); // matches Postman screenshot

  const data = await apiFetch<any>("/upload-order-file", {
    method: "POST",
    body: form, // do NOT set Content-Type; browser sets multipart boundary
  });

  return data;
}
