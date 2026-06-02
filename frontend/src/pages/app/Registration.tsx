import { useMemo, useState } from "react";
import { Plus, Search, UserPlus, IdCard, Phone, Mail } from "lucide-react";
import PatientForm from "@/components/registration/PatientForm";
import { patientsApi, type Patient } from "@/lib/patients-api";

const formatDate = (iso: string) => {
  if (!iso) return "—";
  const d = new Date(iso + "T00:00:00");
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("pt-BR");
};

const Registration = () => {
  const [mode, setMode] = useState<"list" | "create">("list");
  const [patients, setPatients] = useState<Patient[]>(() => patientsApi.list());
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return patients;
    return patients.filter(
      (p) => p.nome.toLowerCase().includes(q) || p.prontuario.toLowerCase().includes(q) || p.cpf.includes(q),
    );
  }, [patients, query]);

  const handleSaved = (p: Patient) => {
    setPatients((prev) => [p, ...prev.filter((x) => x.id !== p.id)]);
    setMode("list");
  };

  if (mode === "create") {
    return (
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="font-sans font-bold text-foreground text-3xl">Novo paciente</h1>
            <p className="font-body text-muted-foreground mt-1">
              Capture o RG para preenchimento automático ou digite os dados.
            </p>
          </div>
        </div>
        <PatientForm onCancel={() => setMode("list")} onSaved={handleSaved} />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-sans font-bold text-foreground text-3xl">Cadastro</h1>
          <p className="font-body text-muted-foreground mt-1">{patients.length} paciente(s) na base.</p>
        </div>
        <button
          type="button"
          onClick={() => setMode("create")}
          className="inline-flex items-center gap-2 bg-primary text-primary-foreground font-sans font-semibold text-sm h-11 px-5 rounded-[8px] shadow-primary hover:scale-[1.02] hover:shadow-[0_16px_40px_-8px_hsl(var(--primary)/0.65)] transition-all duration-200"
        >
          <Plus size={16} /> Novo paciente
        </button>
      </div>

      {/* Busca */}
      <div className="relative max-w-md">
        <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar por nome, prontuário ou CPF"
          className="w-full h-11 pl-10 pr-4 rounded-[8px] border border-slate-200 bg-white text-foreground font-body text-sm placeholder:text-muted-foreground/70 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition"
        />
      </div>

      {/* Lista */}
      {filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed border-border p-12 text-center">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary mb-4">
            <UserPlus size={22} />
          </div>
          <p className="font-sans font-semibold text-foreground">Nenhum paciente encontrado</p>
          <p className="font-body text-sm text-muted-foreground mt-1">
            Cadastre o primeiro paciente capturando a foto do RG.
          </p>
          <button
            type="button"
            onClick={() => setMode("create")}
            className="mt-5 inline-flex items-center gap-2 bg-primary text-primary-foreground font-sans font-semibold text-sm h-11 px-5 rounded-[8px] hover:scale-[1.02] transition"
          >
            <Plus size={16} /> Novo paciente
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {filtered.map((p) => (
            <article
              key={p.id}
              className="bg-white rounded-xl border border-border/60 shadow-card hover:shadow-card-hover transition-shadow p-5"
            >
              <div className="flex items-start gap-3">
                <div className="h-11 w-11 rounded-full bg-primary/10 text-primary flex items-center justify-center font-sans font-bold border border-primary/15">
                  {p.nome
                    .split(" ")
                    .map((n) => n[0])
                    .slice(0, 2)
                    .join("")}
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="font-sans font-semibold text-foreground truncate">{p.nome}</h3>
                  <p className="font-pill text-xs text-primary">{p.prontuario}</p>
                </div>
              </div>

              <ul className="mt-4 space-y-1.5 text-sm text-foreground/80 font-body">
                <li className="flex items-center gap-2">
                  <IdCard size={14} className="text-muted-foreground" />
                  <span className="truncate">{p.cpf}</span>
                </li>
                <li className="flex items-center gap-2">
                  <Phone size={14} className="text-muted-foreground" />
                  <span className="truncate">{p.telefone || "—"}</span>
                </li>
                <li className="flex items-center gap-2">
                  <Mail size={14} className="text-muted-foreground" />
                  <span className="truncate">{p.email || "—"}</span>
                </li>
              </ul>

              <div className="mt-4 pt-3 border-t border-border/60 flex items-center justify-between text-xs">
                <span className="font-body text-muted-foreground">Nasc.: {formatDate(p.dataNascimento)}</span>
                <span className="font-pill text-accent">Ativo</span>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
};

export default Registration;
