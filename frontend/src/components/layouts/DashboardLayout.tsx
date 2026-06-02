import { useState } from "react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import {
  Menu,
  LayoutDashboard,
  UserPlus,
  Users,
  FileText,
  FileStack,
  MessageSquare,
  Kanban,
  LogOut,
} from "lucide-react";
import { cn } from "@/lib/utils";
import Logo from "@/components/Logo";
import { auth } from "@/lib/auth";

const navItems = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/registration", label: "Cadastro", icon: UserPlus },
  { to: "/patients", label: "Pacientes", icon: Users },
  { to: "/reports", label: "Laudos", icon: FileText },
  { to: "/templates", label: "Modelos", icon: FileStack },
  { to: "/chat", label: "IA Assistente", icon: MessageSquare },
  { to: "/gestao-de-laudos", label: "Gestão de laudos", icon: Kanban },
];

const DashboardLayout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [open, setOpen] = useState(true);
  const session = auth.getSession();
  const userName = session?.name ?? "Dr. João Silva";
  const userRole = session?.role ?? "Radiologista";
  const initials = auth.initials(userName);

  const handleLogout = () => {
    auth.signOut();
    toast.success("Sessão encerrada.");
    navigate("/login", { replace: true });
  };

  return (
    <div className="min-h-screen w-full flex bg-surface text-foreground">
      {/* SIDEBAR */}
      <aside
        className={cn(
          "shrink-0 overflow-hidden bg-primary text-white transition-[width] duration-300 ease-out",
          open ? "w-64" : "w-0",
        )}
        aria-hidden={!open}
      >
        <div className="w-64 h-screen sticky top-0 flex flex-col">
          {/* Logo */}
          <div className="h-16 px-5 flex items-center border-b border-white/10">
            <Logo size="md" variant="dark" />
          </div>

          {/* Nav */}
          <nav className="flex-1 overflow-y-auto px-3 py-5">
            <ul className="space-y-1">
              {navItems.map(({ to, label, icon: Icon }) => (
                <li key={to}>
                  <NavLink
                    to={to}
                    end
                    className={({ isActive }) =>
                      cn(
                        "flex items-center gap-3 h-11 px-3 rounded-lg font-sans text-[14px] font-medium transition-colors",
                        isActive
                          ? "bg-blue-700 text-white shadow-inner"
                          : "text-white/85 hover:bg-blue-500/60 hover:text-white",
                      )
                    }
                  >
                    <Icon size={18} className="shrink-0" />
                    <span className="truncate">{label}</span>
                  </NavLink>
                </li>
              ))}
            </ul>
          </nav>

          {/* Logout */}
          <div className="p-3 border-t border-white/10">
            <button
              type="button"
              onClick={handleLogout}
              className="w-full flex items-center gap-3 h-11 px-3 rounded-lg font-sans text-[14px] font-medium text-white/85 hover:bg-white/10 hover:text-white transition-colors"
            >
              <LogOut size={18} />
              <span>Sair</span>
            </button>
          </div>
        </div>
      </aside>

      {/* MAIN COLUMN */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* HEADER */}
        <header className="sticky top-0 z-30 h-16 bg-white border-b border-border/60 shadow-[0_1px_2px_0_rgba(15,23,42,0.04)] flex items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setOpen((v) => !v)}
              aria-label={open ? "Recolher menu" : "Expandir menu"}
              className="h-10 w-10 inline-flex items-center justify-center rounded-lg text-foreground/70 hover:text-foreground hover:bg-surface transition-colors"
            >
              <Menu size={20} />
            </button>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden sm:flex flex-col items-end leading-tight">
              <span className="font-sans font-semibold text-sm text-foreground">{userName}</span>
              <span className="font-body text-xs text-muted-foreground">{userRole}</span>
            </div>
            <div
              className="h-10 w-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-sans font-bold text-sm border border-primary/15"
              aria-label={userName}
              title={userName}
            >
              {initials}
            </div>
          </div>
        </header>

        {/* CONTENT */}
        <main key={location.pathname} className="flex-1 overflow-auto p-6 animate-page-in">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
