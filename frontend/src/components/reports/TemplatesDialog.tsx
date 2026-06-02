import { useMemo, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Search, FileStack } from "lucide-react";
import { TEMPLATES, type ExamType, type ReportTemplate } from "@/lib/reports-api";
import { cn } from "@/lib/utils";

interface TemplatesDialogProps {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  exam: ExamType;
  onApply: (tpl: ReportTemplate) => void;
}

const TemplatesDialog = ({ open, onOpenChange, exam, onApply }: TemplatesDialogProps) => {
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<ReportTemplate | null>(null);

  const list = useMemo(() => {
    const q = query.trim().toLowerCase();
    return TEMPLATES.filter(
      (t) =>
        (q === "" || t.name.toLowerCase().includes(q) || t.exam.toLowerCase().includes(q)) &&
        true,
    );
  }, [query]);

  const suggested = list.filter((t) => t.exam === exam);
  const others = list.filter((t) => t.exam !== exam);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <div className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary mb-1">
            <FileStack size={18} />
          </div>
          <DialogTitle className="font-sans font-bold text-foreground">Aplicar modelo</DialogTitle>
          <DialogDescription className="font-body text-muted-foreground">
            Escolha um modelo para preencher o editor. O conteúdo atual será substituído.
          </DialogDescription>
        </DialogHeader>

        <div className="relative">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar por modelo ou exame..."
            className="w-full h-11 pl-11 pr-4 rounded-[8px] border border-slate-200 bg-white text-foreground font-body text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[420px] overflow-auto pr-1">
          {suggested.length > 0 && (
            <p className="md:col-span-2 font-pill text-[11px] uppercase tracking-wider text-primary mt-1">
              Sugeridos para {exam}
            </p>
          )}
          {suggested.map((t) => (
            <TemplateCard key={t.id} t={t} active={selected?.id === t.id} onSelect={() => setSelected(t)} />
          ))}

          {others.length > 0 && (
            <p className="md:col-span-2 font-pill text-[11px] uppercase tracking-wider text-muted-foreground mt-2">
              Outros modelos
            </p>
          )}
          {others.map((t) => (
            <TemplateCard key={t.id} t={t} active={selected?.id === t.id} onSelect={() => setSelected(t)} />
          ))}

          {list.length === 0 && (
            <p className="md:col-span-2 text-center py-8 font-body text-sm text-muted-foreground">
              Nenhum modelo encontrado.
            </p>
          )}
        </div>

        <DialogFooter className="gap-2 sm:gap-2">
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="inline-flex items-center justify-center bg-white border border-border text-foreground font-sans font-semibold text-sm h-10 px-4 rounded-[8px] hover:bg-surface transition"
          >
            Cancelar
          </button>
          <button
            type="button"
            disabled={!selected}
            onClick={() => {
              if (selected) {
                onApply(selected);
                onOpenChange(false);
                setSelected(null);
              }
            }}
            className="inline-flex items-center justify-center bg-primary text-primary-foreground font-sans font-semibold text-sm h-10 px-4 rounded-[8px] shadow-primary hover:scale-[1.02] transition disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100"
          >
            Aplicar modelo
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

const TemplateCard = ({
  t,
  active,
  onSelect,
}: {
  t: ReportTemplate;
  active: boolean;
  onSelect: () => void;
}) => (
  <button
    type="button"
    onClick={onSelect}
    className={cn(
      "text-left p-4 rounded-xl border transition",
      active
        ? "border-primary bg-primary/5 shadow-card"
        : "border-border bg-white hover:border-primary/40 hover:bg-surface",
    )}
  >
    <p className="font-pill text-[10px] uppercase tracking-wider text-primary">{t.exam}</p>
    <p className="font-sans font-semibold text-foreground mt-1">{t.name}</p>
    <p className="font-mono text-[11px] text-muted-foreground mt-2 line-clamp-3 whitespace-pre-line">
      {t.body}
    </p>
  </button>
);

export default TemplatesDialog;
