import { useMemo, useState, type FormEvent } from "react";
import { toast } from "sonner";
import { Save, X, Sparkles } from "lucide-react";
import RgCapture from "./RgCapture";
import { patientsApi, type Patient } from "@/lib/patients-api";
import {
  generateProntuario,
  isPastOrToday,
  isValidCPF,
  isValidEmail,
  maskCPF,
  maskPhone,
  onlyDigits,
} from "@/lib/patient-utils";
import { cn } from "@/lib/utils";

interface PatientFormProps {
  onCancel: () => void;
  onSaved: (p: Patient) => void;
}

type FieldErrors = Partial<Record<"nome" | "cpf" | "rg" | "dataNascimento" | "telefone" | "email", string>>;

const PatientForm = ({ onCancel, onSaved }: PatientFormProps) => {
  const initialProntuario = useMemo(() => generateProntuario(), []);

  const [fotoRg, setFotoRg] = useState<string | undefined>(undefined);
  const [ocrLoading, setOcrLoading] = useState(false);
  const [ocrApplied, setOcrApplied] = useState(false);

  const [nome, setNome] = useState("");
  const [cpf, setCpf] = useState("");
  const [rg, setRg] = useState("");
  const [dataNascimento, setDataNascimento] = useState("");
  const [telefone, setTelefone] = useState("");
  const [email, setEmail] = useState("");
  const [prontuario] = useState(initialProntuario);

  const [errors, setErrors] = useState<FieldErrors>({});
  const [submitting, setSubmitting] = useState(false);

  const handleCaptured = async (dataUrl: string) => {
    setFotoRg(dataUrl);
    setOcrLoading(true);
    const dismiss = toast.loading("Lendo RG...");
    try {
      const data = await patientsApi.ocrRg(dataUrl);
      setNome(data.nome);
      setCpf(maskCPF(data.cpf));
      setRg(data.rg);
      setDataNascimento(data.dataNascimento);
      setOcrApplied(true);
      setErrors({});
      toast.success("Dados extraídos do RG.", { id: dismiss });
    } catch {
      toast.error("Falha ao ler o RG. Preencha manualmente.", { id: dismiss });
    } finally {
      setOcrLoading(false);
    }
  };

  const validate = (): FieldErrors => {
    const e: FieldErrors = {};
    if (!nome.trim() || nome.trim().length < 3) e.nome = "Informe o nome completo.";
    if (!isValidCPF(cpf)) e.cpf = "CPF inválido.";
    if (!rg.trim()) e.rg = "Informe o RG.";
    if (!dataNascimento) e.dataNascimento = "Informe a data de nascimento.";
    else if (!isPastOrToday(dataNascimento)) e.dataNascimento = "A data não pode ser futura.";
    if (telefone && onlyDigits(telefone).length < 10) e.telefone = "Telefone incompleto.";
    if (!isValidEmail(email)) e.email = "E-mail inválido.";
    return e;
  };

  const handleSubmit = async (ev: FormEvent) => {
    ev.preventDefault();
    const e = validate();
    setErrors(e);
    if (Object.keys(e).length > 0) {
      toast.error("Verifique os campos destacados.");
      return;
    }
    setSubmitting(true);
    try {
      const p = await patientsApi.create({
        nome: nome.trim(),
        cpf,
        rg: rg.trim(),
        dataNascimento,
        telefone,
        email: email.trim(),
        prontuario,
        fotoRg,
      });
      toast.success(`Paciente ${p.nome} cadastrado.`);
      onSaved(p);
    } catch {
      toast.error("Não foi possível salvar. Tente novamente.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-2 gap-6" noValidate>
      {/* Coluna esquerda */}
      <div>
        <RgCapture onCaptured={handleCaptured} processing={ocrLoading} initialPreview={fotoRg} />
        {ocrApplied && (
          <div className="mt-3 inline-flex items-center gap-2 font-pill text-xs px-3 py-1.5 rounded-full bg-accent/10 text-accent border border-accent/15">
            <Sparkles size={12} /> Campos preenchidos automaticamente — revise antes de salvar.
          </div>
        )}
      </div>

      {/* Coluna direita */}
      <div className="bg-white rounded-2xl border border-border/60 shadow-card p-6">
        <h3 className="font-sans font-bold text-foreground">Dados do paciente</h3>
        <p className="font-body text-sm text-muted-foreground mb-5">
          Confira ou edite os dados extraídos do documento.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Nome completo" error={errors.nome} className="sm:col-span-2">
            <input
              type="text"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="Nome do paciente"
              className={inputClass(!!errors.nome)}
            />
          </Field>

          <Field label="CPF" error={errors.cpf}>
            <input
              type="text"
              inputMode="numeric"
              value={cpf}
              onChange={(e) => setCpf(maskCPF(e.target.value))}
              placeholder="000.000.000-00"
              className={inputClass(!!errors.cpf)}
            />
          </Field>

          <Field label="RG" error={errors.rg}>
            <input
              type="text"
              value={rg}
              onChange={(e) => setRg(e.target.value)}
              placeholder="00.000.000-0"
              className={inputClass(!!errors.rg)}
            />
          </Field>

          <Field label="Data de nascimento" error={errors.dataNascimento}>
            <input
              type="date"
              value={dataNascimento}
              max={new Date().toISOString().slice(0, 10)}
              onChange={(e) => setDataNascimento(e.target.value)}
              className={inputClass(!!errors.dataNascimento)}
            />
          </Field>

          <Field label="Telefone" error={errors.telefone}>
            <input
              type="tel"
              inputMode="tel"
              value={telefone}
              onChange={(e) => setTelefone(maskPhone(e.target.value))}
              placeholder="(00) 00000-0000"
              className={inputClass(!!errors.telefone)}
            />
          </Field>

          <Field label="E-mail" error={errors.email} className="sm:col-span-2">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="paciente@email.com"
              className={inputClass(!!errors.email)}
            />
          </Field>

          <Field label="Prontuário" hint="Gerado automaticamente">
            <input
              type="text"
              value={prontuario}
              readOnly
              className="w-full h-11 px-3.5 rounded-[8px] border border-slate-200 bg-surface text-foreground font-body text-sm focus:outline-none cursor-not-allowed"
            />
          </Field>
        </div>

        <div className="flex flex-wrap items-center gap-3 mt-8 pt-6 border-t border-border/60">
          <button
            type="submit"
            disabled={submitting}
            className="inline-flex items-center gap-2 bg-primary text-primary-foreground font-sans font-semibold text-sm h-11 px-5 rounded-[8px] shadow-primary hover:scale-[1.02] hover:shadow-[0_16px_40px_-8px_hsl(var(--primary)/0.65)] transition-all duration-200 disabled:opacity-70 disabled:cursor-not-allowed disabled:hover:scale-100"
          >
            <Save size={16} /> {submitting ? "Salvando..." : "Salvar paciente"}
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="inline-flex items-center gap-2 bg-white border border-border text-foreground font-sans font-semibold text-sm h-11 px-5 rounded-[8px] hover:bg-surface transition"
          >
            <X size={16} /> Cancelar
          </button>
        </div>
      </div>
    </form>
  );
};

/* ----------------- helpers ----------------- */

const inputClass = (invalid: boolean) =>
  cn(
    "w-full h-11 px-3.5 rounded-[8px] border bg-white text-foreground font-body text-sm placeholder:text-muted-foreground/70 focus:outline-none focus:ring-2 transition",
    invalid
      ? "border-destructive focus:border-destructive focus:ring-destructive/20"
      : "border-slate-200 focus:border-primary focus:ring-primary/20",
  );

const Field = ({
  label,
  error,
  hint,
  className,
  children,
}: {
  label: string;
  error?: string;
  hint?: string;
  className?: string;
  children: React.ReactNode;
}) => (
  <div className={className}>
    <label className="block font-sans font-medium text-sm text-foreground mb-1.5">{label}</label>
    {children}
    {error ? (
      <p className="mt-1 text-xs text-destructive font-body">{error}</p>
    ) : hint ? (
      <p className="mt-1 text-xs text-muted-foreground font-body">{hint}</p>
    ) : null}
  </div>
);

export default PatientForm;
