import { useEffect, useState, type ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { auth } from "@/lib/auth";

interface ProtectedRouteProps {
  children: ReactNode;
}

const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const location = useLocation();
  const [status, setStatus] = useState<"checking" | "ok" | "deny">("checking");

  useEffect(() => {
    // Pequeno delay para evitar flash; em produção viria de getSession() do Supabase.
    const t = window.setTimeout(() => {
      setStatus(auth.isAuthenticated() ? "ok" : "deny");
    }, 200);
    return () => window.clearTimeout(t);
  }, []);

  if (status === "checking") {
    return (
      <div className="min-h-screen w-full flex flex-col items-center justify-center bg-surface">
        <Loader2 className="h-8 w-8 text-primary animate-spin" />
        <p className="font-body text-sm text-muted-foreground mt-3">Validando sessão...</p>
      </div>
    );
  }

  if (status === "deny") {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
