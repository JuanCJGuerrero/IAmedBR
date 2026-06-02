import axios, { AxiosInstance } from "axios";
import { env } from "./env";

/**
 * Camada HTTP unica do app.
 * - Injeta automaticamente Authorization: Bearer <token> quando ha sessao
 * - Em 401 limpa sessao e redireciona pra /login
 * - Cliente separado por microservico (api, ocr, ia, transcricao)
 */

const TOKEN_KEY = "iamedbr.access_token";
const REFRESH_KEY = "iamedbr.refresh_token";

export const tokenStorage = {
  get(): string | null {
    try {
      return (
        window.localStorage.getItem(TOKEN_KEY) ??
        window.sessionStorage.getItem(TOKEN_KEY)
      );
    } catch {
      return null;
    }
  },
  set(token: string, persist: "local" | "session") {
    try {
      const store =
        persist === "local" ? window.localStorage : window.sessionStorage;
      store.setItem(TOKEN_KEY, token);
    } catch {
      /* ignore */
    }
  },
  setRefresh(refresh: string, persist: "local" | "session") {
    try {
      const store =
        persist === "local" ? window.localStorage : window.sessionStorage;
      store.setItem(REFRESH_KEY, refresh);
    } catch {
      /* ignore */
    }
  },
  clear() {
    for (const s of [window.localStorage, window.sessionStorage]) {
      try {
        s.removeItem(TOKEN_KEY);
        s.removeItem(REFRESH_KEY);
      } catch {
        /* ignore */
      }
    }
  },
};

function createClient(baseURL: string): AxiosInstance {
  const client = axios.create({
    baseURL,
    timeout: 30_000,
    withCredentials: false,
  });

  client.interceptors.request.use((config) => {
    const token = tokenStorage.get();
    if (token) {
      config.headers = config.headers ?? {};
      (config.headers as Record<string, string>).Authorization =
        `Bearer ${token}`;
    }
    return config;
  });

  client.interceptors.response.use(
    (res) => res,
    (error) => {
      if (error?.response?.status === 401) {
        tokenStorage.clear();
        // Sinaliza pro app via storage event (ou redirect direto)
        if (
          typeof window !== "undefined" &&
          !window.location.pathname.startsWith("/login") &&
          !window.location.pathname === "/"
        ) {
          window.location.replace("/login");
        }
      }
      return Promise.reject(error);
    },
  );

  return client;
}

export const apiClient = createClient(env.apiUrl);
export const ocrClient = createClient(env.ocrUrl);
export const iaClient = createClient(env.iaUrl);
export const transcricaoClient = createClient(env.transcricaoUrl);

// eslint-disable-next-line no-console
if (env.useMock && typeof window !== "undefined") {
  console.info(
    "%c[mock] Modo demo IAmedBR - dados ficam em localStorage",
    "background:#facc15;color:#111;padding:2px 6px;border-radius:4px;font-weight:bold",
  );
} else if (typeof window !== "undefined") {
  // eslint-disable-next-line no-console
  console.info(
    `%c[live] IAmedBR conectado em ${env.apiUrl}`,
    "background:#0066FF;color:#fff;padding:2px 6px;border-radius:4px;font-weight:bold",
  );
}
