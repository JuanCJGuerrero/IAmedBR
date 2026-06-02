import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import {
  FilePlus2,
  FileStack,
  Sparkles,
  Save,
  CheckCircle2,
  Download,
  History,
  AlertTriangle,
  Stethoscope,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { patientsApi, type Patient } from "@/lib/patients-api";
import { templatesApi, type Template, type TemplateCategory } from "@/lib/templates-api";
import {
  EMPTY_REPORT_BODY,
  EXAM_TYPES,
  reportsApi,
  type ExamType,
  type Report,
  type ReportStatus,
} from "@/lib/reports-api";

import PatientPicker from "@/components/reports/PatientPicker";
import RecordingStudio from "@/components/reports/RecordingStudio";
import ReportEditor from "@/components/reports/ReportEditor";
import AttachmentsPanel, {
  type AudioAttachment,
  type ImageAttachment,
  type PdfAttachment,
} from "@/components/reports/AttachmentsPanel";
import TemplatesDialog from "@/components/reports/TemplatesDialog";

const newReport = (patientId: string, exam: ExamType): Report => ({
  id: `rep-${Date.now()}`,
  patientId,
  exam,
  status: "Pendente",
  body: EMPTY_REPORT_BODY,
  createdAt: Date.now(),
  updatedAt: Date.now(),
});

const examFromCategory = (category: TemplateCategory): ExamType => {
  const map: Partial<Record<TemplateCategory, ExamType>> = {
    "Raio-X": "Raio-X Tórax",
    Tomografia: "Tomografia",
    "Ressonância": "Ressonância",
    Ultrassom: "Ultrassom",
  };
  return map[category] ?? "Raio-X Tórax";
};

const PATIENT_STORAGE_KEY = "iamedbr.reports.selectedPatient";

function readStoredPatientId(): string | null {
  try {
    return window.sessionStorage.getItem(PATIENT_STORAGE_KEY);
  } catch {
    return null;
  }
}

function storePatientId(id: string) {
  try {
    window.sessionStorage.setItem(PATIENT_STORAGE_KEY, id);
  } catch {
    /* ignore */
  }
}

const Reports = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [patients, setPatients] = useState<Patient[]>(() => patientsApi.list());
  const [patient, setPatient] = useState<Patient | null>(null);
  const [exam, setExam] = useState<ExamType>("Raio-X Tórax");
  const [report, setReport] = useState<Report>(() => newReport("none", "Raio-X Tórax"));
  const [history, setHistory] = useState<Report[]>([]);
  const [dirty, setDirty] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState<number | null>(null);
  const [generating, setGenerating] = useState(false);
  const [transcribing, setTranscribing] = useState(false);
  const [templatesOpen, setTemplatesOpen] = useState(false);
  const [confirmNew, setConfirmNew] = useState(false);
  const appliedTemplateRef = useRef<string | null>(null);

  const [images, setImages] = useState<ImageAttachment[]>([]);
  const [audios, setAudios] = useState<AudioAttachment[]>([]);
  const [pdfs, setPdfs] = useState<PdfAttachment[]>([]);

  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        const listAsync = (patientsApi as typeof patientsApi & { listAsync?: () => Promise<Patient[]> }).listAsync;
        if (!listAsync) return;
        const list = await listAsync();
        if (active) setPatients(list);
      } catch (e) {
        console.error("Falha ao listar pacientes", e);
      }
    };
    void load();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    const id = searchParams.get("paciente_id");
    if (!id || patient?.id === id) return;
    const found = patients.find((p) => p.id === id);
    if (!found) return;
    setPatient(found);
    storePatientId(found.id);
    setReport(newReport(found.id, exam));
    setHistory(reportsApi.listByPatient(found.id));
    setDirty(false);
    setLastSavedAt(null);
  }, [patients, searchParams, patient, exam]);

  useEffect(() => {
    if (patient) return;
    if (searchParams.get("paciente_id")) return;
    const storedId = readStoredPatientId();
    if (!storedId) return;
    const found = patients.find((p) => p.id === storedId);
    if (!found) return;
    setPatient(found);
    setReport(newReport(found.id, exam));
    setHistory(reportsApi.listByPatient(found.id));
    setDirty(false);
    setLastSavedAt(null);
  }, [patients, patient, exam, searchParams]);

  useEffect(() => {
    const templateId = searchParams.get("template");
    if (!templateId || appliedTemplateRef.current === templateId) return;

    let active = true;
    const applyTemplate = async () => {
      try {
        const listAsync = (
          templatesApi as typeof templatesApi & { listAsync?: () => Promise<Template[]> }
        ).listAsync;
        if (listAsync) await listAsync();

        const tpl = templatesApi.get(templateId);
        if (!tpl) {
          toast.error("Modelo não encontrado.");
          const next = new URLSearchParams(searchParams);
          next.delete("template");
          setSearchParams(next, { replace: true });
          return;
        }

        if (tpl.contentType === "pdf") {
          if (!tpl.pdfDataUrl) {
            toast.error("Este modelo nao possui o PDF anexado.");
            const next = new URLSearchParams(searchParams);
            next.delete("template");
            setSearchParams(next, { replace: true });
            return;
          }
          const res = await fetch(tpl.pdfDataUrl);
          const blob = await res.blob();
          const url = URL.createObjectURL(blob);
          setPdfs((prev) => [
            {
              id: `pdf-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
              name: tpl.pdfName || "modelo.pdf",
              url,
              addedAt: Date.now(),
            },
            ...prev,
          ]);
          if (!active) return;
          appliedTemplateRef.current = templateId;
          const nextExam = examFromCategory(tpl.category);
          setExam(nextExam);
            setReport((r) => ({ ...r, exam: nextExam, body: tpl.body || r.body }));
          setDirty(true);
          setLastSavedAt(null);
          toast.success(`Modelo "${tpl.name}" aplicado.`);
          const next = new URLSearchParams(searchParams);
          next.delete("template");
          setSearchParams(next, { replace: true });
          return;
        }

        if (!active) return;
        appliedTemplateRef.current = templateId;
        const nextExam = examFromCategory(tpl.category);
        setExam(nextExam);
        setReport((r) => ({ ...r, body: tpl.body, exam: nextExam }));
        setDirty(true);
        setLastSavedAt(null);
        toast.success(`Modelo "${tpl.name}" aplicado.`);
        const next = new URLSearchParams(searchParams);
        next.delete("template");
        setSearchParams(next, { replace: true });
      } catch (e) {
        console.error("Falha ao carregar modelo", e);
        toast.error("Falha ao aplicar modelo.");
        const next = new URLSearchParams(searchParams);
        next.delete("template");
        setSearchParams(next, { replace: true });
      }
    };

    void applyTemplate();
    return () => {
      active = false;
    };
  }, [searchParams, setSearchParams]);

  useEffect(() => {
    if (patient && !patients.find((p) => p.id === patient.id)) {
      setPatient(null);
      setHistory([]);
      setReport(newReport("none", exam));
      setDirty(false);
      setLastSavedAt(null);
    }
  }, [patients, patient, exam]);

  // Sincroniza paciente selecionado → histórico
  useEffect(() => {
    let active = true;

    if (!patient) {
      setHistory([]);
      return () => {
        active = false;
      };
    }

    const loadHistory = async () => {
      try {
        const listAsync = (
          reportsApi as typeof reportsApi & { listByPatientAsync?: (id: string) => Promise<Report[]> }
        ).listByPatientAsync;
        const list = listAsync
          ? await listAsync(patient.id)
          : reportsApi.listByPatient(patient.id);
        if (active) setHistory(list);
      } catch (e) {
        console.error("Falha ao listar laudos do paciente", e);
      }
    };

    setHistory([]);
    void loadHistory();

    return () => {
      active = false;
    };
  }, [patient]);

  /* ---------- handlers ---------- */

  const handleSelectPatient = (p: Patient) => {
    if (dirty && !window.confirm("Há alterações não salvas. Trocar de paciente mesmo assim?")) return;
    setPatient(p);
    storePatientId(p.id);
    const r = newReport(p.id, exam);
    setReport(r);
    setDirty(false);
    setLastSavedAt(null);
  };

  const handleExamChange = (e: ExamType) => {
    setExam(e);
    setReport((r) => ({ ...r, exam: e }));
    setDirty(true);
  };

  const handleNewReport = () => {
    if (dirty) {
      setConfirmNew(true);
      return;
    }
    doNewReport();
  };

  const doNewReport = () => {
    if (!patient) return;
    setReport(newReport(patient.id, exam));
    setDirty(false);
    setLastSavedAt(null);
    toast.success("Novo laudo iniciado.");
  };

  const handleEditorChange = (v: string) => {
    setReport((r) => ({ ...r, body: v }));
    setDirty(true);
  };

  const handleStatusChange = (s: ReportStatus) => {
    setReport((r) => ({ ...r, status: s }));
    setDirty(true);
  };

  const saveDraft = async (silent = false) => {
    if (!patient) {
      toast.error("Selecione um paciente antes de salvar.");
      return;
    }
    const saved = await reportsApi.upsert(report);
    setReport(saved);
    setDirty(false);
    setLastSavedAt(Date.now());
    const listAsync = (
      reportsApi as typeof reportsApi & { listByPatientAsync?: (id: string) => Promise<Report[]> }
    ).listByPatientAsync;
    const list = listAsync ? await listAsync(patient.id) : reportsApi.listByPatient(patient.id);
    setHistory(list);
    if (!silent) toast.success("Rascunho salvo.");
  };

  const finalize = async () => {
    if (!patient) {
      toast.error("Selecione um paciente.");
      return;
    }
    const saved = await reportsApi.upsert({ ...report, status: "Concluído" });
    setReport(saved);
    setDirty(false);
    setLastSavedAt(Date.now());
    const listAsync = (
      reportsApi as typeof reportsApi & { listByPatientAsync?: (id: string) => Promise<Report[]> }
    ).listByPatientAsync;
    const list = listAsync ? await listAsync(patient.id) : reportsApi.listByPatient(patient.id);
    setHistory(list);
    toast.success("Laudo finalizado e arquivado.");
  };

  const generateAi = async () => {
    setGenerating(true);
    const dismiss = toast.loading("Gerando laudo por IA...");
    try {
      const text = await reportsApi.generate({ exam, patient, rawText: report.body });
      setReport((r) => ({ ...r, body: text }));
      setDirty(true);
      toast.success("Laudo gerado pela IA.", { id: dismiss });
    } catch {
      toast.error("Falha ao gerar laudo.", { id: dismiss });
    } finally {
      setGenerating(false);
    }
  };

  const onRecordingStop = async (durationSec: number, audioBlob?: Blob) => {
    if (durationSec < 1) {
      toast.message("Gravação muito curta.");
      return;
    }
    setTranscribing(true);
    const dismiss = toast.loading("Transcrevendo áudio...");
    try {
      const { report: text } = await reportsApi.transcribeAndGenerate({
        exam,
        patient,
        durationSec,
        audioBlob,
      });
      setReport((r) => ({ ...r, body: text }));
      setDirty(true);
      toast.success("Laudo gerado a partir do áudio.", { id: dismiss });
    } catch {
      toast.error("Falha ao processar áudio.", { id: dismiss });
    } finally {
      setTranscribing(false);
    }
  };

  const exportPdf = () => {
    const w = window.open("", "_blank", "width=820,height=900");
    if (!w) {
      toast.error("Habilite popups para exportar.");
      return;
    }
    const doc = `<!doctype html><html><head><meta charset="utf-8"><title>Laudo ${
      patient?.nome ?? ""
    }</title><style>
      @page { margin: 24mm; }
      body { font-family: Inter, system-ui, sans-serif; color: #171717; }
      h1 { font-family: 'Instrument Serif', Georgia, serif; font-weight: 400; font-size: 28px; margin: 0 0 4px; }
      .meta { color: #64748b; font-size: 12px; margin-bottom: 24px; }
      pre { white-space: pre-wrap; font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: 12.5px; line-height: 1.55; }
      .footer { margin-top: 48px; border-top: 1px solid #e2e8f0; padding-top: 12px; color: #94a3b8; font-size: 11px; }
    </style></head><body>
      <h1>Laudo — ${exam}</h1>
      <div class="meta">Paciente: ${patient?.nome ?? "—"} · Prontuário: ${patient?.prontuario ?? "—"} · ${new Date().toLocaleDateString(
      "pt-BR",
    )}</div>
      <pre>${report.body.replace(/[<>&]/g, (c) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;" }[c] as string))}</pre>
      <div class="footer">IAmedBR — A IA atua apenas como suporte. O médico é responsável pelo conteúdo final do laudo.</div>
    </body></html>`;
    w.document.write(doc);
    w.document.close();
    w.focus();
    setTimeout(() => w.print(), 350);
  };

  /* ---------- atalhos ---------- */
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const ctrl = e.ctrlKey || e.metaKey;
      if (ctrl && e.key.toLowerCase() === "s") {
        e.preventDefault();
        void saveDraft();
      } else if (ctrl && e.key === "Enter") {
        e.preventDefault();
        void finalize();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [report, patient]);

  /* ---------- auto-save ---------- */
  const dirtyRef = useRef(dirty);
  dirtyRef.current = dirty;
  useEffect(() => {
    if (!dirty) return;
    const id = window.setTimeout(() => {
      if (dirtyRef.current) void saveDraft(true);
    }, 4000);
    return () => window.clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [report.body, report.status]);

  /* ---------- anexos ---------- */
  const addImages = (files: File[]) => {
    const created: ImageAttachment[] = files.map((f) => ({
      id: `img-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      name: f.name,
      url: URL.createObjectURL(f),
      addedAt: Date.now(),
    }));
    setImages((prev) => [...created, ...prev]);
    toast.success(`${created.length} imagem(ns) adicionada(s).`);
  };

  const addAudios = (files: File[]) => {
    const created: AudioAttachment[] = files.map((f) => ({
      id: `aud-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      name: f.name,
      url: URL.createObjectURL(f),
      durationSec: 0,
      addedAt: Date.now(),
    }));
    // Tenta resolver duração real
    created.forEach((c) => {
      const tmp = new Audio(c.url);
      tmp.addEventListener("loadedmetadata", () => {
        setAudios((prev) => prev.map((a) => (a.id === c.id ? { ...a, durationSec: tmp.duration || 0 } : a)));
      });
    });
    setAudios((prev) => [...created, ...prev]);
    toast.success(`${created.length} áudio(s) adicionado(s).`);
  };


  const removeImage = (id: string) =>
    setImages((prev) => {
      const t = prev.find((x) => x.id === id);
      if (t) URL.revokeObjectURL(t.url);
      return prev.filter((x) => x.id !== id);
    });
  const removeAudio = (id: string) =>
    setAudios((prev) => {
      const t = prev.find((x) => x.id === id);
      if (t) URL.revokeObjectURL(t.url);
      return prev.filter((x) => x.id !== id);
    });
  const removePdf = (id: string) =>
    setPdfs((prev) => {
      const t = prev.find((x) => x.id === id);
      if (t) URL.revokeObjectURL(t.url);
      return prev.filter((x) => x.id !== id);
    });

  /* ---------- UI ---------- */

  const ContextCol = (
    <aside className="space-y-4">
      <div className="bg-white rounded-2xl border border-border/60 shadow-card p-5 space-y-4">
        <div>
          <p className="font-pill text-[11px] uppercase tracking-wider text-muted-foreground mb-1.5">Paciente</p>
          <PatientPicker patients={patients} value={patient} onChange={handleSelectPatient} />
        </div>

        <div>
          <p className="font-pill text-[11px] uppercase tracking-wider text-muted-foreground mb-1.5">Tipo de exame</p>
          <Select value={exam} onValueChange={(v) => handleExamChange(v as ExamType)}>
            <SelectTrigger className="h-11 bg-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {EXAM_TYPES.map((e) => (
                <SelectItem key={e} value={e}>
                  {e}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-col gap-2 pt-1">
          <button
            type="button"
            onClick={() => setTemplatesOpen(true)}
            className="inline-flex items-center justify-center gap-2 bg-white border border-border text-foreground font-sans font-semibold text-sm h-10 rounded-[8px] hover:bg-surface transition"
          >
            <FileStack size={15} /> Aplicar modelo
          </button>
          <button
            type="button"
            onClick={handleNewReport}
            className="inline-flex items-center justify-center gap-2 bg-primary text-primary-foreground font-sans font-semibold text-sm h-10 rounded-[8px] shadow-primary hover:scale-[1.02] transition-all duration-200"
          >
            <FilePlus2 size={15} /> Novo laudo
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-border/60 shadow-card p-5">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-sans font-bold text-foreground inline-flex items-center gap-2">
            <History size={16} className="text-muted-foreground" /> Histórico
          </h3>
          <span className="font-pill text-[11px] text-muted-foreground">{history.length}</span>
        </div>
        {history.length === 0 ? (
          <p className="font-body text-sm text-muted-foreground">Sem laudos anteriores.</p>
        ) : (
          <ul className="space-y-2 max-h-72 overflow-auto pr-1">
            {history.map((h) => (
              <li key={h.id}>
                <button
                  type="button"
                  onClick={() => {
                    if (dirty && !window.confirm("Descartar alterações não salvas?")) return;
                    setReport(h);
                    setExam(h.exam);
                    setDirty(false);
                    setLastSavedAt(h.updatedAt);
                  }}
                  className="w-full text-left p-2.5 rounded-lg border border-border hover:border-primary/40 hover:bg-surface transition"
                >
                  <p className="font-sans font-semibold text-foreground text-sm truncate">{h.exam}</p>
                  <p className="font-pill text-[11px] text-muted-foreground">
                    {new Date(h.updatedAt).toLocaleString("pt-BR")} · {h.status}
                  </p>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="rounded-xl bg-warning/5 border border-warning/20 p-3 text-xs font-body text-foreground/70">
        Atalhos: <kbd className="px-1.5 py-0.5 rounded bg-white border border-border font-mono">Ctrl+S</kbd> salva,{" "}
        <kbd className="px-1.5 py-0.5 rounded bg-white border border-border font-mono">Ctrl+Enter</kbd> finaliza.
      </div>
    </aside>
  );

  const EditorCol = (
    <section className="space-y-4 flex flex-col">
      <RecordingStudio onStop={onRecordingStop} processing={transcribing} />
      <ReportEditor
        value={report.body}
        onChange={handleEditorChange}
        status={report.status}
        onStatusChange={handleStatusChange}
        lastSavedAt={lastSavedAt}
      />

      {/* Barra fixa */}
      <div className="sticky bottom-0 z-20 bg-white/95 backdrop-blur-md border border-border/60 rounded-2xl shadow-card p-3 flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={generateAi}
          disabled={generating}
          className="inline-flex items-center gap-2 bg-primary text-primary-foreground font-sans font-semibold text-sm h-10 px-4 rounded-[8px] shadow-primary hover:scale-[1.02] transition disabled:opacity-60 disabled:hover:scale-100"
        >
          <Sparkles size={15} /> {generating ? "Gerando..." : "Gerar laudo por IA"}
        </button>
        <button
          type="button"
          onClick={() => void saveDraft()}
          className="inline-flex items-center gap-2 bg-white border border-border text-foreground font-sans font-semibold text-sm h-10 px-4 rounded-[8px] hover:bg-surface transition"
        >
          <Save size={15} /> Salvar rascunho
        </button>
        <button
          type="button"
          onClick={() => void finalize()}
          className="inline-flex items-center gap-2 bg-accent text-accent-foreground font-sans font-semibold text-sm h-10 px-4 rounded-[8px] hover:scale-[1.02] hover:shadow-[0_12px_32px_-8px_hsl(var(--accent)/0.45)] transition"
        >
          <CheckCircle2 size={15} /> Salvar e finalizar
        </button>
        <button
          type="button"
          onClick={exportPdf}
          className="inline-flex items-center gap-2 bg-foreground text-white font-sans font-semibold text-sm h-10 px-4 rounded-[8px] hover:scale-[1.02] transition"
        >
          <Download size={15} /> Exportar PDF
        </button>
        <p className="ml-auto font-body text-[11px] text-muted-foreground inline-flex items-center gap-1.5">
          <Stethoscope size={12} /> A IA atua apenas como suporte. O médico é responsável pelo conteúdo final do laudo.
        </p>
      </div>
    </section>
  );

  const AttachmentsCol = (
    <AttachmentsPanel
      images={images}
      audios={audios}
      pdfs={pdfs}
      onAddImages={addImages}
      onAddAudios={addAudios}
      onRemoveImage={removeImage}
      onRemoveAudio={removeAudio}
      onRemovePdf={removePdf}
    />
  );

  return (
    <div className="max-w-[1400px] mx-auto">
      {/* Cabeçalho */}
      <div className="mb-6">
        <h1 className="font-sans font-bold text-foreground text-3xl">Laudos</h1>
        <p className="font-body text-muted-foreground mt-1">
          Estúdio de redação clínica com gravação por voz e suporte de IA.
        </p>
      </div>

      {/* Desktop: 3 colunas / Tablet: 2 colunas com anexos como tab embutida no editor / Mobile: tabs */}
      <div className="hidden xl:grid xl:grid-cols-[300px_minmax(0,1fr)_320px] gap-6">
        {ContextCol}
        {EditorCol}
        {AttachmentsCol}
      </div>

      <div className="hidden md:grid xl:hidden md:grid-cols-[280px_minmax(0,1fr)] gap-6">
        {ContextCol}
        <div className="space-y-4">
          {EditorCol}
          {AttachmentsCol}
        </div>
      </div>

      <div className="md:hidden">
        <Tabs defaultValue="editor">
          <TabsList className="w-full bg-surface p-1 rounded-lg">
            <TabsTrigger value="context" className="flex-1 data-[state=active]:bg-white">Contexto</TabsTrigger>
            <TabsTrigger value="editor" className="flex-1 data-[state=active]:bg-white">Editor</TabsTrigger>
            <TabsTrigger value="attach" className="flex-1 data-[state=active]:bg-white">Anexos</TabsTrigger>
          </TabsList>
          <TabsContent value="context" className="mt-4">{ContextCol}</TabsContent>
          <TabsContent value="editor" className="mt-4">{EditorCol}</TabsContent>
          <TabsContent value="attach" className="mt-4">{AttachmentsCol}</TabsContent>
        </Tabs>
      </div>

      <TemplatesDialog
        open={templatesOpen}
        onOpenChange={setTemplatesOpen}
        exam={exam}
        onApply={(tpl) => {
          setReport((r) => ({ ...r, body: tpl.body, exam: tpl.exam }));
          setExam(tpl.exam);
          setDirty(true);
          toast.success(`Modelo "${tpl.name}" aplicado.`);
        }}
      />

      <Dialog open={confirmNew} onOpenChange={setConfirmNew}>
        <DialogContent>
          <DialogHeader>
            <div className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-warning/10 text-warning mb-1">
              <AlertTriangle size={18} />
            </div>
            <DialogTitle className="font-sans font-bold">Descartar alterações?</DialogTitle>
            <DialogDescription className="font-body text-muted-foreground">
              Há alterações não salvas neste laudo. Iniciar um novo laudo descartará o conteúdo atual.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-2">
            <button
              type="button"
              onClick={() => setConfirmNew(false)}
              className="inline-flex items-center justify-center bg-white border border-border text-foreground font-sans font-semibold text-sm h-10 px-4 rounded-[8px] hover:bg-surface"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={() => {
                setConfirmNew(false);
                doNewReport();
              }}
              className="inline-flex items-center justify-center bg-destructive text-destructive-foreground font-sans font-semibold text-sm h-10 px-4 rounded-[8px] hover:scale-[1.02] transition"
            >
              Descartar e iniciar novo
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Reports;
