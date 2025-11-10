// src/services/authService.ts
import { apiFetch } from "../utils/fetchWrapper";

export type LoginResponse = {
  token: string;
  user: {
    id?: number;
    name?: string;
    email?: string;
    role?: string; // expected from backend; if missing we’ll derive from email
  };
};

export async function loginUser(email: string, password: string): Promise<LoginResponse> {
  const payload = await apiFetch<LoginResponse>("/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });

  // If backend doesn’t return role, derive from email (fallback)
  if (!payload?.user?.role && payload?.user?.email) {
    payload.user.role = deriveRoleFromEmail(payload.user.email);
  }
  return payload;
}

export function deriveRoleFromEmail(email: string): string {
  const e = email.toLowerCase();
  if (e.startsWith("planning")) return "planning";
  if (e.startsWith("materialissue")) return "material-issue";
  if (e.startsWith("semiqc")) return "semi-qc";
  if (e.startsWith("phospatingqc")) return "phosphating-qc";
  if (e.startsWith("assembly")) return "assembly";
  if (e.startsWith("testing")) return "testing";
  if (e.startsWith("marking")) return "marking";
  if (e.startsWith("svs")) return "svs";
  if (e.startsWith("pdi")) return "pdi";
  if (e.startsWith("tpi")) return "tpi";
  if (e.startsWith("dispatch")) return "dispatch";
  if (e.startsWith("admin")) return "admin";
  return "user";
}
