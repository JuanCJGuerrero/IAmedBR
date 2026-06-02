/**
 * Modelos de laudo (templates). Mock <localStorage> vs real (GET /laudos/base).
 */

import { apiClient } from "./http";
import { env } from "./env";

export type TemplateCategory =
  | "Raio-X"
  | "Tomografia"
  | "Ressonância"
  | "Ultrassom"
  | "Ecocardiograma"
  | "EEG"
  | "Outros";

export const TEMPLATE_CATEGORIES: TemplateCategory[] = [
  "Raio-X",
  "Tomografia",
  "Ressonância",
  "Ultrassom",
  "Ecocardiograma",
  "EEG",
  "Outros",
];

export type TemplateContentType = "texto" | "pdf";

export interface Template {
  id: string;
  name: string;
  category: TemplateCategory;
  contentType: TemplateContentType;
  body: string;
  pdfName?: string;
  pdfDataUrl?: string;
  createdAt: number;
}

const STORAGE_KEY = "iamedbr.templates";

const SEED: Template[] = [
  {
    id: "tpl-rx-torax-normal",
    name: "Raio-X de Tórax Normal",
    category: "Raio-X",
    contentType: "texto",
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 30,
    body: `INDICAÇÃO CLÍNICA:
Avaliação de rotina.

TÉCNICA:
Radiografia do tórax em incidências PA e perfil esquerdo.

DESCRIÇÃO:
Campos pulmonares com transparência preservada, sem opacidades focais ou difusas.
Trama broncovascular de aspecto habitual.

CONCLUSÃO:
Exame radiográfico do tórax sem alterações significativas.`,
  },
  {
    id: "tpl-tc-abdome",
    name: "TC de Abdome",
    category: "Tomografia",
    contentType: "texto",
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 25,
    body: `INDICAÇÃO CLÍNICA:
Dor abdominal em investigação.

TÉCNICA:
Tomografia computadorizada do abdome total, com cortes axiais de 5 mm.

DESCRIÇÃO:
Fígado de dimensões e contornos preservados, sem lesões focais.
Vesícula biliar distendida, paredes finas, sem cálculos.

CONCLUSÃO:
Tomografia do abdome dentro dos padrões da normalidade.`,
  },
  {
    id: "tpl-rm-cranio",
    name: "RM de Crânio",
    category: "Ressonância",
    contentType: "texto",
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 20,
    body: `INDICAÇÃO CLÍNICA:
Cefaleia crônica.

TÉCNICA:
Ressonância magnética do encéfalo em sequências SE, FSE, FLAIR e DWI.

DESCRIÇÃO:
Parênquima encefálico com sinal preservado, sem áreas de restrição à difusão.

CONCLUSÃO:
Ressonância magnética do encéfalo dentro dos padrões da normalidade.`,
  },
  {
    id: "tpl-usg-abdominal",
    name: "USG Abdominal",
    category: "Ultrassom",
    contentType: "texto",
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 15,
    body: `INDICAÇÃO CLÍNICA:
Dor em hipocôndrio direito.

DESCRIÇÃO:
Fígado de dimensões e contornos preservados.
Vesícula biliar distendida, paredes finas, sem cálculos.

CONCLUSÃO:
Ultrassonografia abdominal sem alterações significativas.`,
  },
];

function readMock(): Template[] {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(SEED));
      return [...SEED];
    }
    return JSON.parse(raw) as Template[];
  } catch {
    return [...SEED];
  }
}

function writeMock(list: Template[]) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  } catch {
    /* ignore */
  }
}

const templatesApiMock = {
  list: (): Template[] => readMock().sort((a, b) => b.createdAt - a.createdAt),
  get: (id: string): Template | undefined => readMock().find((t) => t.id === id),
  upsert: async (
    tpl: Omit<Template, "id" | "createdAt"> & { id?: string },
  ): Promise<Template> => {
    await new Promise((r) => setTimeout(r, 250));
    const list = readMock();
    if (tpl.id) {
      const idx = list.findIndex((t) => t.id === tpl.id);
      if (idx >= 0) {
        const updated: Template = { ...list[idx], ...tpl, id: list[idx].id };
        list[idx] = updated;
        writeMock(list);
        return updated;
      }
    }
    const created: Template = {
      id: `tpl-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
      name: tpl.name,
      category: tpl.category,
      contentType: tpl.contentType,
      body: tpl.body,
      pdfName: tpl.pdfName,
      createdAt: Date.now(),
    };
    list.unshift(created);
    writeMock(list);
    return created;
  },
  remove: async (id: string): Promise<void> => {
    await new Promise((r) => setTimeout(r, 200));
    writeMock(readMock().filter((t) => t.id !== id));
  },
};

// =====================================================================
// REAL — GET /laudos/base + GET /laudos/tipos
// =====================================================================

type BackendLaudoBase = {
  id: number;
  titulo: string;
  tipo_laudo_id: number | null;
  tipo_conteudo: string;
  conteudo: string;
  arquivo_pdf: string | null;
  ativo: boolean;
  criado_em: string;
};

type BackendTipoLaudo = { id: number; nome: string };

let _tiposCache: BackendTipoLaudo[] = [];
async function loadTipos() {
  if (_tiposCache.length === 0) {
    const { data } = await apiClient.get<BackendTipoLaudo[]>("/laudos/tipos");
    _tiposCache = data;
  }
  return _tiposCache;
}

function categoryFromTipo(tipoId: number | null): TemplateCategory {
  const found = _tiposCache.find((t) => t.id === tipoId);
  if (!found) return "Outros";
  const map: Record<string, TemplateCategory> = {
    "Raio-X": "Raio-X",
    Tomografia: "Tomografia",
    Ressonância: "Ressonância",
    Ultrassom: "Ultrassom",
    Ecocardiograma: "Ecocardiograma",
    Eletroencefalograma: "EEG",
  };
  return map[found.nome] ?? "Outros";
}

function fromBackend(t: BackendLaudoBase): Template {
  return {
    id: String(t.id),
    name: t.titulo,
    category: categoryFromTipo(t.tipo_laudo_id),
    contentType: (t.tipo_conteudo === "pdf" ? "pdf" : "texto") as TemplateContentType,
    body: t.conteudo ?? "",
    pdfName: t.arquivo_pdf ?? undefined,
    pdfDataUrl: undefined,
    createdAt: t.criado_em ? new Date(t.criado_em).getTime() : Date.now(),
  };
}

let _cache: Template[] = [];
let _loaded = false;
const LOCAL_STORAGE_KEY = "iamedbr.templates.local";

function readLocal(): Template[] {
  try {
    const raw = window.localStorage.getItem(LOCAL_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as Template[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeLocal(list: Template[]) {
  try {
    window.localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(list));
  } catch {
    /* ignore */
  }
}

function mergeLocal(remote: Template[], local: Template[]): Template[] {
  if (local.length === 0) return remote;
  const localIds = new Set(local.map((t) => t.id));
  return [...local, ...remote.filter((t) => !localIds.has(t.id))];
}

async function loadAll(): Promise<Template[]> {
  await loadTipos();
  const { data } = await apiClient.get<BackendLaudoBase[]>("/laudos/base");
  const remote = data.map(fromBackend);
  const local = readLocal();
  _cache = mergeLocal(remote, local);
  _loaded = true;
  return _cache;
}

const templatesApiReal = {
  list: (): Template[] => {
    if (!_loaded) {
      loadAll().catch((e) => console.error("Falha ao listar modelos", e));
    }
    if (_cache.length === 0) {
      _cache = mergeLocal(_cache, readLocal());
    }
    return _cache;
  },
  listAsync: async (): Promise<Template[]> => loadAll(),
  get: (id: string): Template | undefined => {
    const cached = _cache.find((t) => t.id === id);
    if (cached) return cached;
    const local = readLocal();
    return local.find((t) => t.id === id);
  },
  upsert: async (
    tpl: Omit<Template, "id" | "createdAt"> & { id?: string },
  ): Promise<Template> => {
    // Backend /laudos/base e read-only no escopo atual.
    // Mantemos a operacao otimista localmente para a UX nao quebrar.
    console.warn(
      "[templates] upsert ainda nao tem endpoint POST no backend; usando cache local.",
    );
    const local = readLocal();
    if (tpl.id) {
      const idx = local.findIndex((t) => t.id === tpl.id);
      if (idx >= 0) {
        const updated: Template = { ...local[idx], ...tpl, id: local[idx].id };
        local[idx] = updated;
        writeLocal(local);
        _cache = mergeLocal(_cache.filter((t) => t.id !== updated.id), [updated]);
        return updated;
      }
    }
    const created: Template = {
      id: tpl.id ?? `tpl-local-${Date.now().toString(36)}`,
      name: tpl.name,
      category: tpl.category,
      contentType: tpl.contentType,
      body: tpl.body,
      pdfName: tpl.pdfName,
      pdfDataUrl: tpl.pdfDataUrl,
      createdAt: Date.now(),
    };
    writeLocal([created, ...local.filter((t) => t.id !== created.id)]);
    _cache = [created, ..._cache.filter((t) => t.id !== created.id)];
    return created;
  },
  remove: async (id: string): Promise<void> => {
    console.warn("[templates] DELETE remoto pendente; removendo so do cache.");
    const local = readLocal().filter((t) => t.id !== id);
    writeLocal(local);
    _cache = _cache.filter((t) => t.id !== id);
  },
};

export const templatesApi = env.useMock ? templatesApiMock : templatesApiReal;
