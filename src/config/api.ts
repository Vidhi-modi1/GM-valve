export const API_URL = "http://192.168.1.17:2010/api";

export async function login(email: string, password: string) {
  const res = await fetch(`${API_URL}/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });

  let payload: any = null;
  try { payload = await res.json(); } catch {}

  if (!res.ok) {
    const reason =
      payload?.message ||
      payload?.error ||
      `Login failed with status ${res.status}`;
    throw new Error(reason);
  }

  return payload;
}
