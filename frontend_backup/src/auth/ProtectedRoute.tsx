import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "./AuthContext";

type Props = {
  children: React.ReactNode;
  /** Papéis autorizados. Vazio = qualquer usuário autenticado. */
  roles?: ReadonlyArray<"admin" | "medico" | "secretaria">;
};

export default function ProtectedRoute({ children, roles }: Props) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen text-gray-500">
        Carregando...
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/" replace state={{ from: location }} />;
  }

  if (roles && roles.length > 0 && !roles.includes(user.papel)) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}
