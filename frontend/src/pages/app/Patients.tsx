import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Plus, Search, Eye, Pencil, Trash2, AlertTriangle } from "lucide-react";
import EmptyState from "@/components/feedback/EmptyState";
import { CardSkeletonGrid } from "@/components/feedback/Skeletons";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { patientsApi, type Patient } from "@/lib/patients-api";

const formatDate = (iso?: string) => {
  if (!iso) return "—";
  const d = new Date(iso + "T00:00:00");
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("pt-BR");
};

const calcAge = (iso: string) => {
  if (!iso) return 0;
  const d = new Date(iso + "T00:00:00");
  if (Number.isNaN(d.getTime())) return 0;
  const today = new Date();
  let age = today.getFullYear() - d.getFullYear();
  const m = today.getMonth() - d.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < d.getDate())) age--;
  return Math.max(age, 0);
};

const generoLabel = (g?: Patient["genero"]) =>
  g === "F" ? "Feminino" : g === "M" ? "Masculino" : g === "Outro" ? "Outro" : "—";

const initialsOf = (nome: string) =>
  nome
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");

const Patients = () => {
  const navigate = useNavigate();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [toDelete, setToDelete] = useState<Patient | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const t = window.setTimeout(() => {
      setPatients(patientsApi.list());
      setLoading(false);
    }, 250);
    return () => window.clearTimeout(t);
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return patients;
    return patients.filter(
      (p) => p.nome.toLowerCase().includes(q) || p.prontuario.toLowerCase().includes(q),
    );
  }, [patients, query]);

  const confirmDelete = async () => {
    if (!toDelete) return;
    setDeleting(true);
    try {
      await patientsApi.remove(toDelete.id);
      setPatients((prev) => prev.filter((p) => p.id !== toDelete.id));
      toast.success(`Paciente ${toDelete.nome} removido.`);
      setToDelete(null);
    } catch {
      toast.error("Não foi possível excluir o paciente.");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Cabeçalho */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-sans font-bold text-foreground text-3xl">Pacientes</h1>
          <p className="font-body text-muted-foreground mt-1">Gerencie seus pacientes</p>
        </div>
        <Link
          to="/registration"
          aria-label="Cadastrar novo paciente"
          className="inline-flex items-center gap-2 bg-primary text-primary-foreground font-sans font-semibold text-sm h-11 px-5 rounded-lg shadow-primary hover-lift"
        >
          <Plus size={16} aria-hidden /> Novo paciente
        </Link>
      </div>

      {/* Search */}
      <div className="bg-white rounded-xl border border-border/60 shadow-card p-3">
        <div className="relative">
          <Search size={18} aria-hidden className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar por nome ou prontuário..."
            aria-label="Buscar pacientes"
            className="w-full h-11 pl-11 pr-4 rounded-lg border border-slate-200 bg-white text-foreground font-body text-sm placeholder:text-muted-foreground/70 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition"
          />
        </div>
      </div>

      {/* Grid */}
      {loading ? (
        <CardSkeletonGrid count={6} />
      ) : filtered.length === 0 ? (
        query.trim() ? (
          <EmptyState
            illustration="patients"
            title="Nenhum paciente encontrado"
            description="Ajuste a busca ou cadastre um novo paciente."
          />
        ) : (
          <EmptyState
            illustration="patients"
            title="Nenhum paciente cadastrado"
            description="Comece cadastrando seu primeiro paciente para gerar laudos."
            action={{ label: "Cadastrar paciente", to: "/registration" }}
          />
        )
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {filtered.map((p) => (
            <article
              key={p.id}
              className="bg-white rounded-xl border border-border/60 shadow-card hover-lift p-5 flex flex-col"
            >
              <div className="flex items-start gap-3">
                <div className="h-12 w-12 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-sans font-bold border border-blue-200 shrink-0">
                  {initialsOf(p.nome)}
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="font-sans font-semibold text-foreground truncate">{p.nome}</h3>
                  <p className="font-body text-sm text-muted-foreground">
                    {calcAge(p.dataNascimento)} anos · {generoLabel(p.genero)}
                  </p>
                </div>
                <span className="font-pill text-[11px] px-2 py-0.5 rounded-md bg-muted text-muted-foreground border border-border shrink-0">
                  {p.prontuario}
                </span>
              </div>

              <p className="font-body text-sm text-foreground/70 mt-4">
                Última visita:{" "}
                <span className="font-sans font-medium text-foreground">{formatDate(p.ultimaVisita)}</span>
              </p>

              <div className="mt-5 pt-4 border-t border-border/60 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => navigate(`/reports?paciente_id=${p.id}`)}
                  className="flex-1 inline-flex items-center justify-center gap-2 bg-primary text-primary-foreground font-sans font-semibold text-sm h-10 px-4 rounded-[8px] hover:scale-[1.02] hover:shadow-[0_12px_32px_-8px_hsl(var(--primary)/0.6)] transition-all duration-200"
                >
                  <Eye size={15} /> Ver Laudos
                </button>
                <button
                  type="button"
                  onClick={() => navigate("/registration")}
                  aria-label={`Editar ${p.nome}`}
                  className="h-10 w-10 inline-flex items-center justify-center rounded-[8px] border border-border bg-white text-foreground/70 hover:text-foreground hover:bg-surface transition-colors"
                >
                  <Pencil size={15} />
                </button>
                <button
                  type="button"
                  onClick={() => setToDelete(p)}
                  aria-label={`Excluir ${p.nome}`}
                  className="h-10 w-10 inline-flex items-center justify-center rounded-[8px] border border-destructive/20 bg-destructive/5 text-destructive hover:bg-destructive/10 transition-colors"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            </article>
          ))}
        </div>
      )}

      {/* Modal de exclusão */}
      <Dialog open={!!toDelete} onOpenChange={(o) => !o && setToDelete(null)}>
        <DialogContent>
          <DialogHeader>
            <div className="mx-auto sm:mx-0 inline-flex h-11 w-11 items-center justify-center rounded-full bg-destructive/10 text-destructive mb-2">
              <AlertTriangle size={20} />
            </div>
            <DialogTitle className="font-sans font-bold text-foreground text-lg">
              Excluir {toDelete?.nome}?
            </DialogTitle>
            <DialogDescription className="font-body text-muted-foreground">
              Tem certeza? Esta ação não pode ser desfeita. Os dados do paciente e os laudos vinculados deixarão de aparecer na sua lista.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-2">
            <button
              type="button"
              onClick={() => setToDelete(null)}
              disabled={deleting}
              className="inline-flex items-center justify-center bg-white border border-border text-foreground font-sans font-semibold text-sm h-10 px-4 rounded-[8px] hover:bg-surface transition disabled:opacity-60"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={confirmDelete}
              disabled={deleting}
              className="inline-flex items-center justify-center gap-2 bg-destructive text-destructive-foreground font-sans font-semibold text-sm h-10 px-4 rounded-[8px] hover:scale-[1.02] transition disabled:opacity-60 disabled:hover:scale-100"
            >
              <Trash2 size={15} /> {deleting ? "Excluindo..." : "Excluir paciente"}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Patients;
