/**
 * Armazenamento de sessão do usuário.
 *
 * Por padrão usa sessionStorage (some quando o navegador fecha) — mais seguro
 * que localStorage para tokens JWT em SaaS médico. Quando o usuário marca
 * "Manter conectado", migramos para localStorage.
 *
 * Observação: o ideal a longo prazo é usar cookies httpOnly + Secure + SameSite,
 * mas isso requer mudar o backend para colocar/ler cookies. Por ora mantemos
 * em storage do browser, mas isolado em uma única camada para fácil troca.
 */

const ACCESS_KEY = "mp.access_token";
const REFRESH_KEY = "mp.refresh_token";
const USER_KEY = "mp.user";
const PERSIST_KEY = "mp.persist";

type Persist = "session" | "local";

function persistMode(): Persist {
  return localStorage.getItem(PERSIST_KEY) === "local" ? "local" : "session";
}

function setPersistMode(mode: Persist) {
  localStorage.setItem(PERSIST_KEY, mode);
}

function storage(): Storage {
  return persistMode() === "local" ? localStorage : sessionStorage;
}

export type SessionUser = {
  id: number;
  nome: string;
  email: string;
  papel: "admin" | "medico" | "secretaria";
};

export function saveSession(params: {
  accessToken: string;
  refreshToken?: string;
  user: SessionUser;
  rememberMe?: boolean;
}) {
  setPersistMode(params.rememberMe ? "local" : "session");
  const s = storage();
  s.setItem(ACCESS_KEY, params.accessToken);
  if (params.refreshToken) s.setItem(REFRESH_KEY, params.refreshToken);
  s.setItem(USER_KEY, JSON.stringify(params.user));
}

export function getAccessToken(): string | null {
  return storage().getItem(ACCESS_KEY);
}

export function getRefreshToken(): string | null {
  return storage().getItem(REFRESH_KEY);
}

export function getUser(): SessionUser | null {
  const raw = storage().getItem(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as SessionUser;
  } catch {
    return null;
  }
}

export function clearSession() {
  for (const s of [sessionStorage, localStorage]) {
    s.removeItem(ACCESS_KEY);
    s.removeItem(REFRESH_KEY);
    s.removeItem(USER_KEY);
  }
  localStorage.removeItem(PERSIST_KEY);
}
