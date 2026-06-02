import { useState, type ComponentType } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import {
  Users,
  FileText,
  Clock,
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
  Check,
  ChevronDown,
  type LucideProps,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

/* ----------------------------- KPIs ----------------------------- */

type Trend = "up" | "down";

interface Kpi {
  label: string;
  value: string;
  delta: string;
  trend: Trend;
  icon: ComponentType<LucideProps>;
  iconBg: string;
}

const kpis: Kpi[] = [
  { label: "Total de Pacientes", value: "156", delta: "+12%", trend: "up", icon: Users, iconBg: "bg-blue-500" },
  { label: "Laudos Criados", value: "89", delta: "+8%", trend: "up", icon: FileText, iconBg: "bg-green-500" },
  { label: "Pendentes", value: "7", delta: "-3%", trend: "down", icon: Clock, iconBg: "bg-yellow-500" },
  { label: "Taxa de Conclusão", value: "94%", delta: "+5%", trend: "up", icon: TrendingUp, iconBg: "bg-purple-500" },
];

const KpiCard = ({ kpi }: { kpi: Kpi }) => {
  const Icon = kpi.icon;
  const TrendIcon = kpi.trend === "up" ? ArrowUpRight : ArrowDownRight;
  const trendColor = kpi.trend === "up" ? "text-accent bg-accent/10" : "text-destructive bg-destructive/10";

  return (
    <div className="bg-white rounded-xl border border-border/60 shadow-card hover-lift p-6">
      <div className="flex items-start justify-between">
        <div className={cn("p-3 rounded-lg text-white", kpi.iconBg)}>
          <Icon size={22} />
        </div>
        <span className={cn("inline-flex items-center gap-1 font-pill text-xs px-2 py-1 rounded-full", trendColor)}>
          <TrendIcon size={12} strokeWidth={2.5} />
          {kpi.delta}
        </span>
      </div>
      <p className="font-sans font-bold text-foreground text-3xl mt-6 leading-none">{kpi.value}</p>
      <p className="font-body text-sm text-muted-foreground mt-2">{kpi.label}</p>
    </div>
  );
};

/* --------------------------- Tabela --------------------------- */

type Status = "Pendente" | "Em Andamento" | "Concluído" | "Revisado";

const STATUS_OPTIONS: Status[] = ["Pendente", "Em Andamento", "Concluído", "Revisado"];

const STATUS_STYLES: Record<Status, string> = {
  Pendente: "bg-yellow-100 text-yellow-800 border-yellow-200 hover:bg-yellow-200",
  "Em Andamento": "bg-blue-100 text-blue-800 border-blue-200 hover:bg-blue-200",
  Concluído: "bg-green-100 text-green-800 border-green-200 hover:bg-green-200",
  Revisado: "bg-purple-100 text-purple-800 border-purple-200 hover:bg-purple-200",
};

const STATUS_DOT: Record<Status, string> = {
  Pendente: "bg-yellow-500",
  "Em Andamento": "bg-blue-500",
  Concluído: "bg-green-500",
  Revisado: "bg-purple-500",
};

interface ReportRow {
  id: string;
  patient: string;
  exam: string;
  date: string;
  status: Status;
}

const initialRows: ReportRow[] = [
  { id: "r1", patient: "Maria Santos", exam: "Raio-X Tórax", date: "07/01/2026", status: "Concluído" },
  { id: "r2", patient: "João Oliveira", exam: "Tomografia", date: "07/01/2026", status: "Concluído" },
  { id: "r3", patient: "Ana Costa", exam: "Ressonância", date: "06/01/2026", status: "Pendente" },
  { id: "r4", patient: "Pedro Alves", exam: "Ultrassom", date: "06/01/2026", status: "Em Andamento" },
];

const StatusChip = ({
  status,
  onChange,
}: {
  status: Status;
  onChange: (s: Status) => void;
}) => (
  <DropdownMenu>
    <DropdownMenuTrigger asChild>
      <button
        type="button"
        className={cn(
          "inline-flex items-center gap-1.5 font-pill text-xs px-2.5 py-1 rounded-full border transition-colors",
          STATUS_STYLES[status],
        )}
      >
        <span className={cn("h-1.5 w-1.5 rounded-full", STATUS_DOT[status])} />
        {status}
        <ChevronDown size={12} />
      </button>
    </DropdownMenuTrigger>
    <DropdownMenuContent align="end" className="w-44">
      {STATUS_OPTIONS.map((s) => (
        <DropdownMenuItem
          key={s}
          onClick={() => onChange(s)}
          className="flex items-center justify-between gap-2 cursor-pointer"
        >
          <span className="flex items-center gap-2">
            <span className={cn("h-2 w-2 rounded-full", STATUS_DOT[s])} />
            <span className="font-body text-sm">{s}</span>
          </span>
          {s === status && <Check size={14} className="text-primary" />}
        </DropdownMenuItem>
      ))}
    </DropdownMenuContent>
  </DropdownMenu>
);

/* --------------------------- Page --------------------------- */

const Dashboard = () => {
  const [rows, setRows] = useState<ReportRow[]>(initialRows);

  const updateStatus = (id: string, status: Status) => {
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, status } : r)));
    toast.success(`Status atualizado para "${status}".`);
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* Cabeçalho */}
      <div>
        <h1 className="font-sans font-bold text-foreground text-3xl">Dashboard</h1>
        <p className="font-body text-muted-foreground mt-1">Visão geral da sua atividade médica</p>
      </div>

      {/* KPIs */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {kpis.map((k) => (
          <KpiCard key={k.label} kpi={k} />
        ))}
      </section>

      {/* Tabela */}
      <section className="bg-white rounded-xl border border-border/60 shadow-card overflow-hidden">
        <header className="flex items-center justify-between px-6 py-5 border-b border-border/60">
          <div>
            <h2 className="font-sans font-bold text-foreground text-lg">Laudos recentes</h2>
            <p className="font-body text-sm text-muted-foreground">Últimas atividades da sua agenda</p>
          </div>
          <Link
            to="/reports"
            className="font-sans font-semibold text-sm text-primary hover:underline inline-flex items-center gap-1"
          >
            Ver todos <ArrowUpRight size={14} />
          </Link>
        </header>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-surface">
              <tr className="font-pill text-xs uppercase tracking-wider text-muted-foreground">
                <th className="px-6 py-3 font-medium">Paciente</th>
                <th className="px-6 py-3 font-medium">Tipo de exame</th>
                <th className="px-6 py-3 font-medium">Data</th>
                <th className="px-6 py-3 font-medium text-right">Status</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="border-t border-border/60 hover:bg-surface/60 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-full bg-primary/10 text-primary flex items-center justify-center font-sans font-semibold text-xs border border-primary/15">
                        {r.patient.split(" ").map((p) => p[0]).slice(0, 2).join("")}
                      </div>
                      <span className="font-sans font-medium text-foreground text-sm">{r.patient}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 font-body text-sm text-foreground/80">{r.exam}</td>
                  <td className="px-6 py-4 font-body text-sm text-muted-foreground">{r.date}</td>
                  <td className="px-6 py-4 text-right">
                    <StatusChip status={r.status} onChange={(s) => updateStatus(r.id, s)} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};

export default Dashboard;
