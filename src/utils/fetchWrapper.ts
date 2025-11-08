// src/utils/fetchWrapper.ts
import { API_URL } from "../config/api";

/** Core helper that:
 * - prefixes API_URL
 * - auto-attaches Bearer token from localStorage
 * - parses JSON (even on errors)
 * - throws useful Error with message from server
 */
export async function apiFetch<T = any>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const token = localStorage.getItem("token");
  const headers: Record<string, string> = {
    Accept: "application/json",
    ...(options.headers as Record<string, string> | undefined),
  };

  // Only set JSON header if we’re actually sending JSON
  const isJsonBody =
    options.body && !(options.body instanceof FormData) && !headers["Content-Type"];

  if (isJsonBody) headers["Content-Type"] = "application/json";
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers,
  });

  let payload: any = null;
  try {
    payload = await res.json();
  } catch {
    // non-JSON response
  }

  if (!res.ok) {
    const reason =
      payload?.message ||
      payload?.error ||
      `Request failed: ${res.status} ${res.statusText}`;
    throw new Error(reason);
  }

  return payload as T;
}
