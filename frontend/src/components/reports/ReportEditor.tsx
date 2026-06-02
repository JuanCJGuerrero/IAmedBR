import { useEffect, useRef, useState } from "react";
import { ChevronDown, Check } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import type { ReportStatus } from "@/lib/reports-api";

const STATUS_OPTIONS: ReportStatus[] = ["Pendente", "Em Andamento", "Concluído", "Revisado"];

const STATUS_STYLES: Record<ReportStatus, string> = {
  Pendente: "bg-yellow-100 text-yellow-800 border-yellow-200",
  "Em Andamento": "bg-blue-100 text-blue-800 border-blue-200",
  Concluído: "bg-green-100 text-green-800 border-green-200",
  Revisado: "bg-purple-100 text-purple-800 border-purple-200",
};

const STATUS_DOT: Record<ReportStatus, string> = {
  Pendente: "bg-yellow-500",
  "Em Andamento": "bg-blue-500",
  Concluído: "bg-green-500",
  Revisado: "bg-purple-500",
};

interface ReportEditorProps {
  value: string;
  onChange: (v: string) => void;
  status: ReportStatus;
  onStatusChange: (s: ReportStatus) => void;
  /** Timestamp do último salvamento (ms). */
  lastSavedAt: number | null;
}

const ReportEditor = ({ value, onChange, status, onStatusChange, lastSavedAt }: ReportEditorProps) => {
  const [now, setNow] = useState(Date.now());
  const taRef = useRef<HTMLTextAreaElement>(null);

  // Atualiza o "salvo há Xs" sem re-render por keystroke
  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, []);

  const savedLabel = (() => {
    if (!lastSavedAt) return "Não salvo";
    const diff = Math.max(0, Math.floor((now - lastSavedAt) / 1000));
    if (diff < 5) return "Salvo agora";
    if (diff < 60) return `Salvo há ${diff}s`;
    const m = Math.floor(diff / 60);
    return `Salvo há ${m}min`;
  })();

  return (
    <div className="bg-white rounded-2xl border border-border/60 shadow-card overflow-hidden flex flex-col">
      <header className="flex items-center justify-between gap-4 px-5 py-3 border-b border-border/60">
        <div className="flex items-center gap-3">
          <h3 className="font-sans font-bold text-foreground">Editor de laudo</h3>
          <span className="font-pill text-[11px] text-muted-foreground">{savedLabel}</span>
        </div>

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
                onClick={() => onStatusChange(s)}
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
      </header>

      <textarea
        ref={taRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        spellCheck
        placeholder="Comece a escrever, dite por voz ou clique em &quot;Gerar laudo por IA&quot;..."
        className="flex-1 min-h-[500px] w-full p-5 font-mono text-[13px] leading-6 text-foreground resize-none focus:outline-none bg-white"
      />
    </div>
  );
};

export default ReportEditor;
