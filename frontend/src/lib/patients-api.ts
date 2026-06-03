/**
 * API de pacientes + OCR. Dispatcher mock (localStorage) vs real (FastAPI).
 * Componentes consomem `patientsApi` sem saber qual e qual.
 */

import { generateProntuario } from "./patient-utils";
import { apiClient, ocrClient } from "./http";
import { env } from "./env";

export type Genero = "F" | "M" | "Outro";

export interface Patient {
  id: string;
  prontuario: string;
  nome: string;
  cpf: string;
  rg: string;
  dataNascimento: string;
  telefone: string;
  email: string;
  fotoRg?: string;
  genero?: Genero;
  ultimaVisita?: string;
  createdAt: number;
}

// =====================================================================
// MOCK (jeito original Lovable, persiste em localStorage)
// =====================================================================

const STORAGE_KEY = "iamedbr.patients";
const SEED_VERSION = 2;
const SEED_VERSION_KEY = "iamedbr.patients.seed";

function readMock(): Patient[] {
  try {
    const versionRaw = window.localStorage.getItem(SEED_VERSION_KEY);
    const currentVersion = versionRaw ? parseInt(versionRaw, 10) : 0;
    if (currentVersion < SEED_VERSION) return seedMock();

    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return seedMock();
    const parsed = JSON.parse(raw) as Patient[];
    return Array.isArray(parsed) ? parsed : seedMock();
  } catch {
    return [];
  }
}

function writeMock(list: Patient[]) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  } catch {
    /* ignore */
  }
}

function seedMock(): Patient[] {
  const initial: Patient[] = [
    { id: "p-1", prontuario: "P-101", nome: "Maria Santos",       cpf: "529.982.247-25", rg: "12.345.678-9", dataNascimento: "1985-04-12", telefone: "(11) 98888-1234", email: "maria.santos@email.com",   genero: "F", ultimaVisita: "2026-04-22", createdAt: Date.now() - 86400000 * 30 },
    { id: "p-2", prontuario: "P-102", nome: "Joao Oliveira",      cpf: "248.438.034-80", rg: "23.456.789-0", dataNascimento: "1972-09-30", telefone: "(11) 97777-5678", email: "joao.oliveira@email.com",  genero: "M", ultimaVisita: "2026-04-28", createdAt: Date.now() - 86400000 * 28 },
    { id: "p-3", prontuario: "P-103", nome: "Ana Costa",          cpf: "390.533.447-05", rg: "34.567.890-1", dataNascimento: "1990-07-21", telefone: "(21) 96666-1122", email: "ana.costa@email.com",      genero: "F", ultimaVisita: "2026-03-15", createdAt: Date.now() - 86400000 * 25 },
    { id: "p-4", prontuario: "P-104", nome: "Pedro Alves",        cpf: "111.444.777-35", rg: "45.678.901-2", dataNascimento: "1968-02-03", telefone: "(11) 95555-3344", email: "pedro.alves@email.com",    genero: "M", ultimaVisita: "2026-04-30", createdAt: Date.now() - 86400000 * 20 },
    { id: "p-5", prontuario: "P-105", nome: "Beatriz Ferreira",   cpf: "153.518.107-71", rg: "56.789.012-3", dataNascimento: "1995-11-17", telefone: "(31) 94444-5566", email: "beatriz.ferreira@email.com", genero: "F", ultimaVisita: "2026-04-10", createdAt: Date.now() - 86400000 * 18 },
    { id: "p-6", prontuario: "P-106", nome: "Rafael Souza",       cpf: "871.156.020-86", rg: "67.890.123-4", dataNascimento: "1980-06-09", telefone: "(41) 93333-7788", email: "rafael.souza@email.com",   genero: "M", ultimaVisita: "2026-02-26", createdAt: Date.now() - 86400000 * 15 },
    { id: "p-7", prontuario: "P-107", nome: "Carla Mendes",       cpf: "065.832.090-44", rg: "78.901.234-5", dataNascimento: "1978-01-25", telefone: "(51) 92222-9900", email: "carla.mendes@email.com",   genero: "F", ultimaVisita: "2026-04-18", createdAt: Date.now() - 86400000 * 10 },
    { id: "p-8", prontuario: "P-108", nome: "Lucas Pereira",      cpf: "256.625.620-18", rg: "89.012.345-6", dataNascimento: "2001-12-05", telefone: "(11) 91111-2233", email: "lucas.pereira@email.com",  genero: "M", ultimaVisita: "2026-04-05", createdAt: Date.now() - 86400000 * 7 },
    { id: "p-9", prontuario: "P-109", nome: "Juliana Almeida",    cpf: "938.106.480-76", rg: "90.123.456-7", dataNascimento: "1992-08-14", telefone: "(11) 90000-4455", email: "juliana.almeida@email.com", genero: "F", ultimaVisita: "2026-04-26", createdAt: Date.now() - 86400000 * 3 },
  ];
  writeMock(initial);
  try {
    window.localStorage.setItem(SEED_VERSION_KEY, String(SEED_VERSION));
  } catch {
    /* ignore */
  }
  return initial;
}

const patientsApiMock = {
  list: (): Patient[] => readMock(),

  listAsync: async (): Promise<Patient[]> => readMock(),

  remove: async (id: string): Promise<void> => {
    await new Promise((r) => setTimeout(r, 300));
    writeMock(readMock().filter((p) => p.id !== id));
  },

  create: async (
    data: Omit<Patient, "id" | "createdAt" | "prontuario"> & { prontuario?: string },
  ): Promise<Patient> => {
    await new Promise((r) => setTimeout(r, 500));
    const list = readMock();
    const patient: Patient = {
      ...data,
      id: `p-${Date.now()}`,
      prontuario: data.prontuario || generateProntuario(),
      createdAt: Date.now(),
    };
    writeMock([patient, ...list]);
    return patient;
  },

  ocrRg: async (
    _imageDataUrl: string,
  ): Promise<{ nome: string; cpf: string; rg: string; dataNascimento: string }> => {
    await new Promise((r) => setTimeout(r, 1400));
    return {
      nome: "Carlos Eduardo Pereira",
      cpf: "390.533.447-05",
      rg: "34.567.890-1",
      dataNascimento: "1990-07-21",
    };
  },
};

// =====================================================================
// REAL (FastAPI / OCR microservices)
// =====================================================================

type BackendPaciente = {
  id: number;
  nome: string;
  cpf: string | null;
  rg: string | null;
  data_nascimento: string | null;
  prontuario: string | null;
  rg_photo: string | null;
  criado_em: string;
  atualizado_em: string;
};

function fromBackend(p: BackendPaciente): Patient {
  return {
    id: String(p.id),
    prontuario: p.prontuario ?? "",
    nome: p.nome ?? "",
    cpf: p.cpf ?? "",
    rg: p.rg ?? "",
    dataNascimento: p.data_nascimento ?? "",
    // Backend ainda nao tem esses campos; ficam vazios pra UI lidar.
    telefone: "",
    email: "",
    fotoRg: p.rg_photo ?? undefined,
    genero: undefined,
    ultimaVisita: undefined,
    createdAt: p.criado_em ? new Date(p.criado_em).getTime() : Date.now(),
  };
}

function toBackend(p: Partial<Patient>) {
  return {
    nome: p.nome,
    cpf: p.cpf || null,
    rg: p.rg || null,
    data_nascimento: p.dataNascimento || null,
    prontuario: p.prontuario || null,
    rg_photo: p.fotoRg || null,
  };
}

function dataUrlToBlob(dataUrl: string): Blob {
  const [header, base64] = dataUrl.split(",");
  const mimeMatch = header?.match(/data:(.*?);base64/);
  const mimeType = mimeMatch?.[1] || "image/jpeg";
  const binary = atob(base64 || "");
  const bytes = new Uint8Array(binary.length);

  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }

  return new Blob([bytes], { type: mimeType });
}

// Cache simples para list() sincrono (componentes esperam Patient[] sync)
let _cache: Patient[] = [];
let _cacheLoaded = false;

async function loadAll(): Promise<Patient[]> {
  const { data } = await apiClient.get<BackendPaciente[]>("/pacientes");
  _cache = data.map(fromBackend);
  _cacheLoaded = true;
  return _cache;
}

const patientsApiReal = {
  list: (): Patient[] => {
    if (!_cacheLoaded) {
      // Dispara carga em background; primeira renderizacao ve [].
      loadAll().catch((e) => console.error("Falha ao listar pacientes", e));
    }
    return _cache;
  },

  /** Versao async (preferida pelo restante do codigo quando precisa garantir) */
  listAsync: async (): Promise<Patient[]> => loadAll(),

  remove: async (id: string): Promise<void> => {
    await apiClient.delete(`/pacientes/${id}`);
    _cache = _cache.filter((p) => p.id !== id);
  },

  create: async (
    data: Omit<Patient, "id" | "createdAt" | "prontuario"> & { prontuario?: string },
  ): Promise<Patient> => {
    const body = {
      ...toBackend(data as Partial<Patient>),
      prontuario: data.prontuario || generateProntuario(),
    };
    const { data: created } = await apiClient.post<BackendPaciente>(
      "/pacientes",
      body,
    );
    const mapped = fromBackend(created);
    _cache = [mapped, ..._cache];
    return mapped;
  },

  ocrRg: async (
    imageDataUrl: string,
  ): Promise<{ nome: string; cpf: string; rg: string; dataNascimento: string }> => {
    // Converte data URL em File sem passar pelo fetch, para evitar CSP em browsers.
    const blob = dataUrlToBlob(imageDataUrl);
    const file = new File([blob], "rg.jpg", { type: blob.type || "image/jpeg" });
    const fd = new FormData();
    fd.append("image", file);
    const { data } = await ocrClient.post("/api/ocr", fd, {
      headers: { "Content-Type": "multipart/form-data" },
      timeout: 60_000,
    });
    const dados = data?.dados ?? {};
    // Backend devolve dataNascimento em formato dd/mm/yyyy; UI espera yyyy-mm-dd
    const dn = (dados.data_nascimento ?? "") as string;
    const isoDn = /^\d{2}\/\d{2}\/\d{4}$/.test(dn)
      ? dn.split("/").reverse().join("-")
      : dn;
    return {
      nome: dados.nome ?? "",
      cpf: dados.cpf ?? "",
      rg: dados.rg ?? "",
      dataNascimento: isoDn,
    };
  },
};

export const patientsApi = env.useMock ? patientsApiMock : patientsApiReal;
