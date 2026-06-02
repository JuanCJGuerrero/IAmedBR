import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import {
  FileText,
  Plus,
  Search,
  Pencil,
  Trash2,
  Upload,
  FileType2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  templatesApi,
  TEMPLATE_CATEGORIES,
  type Template,
  type TemplateCategory,
  type TemplateContentType,
} from "@/lib/templates-api";
import { apiClient } from "@/lib/http";
import EmptyState from "@/components/feedback/EmptyState";
import { CardSkeletonGrid } from "@/components/feedback/Skeletons";

const TEMPLATE_HINT = `INDICAÇÃO CLÍNICA:
-

TÉCNICA:
-

DESCRIÇÃO:
-

CONCLUSÃO:
-`;

function formatDate(ts: number) {
  return new Date(ts).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

interface FormState {
  id?: string;
  name: string;
  category: TemplateCategory;
  contentType: TemplateContentType;
  body: string;
  pdfName?: string;
  pdfDataUrl?: string;
}

const EMPTY_FORM: FormState = {
  name: "",
  category: "Raio-X",
  contentType: "texto",
  body: TEMPLATE_HINT,
  pdfName: undefined,
  pdfDataUrl: undefined,
};

const PATIENT_STORAGE_KEY = "iamedbr.reports.selectedPatient";

function readStoredPatientId(): string | null {
  try {
    return window.sessionStorage.getItem(PATIENT_STORAGE_KEY);
  } catch {
    return null;
  }
}

export default function Templates() {
  const navigate = useNavigate();
  const [items, setItems] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<TemplateCategory | "all">("all");

  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<Template | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);

  useEffect(() => {
    const t = window.setTimeout(() => {
      setItems(templatesApi.list());
      setLoading(false);
    }, 250);
    return () => window.clearTimeout(t);
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return items.filter((t) => {
      if (filter !== "all" && t.category !== filter) return false;
      if (!q) return true;
      return (
        t.name.toLowerCase().includes(q) ||
        t.category.toLowerCase().includes(q)
      );
    });
  }, [items, query, filter]);

  const grouped = useMemo(() => {
    const map = new Map<TemplateCategory, Template[]>();
    for (const t of filtered) {
      const list = map.get(t.category) ?? [];
      list.push(t);
      map.set(t.category, list);
    }
    return TEMPLATE_CATEGORIES
      .map((c) => ({ category: c, list: map.get(c) ?? [] }))
      .filter((g) => g.list.length > 0);
  }, [filtered]);

  function openNew() {
    setForm(EMPTY_FORM);
    setDialogOpen(true);
  }

  function openEdit(t: Template) {
    setForm({
      id: t.id,
      name: t.name,
      category: t.category,
      contentType: t.contentType,
      body: t.body,
      pdfName: t.pdfName,
      pdfDataUrl: t.pdfDataUrl,
    });
    setDialogOpen(true);
  }

  async function handleSave() {
    if (!form.name.trim()) {
      toast.error("Informe o nome do modelo.");
      return;
    }
    if (form.contentType === "texto" && !form.body.trim()) {
      toast.error("O conteúdo do modelo não pode estar vazio.");
      return;
    }
    if (form.contentType === "pdf" && !form.pdfName) {
      toast.error("Anexe um arquivo PDF.");
      return;
    }
    if (form.contentType === "pdf" && !form.body.trim()) {
      toast.error("Nao foi possivel extrair o texto do PDF.");
      return;
    }
    setSaving(true);
    try {
      await templatesApi.upsert({
        id: form.id,
        name: form.name.trim(),
        category: form.category,
        contentType: form.contentType,
        body: form.body,
        pdfName: form.contentType === "pdf" ? form.pdfName : undefined,
        pdfDataUrl: form.contentType === "pdf" ? form.pdfDataUrl : undefined,
      });
      setItems(templatesApi.list());
      setDialogOpen(false);
      toast.success(form.id ? "Modelo atualizado." : "Modelo criado com sucesso.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!confirmDelete) return;
    await templatesApi.remove(confirmDelete.id);
    setItems(templatesApi.list());
    toast.success("Modelo excluído.");
    setConfirmDelete(null);
  }

  function handleUse(t: Template) {
    if (t.contentType === "pdf") {
      toast.info("Modelos em PDF não populam o editor — abra o anexo no laudo.");
    }
    const patientId = readStoredPatientId();
    const params = new URLSearchParams({ template: t.id });
    if (patientId) params.set("paciente_id", patientId);
    navigate(`/reports?${params.toString()}`);
  }

  function handleFile(file: File | undefined) {
    if (!file) return;
    if (file.type !== "application/pdf") {
      toast.error("Apenas arquivos PDF são aceitos.");
      return;
    }
    const reader = new FileReader();
    reader.onload = async () => {
      const result = typeof reader.result === "string" ? reader.result : "";
      setForm((f) => ({ ...f, pdfName: file.name, pdfDataUrl: result }));
      try {
        const fd = new FormData();
        fd.append("file", file);
        const { data } = await apiClient.post<{ text: string }>(
          "/laudos/base/extract-pdf",
          fd,
          { headers: { "Content-Type": "multipart/form-data" } },
        );
        setForm((f) => ({ ...f, body: data.text || f.body }));
      } catch (e) {
        console.error("Falha ao extrair PDF", e);
        toast.error("Falha ao extrair texto do PDF.");
      }
    };
    reader.onerror = () => toast.error("Falha ao ler o PDF.");
    reader.readAsDataURL(file);
  }

  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">
            Modelos de Laudos
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Crie e gerencie seus modelos personalizados.
          </p>
        </div>
        <Button
          onClick={openNew}
          aria-label="Criar novo modelo de laudo"
          className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg shadow-primary hover-lift"
        >
          <Plus className="mr-2 h-4 w-4" aria-hidden />
          Novo Modelo
        </Button>
      </div>

      {/* Filtros */}
      <Card className="border-slate-200 p-4">
        <div className="grid gap-3 md:grid-cols-[1fr_240px]">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar por nome ou categoria..."
              className="pl-9 border-slate-200 focus-visible:border-blue-600 focus-visible:ring-0"
            />
          </div>
          <Select
            value={filter}
            onValueChange={(v) => setFilter(v as TemplateCategory | "all")}
          >
            <SelectTrigger className="border-slate-200">
              <SelectValue placeholder="Categoria" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as categorias</SelectItem>
              {TEMPLATE_CATEGORIES.map((c) => (
                <SelectItem key={c} value={c}>
                  {c}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </Card>

      {/* Empty state / loading */}
      {loading ? (
        <CardSkeletonGrid count={6} />
      ) : grouped.length === 0 ? (
        query.trim() || filter !== "all" ? (
          <EmptyState
            illustration="templates"
            title="Nenhum modelo encontrado"
            description="Ajuste o filtro ou a busca para ver outros modelos."
          />
        ) : (
          <EmptyState
            illustration="templates"
            title="Nenhum modelo criado"
            description="Crie modelos reutilizáveis para acelerar a redação dos seus laudos."
            action={{ label: "Criar modelo", onClick: openNew }}
          />
        )
      ) : null}

      {/* Grupos por categoria */}
      <div className="space-y-8">
        {grouped.map(({ category, list }) => (
          <section key={category}>
            <div className="mb-3 flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-md bg-blue-50">
                <FileText className="h-4 w-4 text-blue-600" />
              </div>
              <h2 className="text-lg font-semibold text-slate-900">
                {category}
              </h2>
              <Badge
                variant="secondary"
                className="bg-slate-100 text-slate-600 hover:bg-slate-100"
              >
                {list.length}
              </Badge>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {list.map((t) => (
                <Card
                  key={t.id}
                  className="relative flex flex-col border-slate-200 rounded-xl shadow-card hover-lift p-5"
                >
                  <Badge
                    variant="outline"
                    className={`absolute right-4 top-4 text-[10px] font-medium uppercase tracking-wide ${
                      t.contentType === "pdf"
                        ? "border-rose-200 bg-rose-50 text-rose-700"
                        : "border-blue-200 bg-blue-50 text-blue-700"
                    }`}
                  >
                    {t.contentType === "pdf" ? (
                      <>
                        <FileType2 className="mr-1 h-3 w-3" />
                        PDF
                      </>
                    ) : (
                      "Texto"
                    )}
                  </Badge>

                  <h3 className="pr-16 font-semibold text-slate-900">
                    {t.name}
                  </h3>

                  <div className="relative mt-3 h-16 overflow-hidden text-xs leading-relaxed text-slate-500">
                    {t.contentType === "pdf" ? (
                      t.body ? (
                        <pre className="whitespace-pre-wrap font-sans">
                          {t.body.split("\n").slice(0, 3).join("\n")}
                        </pre>
                      ) : (
                        <span className="text-slate-400">
                          Anexo: {t.pdfName ?? "documento.pdf"}
                        </span>
                      )
                    ) : (
                      <pre className="whitespace-pre-wrap font-sans">
                        {t.body.split("\n").slice(0, 3).join("\n")}
                      </pre>
                    )}
                    <div className="pointer-events-none absolute inset-x-0 bottom-0 h-8 bg-gradient-to-t from-white to-transparent" />
                  </div>

                  <p className="mt-3 text-xs text-slate-400">
                    Criado em {formatDate(t.createdAt)}
                  </p>

                  <div className="mt-4 flex items-center gap-2">
                    <Button
                      onClick={() => handleUse(t)}
                      aria-label={`Usar modelo ${t.name}`}
                      className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg"
                      size="sm"
                    >
                      Usar
                    </Button>
                    <Button
                      onClick={() => openEdit(t)}
                      variant="outline"
                      size="icon"
                      className="border-slate-200"
                      aria-label="Editar"
                    >
                      <Pencil className="h-4 w-4 text-slate-600" />
                    </Button>
                    <Button
                      onClick={() => setConfirmDelete(t)}
                      variant="outline"
                      size="icon"
                      className="border-slate-200 hover:border-red-200 hover:bg-red-50"
                      aria-label="Excluir"
                    >
                      <Trash2 className="h-4 w-4 text-red-600" />
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          </section>
        ))}
      </div>

      {/* Dialog Novo/Editar */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-h-[100dvh] max-w-2xl overflow-y-auto sm:max-h-[90vh] sm:rounded-lg">
          <DialogHeader>
            <DialogTitle>
              {form.id ? "Editar modelo" : "Novo modelo"}
            </DialogTitle>
            <DialogDescription>
              Defina nome, categoria e conteúdo do modelo.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="tpl-name">Nome</Label>
                <Input
                  id="tpl-name"
                  value={form.name}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, name: e.target.value }))
                  }
                  placeholder="Ex: Raio-X de Tórax Normal"
                  className="border-slate-200 focus-visible:border-blue-600 focus-visible:ring-0"
                />
              </div>
              <div className="space-y-2">
                <Label>Categoria</Label>
                <Select
                  value={form.category}
                  onValueChange={(v) =>
                    setForm((f) => ({ ...f, category: v as TemplateCategory }))
                  }
                >
                  <SelectTrigger className="border-slate-200">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TEMPLATE_CATEGORIES.map((c) => (
                      <SelectItem key={c} value={c}>
                        {c}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Tipo de conteúdo</Label>
              <div className="inline-flex rounded-md border border-slate-200 bg-slate-50 p-1">
                <button
                  type="button"
                  onClick={() =>
                    setForm((f) => ({ ...f, contentType: "texto" }))
                  }
                  className={`px-4 py-1.5 text-sm font-medium rounded transition ${
                    form.contentType === "texto"
                      ? "bg-white text-slate-900 shadow-sm"
                      : "text-slate-500 hover:text-slate-700"
                  }`}
                >
                  Texto livre
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setForm((f) => ({ ...f, contentType: "pdf" }))
                  }
                  className={`px-4 py-1.5 text-sm font-medium rounded transition ${
                    form.contentType === "pdf"
                      ? "bg-white text-slate-900 shadow-sm"
                      : "text-slate-500 hover:text-slate-700"
                  }`}
                >
                  Anexo PDF
                </button>
              </div>
            </div>

            {form.contentType === "texto" ? (
              <div className="space-y-2">
                <Label htmlFor="tpl-body">Conteúdo do modelo</Label>
                <Textarea
                  id="tpl-body"
                  value={form.body}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, body: e.target.value }))
                  }
                  rows={14}
                  placeholder={TEMPLATE_HINT}
                  className="font-mono text-xs border-slate-200 focus-visible:border-blue-600 focus-visible:ring-0"
                />
                <p className="text-xs text-slate-400">
                  Sugestão de estrutura: INDICAÇÃO / TÉCNICA / DESCRIÇÃO / CONCLUSÃO.
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                <Label>Arquivo PDF</Label>
                <div
                  onDragOver={(e) => {
                    e.preventDefault();
                    setDragOver(true);
                  }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setDragOver(false);
                    handleFile(e.dataTransfer.files?.[0]);
                  }}
                  onClick={() => fileRef.current?.click()}
                  className={`flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed p-8 text-center transition ${
                    dragOver
                      ? "border-blue-500 bg-blue-50"
                      : "border-slate-200 bg-slate-50 hover:border-blue-300 hover:bg-blue-50/40"
                  }`}
                >
                  <Upload className="h-8 w-8 text-slate-400" />
                  <p className="mt-3 text-sm font-medium text-slate-700">
                    {form.pdfName
                      ? form.pdfName
                      : "Arraste o PDF ou clique para selecionar"}
                  </p>
                  <p className="mt-1 text-xs text-slate-400">
                    Apenas arquivos .pdf
                  </p>
                  <input
                    ref={fileRef}
                    type="file"
                    accept="application/pdf"
                    className="hidden"
                    onChange={(e) => handleFile(e.target.files?.[0])}
                  />
                </div>
              </div>
            )}
          </div>

          <DialogFooter className="gap-2 sm:gap-2">
            <Button
              variant="outline"
              onClick={() => setDialogOpen(false)}
              disabled={saving}
              className="border-slate-200"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleSave}
              disabled={saving}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {saving ? "Salvando..." : "Salvar modelo"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirmação de exclusão */}
      <AlertDialog
        open={!!confirmDelete}
        onOpenChange={(o) => !o && setConfirmDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir modelo</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir{" "}
              <strong>{confirmDelete?.name}</strong>? Esta ação não pode ser
              desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
