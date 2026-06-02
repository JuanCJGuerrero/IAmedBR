import { useState } from "react";
import { Outlet, useNavigate, NavLink } from "react-router-dom";
import {
  Menu,
  Users,
  FileText,
  LogOut,
  FileStack,
  UserPlus,
  Kanban,
} from "lucide-react";
import { useAuth } from "../../auth/AuthContext";

type NavItem = {
  to: string;
  icon: React.ReactNode;
  label: string;
};

const NAV: NavItem[] = [
  { to: "/dashboard", icon: <Menu size={20} />, label: "Dashboard" },
  { to: "/registration", icon: <UserPlus size={20} />, label: "Cadastro" },
  { to: "/patients", icon: <Users size={20} />, label: "Pacientes" },
  { to: "/reports", icon: <FileText size={20} />, label: "Laudos" },
  { to: "/templates", icon: <FileStack size={20} />, label: "Modelos" },
  { to: "/gestao-de-laudos", icon: <Kanban size={20} />, label: "Gestao de laudos" },
];

export default function DashboardLayout() {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const handleLogout = async () => {
    await signOut();
    navigate("/", { replace: true });
  };

  const initials = (user?.nome ?? "")
    .split(" ")
    .filter(Boolean)
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div className="flex h-screen bg-gray-50">
      <aside
        className={`${isSidebarOpen ? "w-64" : "w-0"} bg-blue-600 text-white transition-all duration-300 overflow-hidden relative`}
      >
        <div className="p-6">
          <h1 className="text-2xl font-bold mb-8">IAmedBR</h1>

          <nav className="space-y-2">
            {NAV.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `w-full flex items-center gap-3 px-4 py-3 rounded-lg transition ${
                    isActive ? "bg-blue-700" : "hover:bg-blue-500"
                  }`
                }
              >
                {item.icon}
                <span>{item.label}</span>
              </NavLink>
            ))}
          </nav>
        </div>

        <div className="absolute bottom-0 left-0 right-0 p-6">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-blue-500"
          >
            <LogOut size={20} />
            <span>Sair</span>
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-white shadow-sm px-6 py-4 flex items-center justify-between">
          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label="Alternar menu"
          >
            <Menu size={24} />
          </button>

          {user && (
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-sm font-medium">{user.nome}</p>
                <p className="text-xs text-gray-500 capitalize">{user.papel}</p>
              </div>
              <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold">
                {initials || "?"}
              </div>
            </div>
          )}
        </header>

        <main className="flex-1 overflow-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
