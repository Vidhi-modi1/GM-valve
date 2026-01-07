// Use dev proxy when running locally to avoid CORS.
// export const API_URL = import.meta.env.DEV ? "/api" : "https://gmvalve.lvpro.live/api";
export const API_URL = "https://plan.gmvalve.in/backend/api";

export interface LoginResponse {
  status: boolean;
  message: string;
  data: {
    user: {
      id: number;
      name: string;
      email: string;
      role: {
        id: number;
        name: string;
      };
    };
    token: string;
  };
}

export async function loginUser(email: string, password: string): Promise<LoginResponse> {
  const res = await fetch(`${API_URL}/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });

  if (!res.ok) throw new Error("Login failed");
  return res.json();
}
