import axios from "axios";
import { API_URL } from "../config/api";

export type LoginResponse = {
  token?: string;
  user?: any;
  [key: string]: any;
};

export async function loginUser(email: string, password: string): Promise<LoginResponse> {
  const res = await axios.post(`${API_URL}/login`, { email, password });
  return res.data as LoginResponse;
}
