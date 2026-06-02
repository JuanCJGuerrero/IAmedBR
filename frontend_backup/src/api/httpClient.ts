import axios, { AxiosInstance } from "axios";
import { env } from "../config/env";
import { getAccessToken, clearSession } from "./authStorage";
import { installMockAdapter } from "./mockAdapter";

function createClient(baseURL: string): AxiosInstance {
  const client = axios.create({
    baseURL,
    timeout: 30_000,
    withCredentials: false,
  });

  client.interceptors.request.use((config) => {
    const token = getAccessToken();
    if (token) {
      config.headers = config.headers ?? {};
      (config.headers as Record<string, string>).Authorization = `Bearer ${token}`;
    }
    return config;
  });

  client.interceptors.response.use(
    (res) => res,
    (error) => {
      if (error?.response?.status === 401) {
        clearSession();
        if (typeof window !== "undefined" && window.location.pathname !== "/") {
          window.location.replace("/");
        }
      }
      return Promise.reject(error);
    }
  );

  if (env.useMock) {
    installMockAdapter(client);
  }

  return client;
}

export const apiClient = createClient(env.apiUrl);
export const ocrClient = createClient(env.ocrUrl);
export const iaClient = createClient(env.iaUrl);
export const transcricaoClient = createClient(env.transcricaoUrl);

if (env.useMock && typeof window !== "undefined") {
  // eslint-disable-next-line no-console
  console.info(
    "%c[mock] Modo demo ativo - login: admin@local / admin123",
    "background:#facc15;color:#111;padding:2px 6px;border-radius:4px;font-weight:bold"
  );
}
