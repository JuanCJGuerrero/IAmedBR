import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { authServices } from "../api/authServices";
import {
  clearSession,
  getAccessToken,
  getUser,
  saveSession,
  type SessionUser,
} from "../api/authStorage";

type AuthState = {
  user: SessionUser | null;
  loading: boolean;
};

type AuthContextValue = AuthState & {
  signIn: (email: string, password: string, rememberMe?: boolean) => Promise<void>;
  signOut: () => Promise<void>;
  refresh: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({ user: getUser(), loading: true });

  // Ao montar, valida o token contra /auth/me se existir.
  useEffect(() => {
    const token = getAccessToken();
    if (!token) {
      setState({ user: null, loading: false });
      return;
    }
    authServices
      .me()
      .then((u) => setState({ user: u, loading: false }))
      .catch(() => {
        clearSession();
        setState({ user: null, loading: false });
      });
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      ...state,
      async signIn(email, password, rememberMe) {
        const data = await authServices.login({ email, password });
        saveSession({
          accessToken: data.access_token,
          refreshToken: data.refresh_token,
          user: data.user,
          rememberMe,
        });
        setState({ user: data.user, loading: false });
      },
      async signOut() {
        await authServices.logout();
        clearSession();
        setState({ user: null, loading: false });
      },
      async refresh() {
        try {
          const u = await authServices.me();
          setState((s) => ({ ...s, user: u }));
        } catch {
          clearSession();
          setState({ user: null, loading: false });
        }
      },
    }),
    [state]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth precisa estar dentro de <AuthProvider>");
  }
  return ctx;
}
