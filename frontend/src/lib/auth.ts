/**
 * Auth helper. Em modo mock (VITE_USE_MOCK=true) usa apenas localStorage.
 * Em modo real chama POST /auth/login no backend FastAPI e persiste o JWT.
 */

import { apiClient, tokenStorage } from "./http";
import { env } from "./env";

const STORAGE_KEY = "iamedbr.session";

export type Session = {
  email: string;
  name: string;
  role: string;
  ts: number;
};

function persist(s: Session, mode: "local" | "session") {
  try {
    const store =
      mode === "local" ? window.localStorage : window.sessionStorage;
    store.setItem(STORAGE_KEY, JSON.stringify(s));
  } catch {
    /* ignore */
  }
}

function readRaw(): Session | null {
  try {
    const raw =
      window.localStorage.getItem(STORAGE_KEY) ??
      window.sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<Session>;
    if (!parsed.email) return null;
    return {
      email: parsed.email,
      name: parsed.name ?? "Dr. João Silva",
      role: parsed.role ?? "Radiologista",
      ts: parsed.ts ?? Date.now(),
    };
  } catch {
    return null;
  }
}

type LoginResp = {
  access_token: string;
  refresh_token?: string;
  token_type: string;
  user: { id: number; nome: string; email: string; papel: string };
};

async function signInReal(
  email: string,
  password: string,
  rememberMe: boolean,
): Promise<Session> {
  const { data } = await apiClient.post<LoginResp>("/auth/login", {
    email,
    password,
  });

  const persistMode = rememberMe ? "local" : "session";
  tokenStorage.set(data.access_token, persistMode);
  if (data.refresh_token) tokenStorage.setRefresh(data.refresh_token, persistMode);

  const session: Session = {
    email: data.user.email,
    name: data.user.nome,
    role:
      data.user.papel === "admin"
        ? "Administrador"
        : data.user.papel === "medico"
          ? "Radiologista"
          : "Secretaria",
    ts: Date.now(),
  };
  persist(session, persistMode);
  return session;
}

async function signInMock(
  email: string,
  password: string,
  rememberMe: boolean,
): Promise<Session> {
  const validDemo = password === "demo";
  const validAdmin = email === "admin@local" && password === "admin123";
  if (!validDemo && !validAdmin) {
    throw new Error("Credenciais invalidas");
  }
  const session: Session = validAdmin
    ? { email, name: "Admin IAmedBR", role: "Administrador", ts: Date.now() }
    : { email, name: "Dr. João Silva", role: "Radiologista", ts: Date.now() };
  persist(session, rememberMe ? "local" : "session");
  return session;
}

export const auth = {
  getSession: readRaw,
  isAuthenticated: () => readRaw() !== null,

  signIn: (email: string, password: string, rememberMe = true) =>
    env.useMock
      ? signInMock(email, password, rememberMe)
      : signInReal(email, password, rememberMe),

  signOut: () => {
    try {
      window.localStorage.removeItem(STORAGE_KEY);
      window.sessionStorage.removeItem(STORAGE_KEY);
      tokenStorage.clear();
    } catch {
      /* ignore */
    }
  },

  initials: (name: string) =>
    name
      .replace(/^Dr[a]?\.?\s*/i, "")
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((p) => p[0]?.toUpperCase() ?? "")
      .join("") || "U",
};
