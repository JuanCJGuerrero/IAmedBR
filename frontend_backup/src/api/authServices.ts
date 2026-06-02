import { apiClient } from "./httpClient";
import type { SessionUser } from "./authStorage";

export type LoginPayload = {
  email: string;
  password: string;
};

export type LoginResponse = {
  access_token: string;
  refresh_token?: string;
  token_type: "bearer";
  user: SessionUser;
};

export const authServices = {
  async login(payload: LoginPayload): Promise<LoginResponse> {
    const { data } = await apiClient.post<LoginResponse>("/auth/login", payload);
    return data;
  },

  async me(): Promise<SessionUser> {
    const { data } = await apiClient.get<SessionUser>("/auth/me");
    return data;
  },

  async logout(): Promise<void> {
    try {
      await apiClient.post("/auth/logout");
    } catch {
      // Logout local sempre acontece via clearSession() do AuthContext
    }
  },
};
