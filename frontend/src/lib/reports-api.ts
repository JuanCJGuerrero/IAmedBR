/**
 * Laudos + IA generativa + transcricao.
 * Mock <localStorage> vs real (FastAPI + IA + Whisper).
 */

import type { Patient } from "./patients-api";
import { apiClient, iaClient, transcricaoClient } from "./http";
import { env } from "./env";

export type ReportStatus = "Pendente" | "Em Andamento" | "Concluído" | "Revisado";

export type ExamType =
  | "Raio-X Tórax"
  | "Tomografia"
  | "Ressonância"
  | "Ultrassom"
  | "Mamografia"
  | "Densitometria";

export const EXAM_TYPES: ExamType[] = [
  "Raio-X Tórax",
  "Tomografia",
  "Ressonância",
  "Ultrassom",
  "Mamografia",
  "Densitometria",
];

export interface ReportTemplate {
  id: string;
  exam: ExamType;
  name: string;
  body: string;
}

export interface Report {
  id: string;
  patientId: string;
  exam: ExamType;
  status: ReportStatus;
  body: string;
  createdAt: number;
  updatedAt: number;
}

type TranscribeParams = {
  exam: ExamType;
  patient?: Patient | null;
  durationSec: number;
  audioBlob?: Blob;
};

export const EMPTY_REPORT_BODY = `INDICAÇÃO CLÍNICA:
-

TÉCNICA:
-

DESCRIÇÃO:
-

CONCLUSÃO:
-`;

export const TEMPLATES: ReportTemplate[] = [
  {
    id: "t-rx-torax-pa",
    exam: "Raio-X Tórax",
    name: "Tórax PA — padrão normal",
    body: `INDICAÇÃO CLÍNICA:
Tosse seca há 5 dias, sem febre.

TÉCNICA:
Radiografia do tórax em incidência PA e perfil esquerdo.

DESCRIÇÃO:
Campos pulmonares com transparência preservada, sem opacidades focais ou difusas.
Trama broncovascular de aspecto habitual.

CONCLUSÃO:
Exame radiográfico do tórax sem alterações significativas.`,
  },
  {
    id: "t-tc-cranio",
    exam: "Tomografia",
    name: "TC de crânio sem contraste",
    body: `INDICAÇÃO CLÍNICA:
Cefaleia intensa de início súbito.

TÉCNICA:
Tomografia computadorizada do crânio, sem contraste, cortes axiais de 5 mm.

DESCRIÇÃO:
Parênquima encefálico com coeficientes de atenuação preservados.

CONCLUSÃO:
Tomografia do crânio dentro dos padrões da normalidade.`,
  },
  {
    id: "t-rm-joelho",
    exam: "Ressonância",
    name: "RM de joelho — meniscopatia",
    body: `INDICAÇÃO CLÍNICA:
Dor em compartimento medial do joelho direito após trauma esportivo.

CONCLUSÃO:
Lesão grau III do corno posterior do menisco medial.`,
  },
  {
    id: "t-us-abdome",
    exam: "Ultrassom",
    name: "USG abdome total",
    body: `INDICAÇÃO CLÍNICA:
Dor em hipocôndrio direito.

CONCLUSÃO:
Ultrassonografia abdominal sem alterações significativas.`,
  },
];

// =====================================================================
// MOCK
// =====================================================================

const STORAGE_KEY = "iamedbr.reports";

function readMock(): Report[] {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as Report[];
  } catch {
    return [];
  }
}

function writeMock(list: Report[]) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  } catch {
    /* ignore */
  }
}

const reportsApiMock = {
  listByPatient: (patientId: string): Report[] =>
    readMock()
      .filter((r) => r.patientId === patientId)
      .sort((a, b) => b.updatedAt - a.updatedAt),

  listByPatientAsync: async (patientId: string): Promise<Report[]> =>
    readMock()
      .filter((r) => r.patientId === patientId)
      .sort((a, b) => b.updatedAt - a.updatedAt),

  upsert: async (report: Report): Promise<Report> => {
    await new Promise((r) => setTimeout(r, 250));
    const list = readMock();
    const idx = list.findIndex((r) => r.id === report.id);
    const updated = { ...report, updatedAt: Date.now() };
    if (idx >= 0) list[idx] = updated;
    else list.unshift(updated);
    writeMock(list);
    return updated;
  },

  generate: async (params: {
    exam: ExamType;
    patient?: Patient | null;
    rawText?: string;
  }): Promise<string> => {
    await new Promise((r) => setTimeout(r, 1500));
    const t = TEMPLATES.find((tpl) => tpl.exam === params.exam) ?? TEMPLATES[0];
    const indication =
      params.rawText && params.rawText.trim().length > 0
        ? params.rawText.trim().slice(0, 240)
        : "Conforme solicitação clínica.";
    return t.body.replace(
      /INDICAÇÃO CLÍNICA:\n[^\n]+/,
      `INDICAÇÃO CLÍNICA:\n${indication}`,
    );
  },

  transcribeAndGenerate: async (params: TranscribeParams): Promise<{ transcript: string; report: string }> => {
    await new Promise((r) => setTimeout(r, 1800));
    const transcript = `Paciente do sexo ${
      params.patient?.genero === "F" ? "feminino" : "masculino"
    }, queixa de ${
      params.exam === "Raio-X Tórax"
        ? "tosse persistente há cinco dias"
        : "desconforto local há uma semana"
    }. Exame com duração aproximada de ${Math.round(params.durationSec)} segundos.`;
    const report = await reportsApiMock.generate({
      exam: params.exam,
      patient: params.patient,
      rawText: transcript,
    });
    return { transcript, report };
  },
};

// =====================================================================
// REAL — FastAPI + IA + Whisper
// =====================================================================

type BackendLaudo = {
  id: number;
  paciente_id: number;
  tipo_laudo_id: number | null;
  conteudo: string;
  status: string;
  criado_em: string;
  atualizado_em: string;
};

type BackendTipoLaudo = { id: number; nome: string };

let _tiposCache: BackendTipoLaudo[] = [];
async function ensureTipos() {
  if (_tiposCache.length === 0) {
    const { data } = await apiClient.get<BackendTipoLaudo[]>("/laudos/tipos");
    _tiposCache = data;
  }
  return _tiposCache;
}

const EXAM_TO_TIPO: Record<ExamType, string> = {
  "Raio-X Tórax": "Raio-X",
  Tomografia: "Tomografia",
  Ressonância: "Ressonância",
  Ultrassom: "Ultrassom",
  Mamografia: "Raio-X", // backend nao tem Mamografia; fallback
  Densitometria: "Raio-X", // idem
};

function statusToBackend(s: ReportStatus): string {
  const m: Record<ReportStatus, string> = {
    Pendente: "pendente",
    "Em Andamento": "em-andamento",
    Concluído: "concluido",
    Revisado: "revisado",
  };
  return m[s];
}

function statusFromBackend(s: string): ReportStatus {
  const m: Record<string, ReportStatus> = {
    pendente: "Pendente",
    "em-andamento": "Em Andamento",
    concluido: "Concluído",
    revisado: "Revisado",
  };
  return m[s] ?? "Pendente";
}

function examFromBackend(tipoId: number | null): ExamType {
  const found = _tiposCache.find((t) => t.id === tipoId);
  if (!found) return "Raio-X Tórax";
  if (found.nome === "Raio-X") return "Raio-X Tórax";
  if (found.nome === "Tomografia") return "Tomografia";
  if (found.nome === "Ressonância") return "Ressonância";
  if (found.nome === "Ultrassom") return "Ultrassom";
  return "Raio-X Tórax";
}

function fromBackend(l: BackendLaudo): Report {
  return {
    id: String(l.id),
    patientId: String(l.paciente_id),
    exam: examFromBackend(l.tipo_laudo_id),
    status: statusFromBackend(l.status),
    body: l.conteudo ?? "",
    createdAt: l.criado_em ? new Date(l.criado_em).getTime() : Date.now(),
    updatedAt: l.atualizado_em ? new Date(l.atualizado_em).getTime() : Date.now(),
  };
}

const _byPatientCache = new Map<string, Report[]>();

const reportsApiReal = {
  listByPatient: (patientId: string): Report[] => {
    if (!_byPatientCache.has(patientId)) {
      // fire and forget; segunda renderizacao pega
      ensureTipos()
        .then(() =>
          apiClient.get<BackendLaudo[]>(`/laudos/paciente/${patientId}/todos`),
        )
        .then(({ data }) => {
          _byPatientCache.set(
            patientId,
            data.map(fromBackend).sort((a, b) => b.updatedAt - a.updatedAt),
          );
        })
        .catch((e) => console.error("Falha ao listar laudos do paciente", e));
      return [];
    }
    return _byPatientCache.get(patientId) ?? [];
  },

  listByPatientAsync: async (patientId: string): Promise<Report[]> => {
    await ensureTipos();
    const { data } = await apiClient.get<BackendLaudo[]>(
      `/laudos/paciente/${patientId}/todos`,
    );
    const list = data.map(fromBackend).sort((a, b) => b.updatedAt - a.updatedAt);
    _byPatientCache.set(patientId, list);
    return list;
  },

  upsert: async (report: Report): Promise<Report> => {
    await ensureTipos();
    const tipoNome = EXAM_TO_TIPO[report.exam];
    const tipo = _tiposCache.find((t) => t.nome === tipoNome);

    const isNew = report.id === "" || report.id.startsWith("local-") || Number.isNaN(Number(report.id));
    if (isNew) {
      const { data } = await apiClient.post<BackendLaudo>("/laudos/paciente", {
        paciente_id: Number(report.patientId),
        tipo_laudo_id: tipo?.id ?? null,
        conteudo: report.body,
      });
      const mapped = fromBackend(data);
      _byPatientCache.delete(report.patientId);
      return mapped;
    } else {
      const { data } = await apiClient.put<BackendLaudo>(
        `/laudos/paciente/${report.id}`,
        {
          tipo_laudo_id: tipo?.id ?? null,
          conteudo: report.body,
          status: statusToBackend(report.status),
        },
      );
      const mapped = fromBackend(data);
      _byPatientCache.delete(report.patientId);
      return mapped;
    }
  },

  generate: async (params: {
    exam: ExamType;
    patient?: Patient | null;
    rawText?: string;
  }): Promise<string> => {
    const sintomas = (params.rawText && params.rawText.trim()) || "Sem queixas adicionais relatadas.";
    try {
      const { data } = await iaClient.post("/gerar-laudo", { sintomas });
      // O backend de IA retorna um objeto JSON estruturado.
      // Convertemos pro formato textual padrao do editor.
      if (typeof data === "string") return data;
      const lines = [
        "INDICAÇÃO CLÍNICA:",
        sintomas,
        "",
        "HIPÓTESE DIAGNÓSTICA:",
        data.diagnostico_hipotese ?? "-",
        "",
        "EXAMES SUGERIDOS:",
        ...(Array.isArray(data.exames_sugeridos)
          ? data.exames_sugeridos.map((e: string) => `- ${e}`)
          : ["-"]),
        "",
        "RECOMENDAÇÕES:",
        data.recomendacoes ?? "-",
        "",
        "CID SUGERIDO:",
        data.cid_sugerido ?? "-",
      ];
      return lines.join("\n");
    } catch (e) {
      console.error("IA indisponível; usando template local de fallback.", e);
      const t = TEMPLATES.find((tpl) => tpl.exam === params.exam) ?? TEMPLATES[0];
      return t.body.replace(
        /INDICAÇÃO CLÍNICA:\n[^\n]+/,
        `INDICAÇÃO CLÍNICA:\n${sintomas.slice(0, 240)}`,
      );
    }
  },

  transcribeAndGenerate: async (params: TranscribeParams): Promise<{ transcript: string; report: string }> => {
    if (!params.audioBlob) {
      // Sem audio nao da pra transcrever; cai no fallback do mock
      const transcript = `Consulta gravada por ~${Math.round(params.durationSec)}s.`;
      const report = await reportsApiReal.generate({
        exam: params.exam,
        patient: params.patient,
        rawText: transcript,
      });
      return { transcript, report };
    }
    const fd = new FormData();
    fd.append("file", params.audioBlob, "gravacao.webm");
    const { data } = await transcricaoClient.post(
      "/transcrever-e-gerar-laudo",
      fd,
      {
        headers: { "Content-Type": "multipart/form-data" },
        timeout: 180_000,
      },
    );
    const transcript: string = data?.texto_transcrito ?? "";
    const laudoObj = data?.laudo;
    let report = "";
    if (laudoObj && typeof laudoObj === "object") {
      report = await reportsApiReal.generate({
        exam: params.exam,
        patient: params.patient,
        rawText: transcript,
      });
    } else {
      report = await reportsApiReal.generate({
        exam: params.exam,
        patient: params.patient,
        rawText: transcript,
      });
    }
    return { transcript, report };
  },
};

export const reportsApi = env.useMock ? reportsApiMock : reportsApiReal;
