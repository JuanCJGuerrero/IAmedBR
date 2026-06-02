import { useMemo, useState } from "react";
import { Search, ChevronDown, Check } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import type { Patient } from "@/lib/patients-api";

interface PatientPickerProps {
  patients: Patient[];
  value: Patient | null;
  onChange: (p: Patient) => void;
}

const initialsOf = (nome: string) =>
  nome
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");

const PatientPicker = ({ patients, value, onChange }: PatientPickerProps) => {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return patients;
    return patients.filter(
      (p) => p.nome.toLowerCase().includes(q) || p.prontuario.toLowerCase().includes(q),
    );
  }, [patients, query]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="w-full flex items-center gap-3 h-12 px-3 rounded-[8px] border border-slate-200 bg-white hover:bg-surface transition text-left"
        >
          {value ? (
            <>
              <span className="h-8 w-8 rounded-full bg-blue-100 text-blue-600 inline-flex items-center justify-center font-sans font-bold text-xs border border-blue-200 shrink-0">
                {initialsOf(value.nome)}
              </span>
              <span className="flex-1 min-w-0">
                <span className="block font-sans font-semibold text-foreground text-sm truncate">{value.nome}</span>
                <span className="block font-pill text-[11px] text-primary">{value.prontuario}</span>
              </span>
            </>
          ) : (
            <span className="flex-1 font-body text-sm text-muted-foreground">Selecionar paciente...</span>
          )}
          <ChevronDown size={16} className="text-muted-foreground shrink-0" />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
        <div className="p-2 border-b border-border">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
            <input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar por nome ou prontuário"
              className="w-full h-9 pl-9 pr-3 rounded-md border border-slate-200 bg-white text-sm font-body focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
          </div>
        </div>
        <ul className="max-h-72 overflow-auto py-1">
          {filtered.length === 0 ? (
            <li className="px-3 py-6 text-center font-body text-sm text-muted-foreground">Nenhum paciente.</li>
          ) : (
            filtered.map((p) => (
              <li key={p.id}>
                <button
                  type="button"
                  onClick={() => {
                    onChange(p);
                    setOpen(false);
                    setQuery("");
                  }}
                  className={cn(
                    "w-full flex items-center gap-3 px-2.5 py-2 rounded-md hover:bg-surface transition text-left",
                    value?.id === p.id && "bg-primary/5",
                  )}
                >
                  <span className="h-8 w-8 rounded-full bg-blue-100 text-blue-600 inline-flex items-center justify-center font-sans font-bold text-xs border border-blue-200 shrink-0">
                    {initialsOf(p.nome)}
                  </span>
                  <span className="flex-1 min-w-0">
                    <span className="block font-sans font-semibold text-foreground text-sm truncate">{p.nome}</span>
                    <span className="block font-pill text-[11px] text-muted-foreground">{p.prontuario}</span>
                  </span>
                  {value?.id === p.id && <Check size={14} className="text-primary shrink-0" />}
                </button>
              </li>
            ))
          )}
        </ul>
      </PopoverContent>
    </Popover>
  );
};

export default PatientPicker;
