/**
 * Kanban de gestao de laudos. Mock <localStorage>.
 *
 * Em modo real, derivamos o board a partir de:
 *  - GET /pacientes
 *  - GET /laudos/paciente/{id}/todos para cada paciente
 * Operacoes de mover/criar/remover usam PUT / POST / DELETE de /laudos/paciente.
 */

import { apiClient } from "./http";
import { env } from "./env";

export type BoardStatus = "Pendente" | "Em Andamento" | "Revisado" | "Concluído";
export type Priority = "alta" | "média" | "baixa";

export const BOARD_STATUSES: BoardStatus[] = [
  "Pendente",
  "Em Andamento",
  "Revisado",
  "Concluído",
];

export interface BoardCard {
  id: string;
  patientId: string;
  patientName: string;
  exam: string;
  doctor: string;
  priority: Priority;
  status: BoardStatus;
  createdAt: number;
  notes?: string;
}

const STORAGE_KEY = "iamedbr.board";
const SEED_KEY = "iamedbr.board.seed";
const SEED_VERSION = 1;

const DOCTORS = [
  "Dr. João Silva",
  "Dra. Helena Rocha",
  "Dr. André Martins",
  "Dra. Patrícia Lima",
];

export const BOARD_DOCTORS = DOCTORS;

function daysAgo(d: number) {
  return Date.now() - d * 86400000;
}

function buildSeed(): BoardCard[] {
  return [
    { id: "b-1",  patientId: "p-1", patientName: "Maria Santos",     exam: "Raio-X de tórax",            doctor: DOCTORS[0], priority: "alta",  status: "Pendente",     createdAt: daysAgo(0), notes: "Tosse persistente." },
    { id: "b-2",  patientId: "p-3", patientName: "Ana Costa",        exam: "Ressonância magnética",      doctor: DOCTORS[1], priority: "alta",  status: "Pendente",     createdAt: daysAgo(1) },
    { id: "b-3",  patientId: "p-7", patientName: "Carla Mendes",     exam: "Ultrassom abdominal",        doctor: DOCTORS[2], priority: "média", status: "Pendente",     createdAt: daysAgo(2) },
    { id: "b-4",  patientId: "p-2", patientName: "João Oliveira",    exam: "Tomografia computadorizada", doctor: DOCTORS[0], priority: "alta",  status: "Em Andamento", createdAt: daysAgo(1) },
    { id: "b-5",  patientId: "p-4", patientName: "Pedro Alves",      exam: "Ecocardiograma",             doctor: DOCTORS[3], priority: "média", status: "Em Andamento", createdAt: daysAgo(2) },
    { id: "b-6",  patientId: "p-8", patientName: "Lucas Pereira",    exam: "EEG de rotina",              doctor: DOCTORS[1], priority: "baixa", status: "Revisado",     createdAt: daysAgo(3) },
    { id: "b-7",  patientId: "p-5", patientName: "Beatriz Ferreira", exam: "Mamografia bilateral",       doctor: DOCTORS[2], priority: "média", status: "Revisado",     createdAt: daysAgo(4) },
    { id: "b-8",  patientId: "p-6", patientName: "Rafael Souza",     exam: "Check-up cardiológico",      doctor: DOCTORS[3], priority: "baixa", status: "Concluído",    createdAt: daysAgo(5) },
    { id: "b-9",  patientId: "p-9", patientName: "Juliana Almeida",  exam: "Ultrassom obstétrico",       doctor: DOCTORS[1], priority: "alta",  status: "Concluído",    createdAt: daysAgo(6) },
  ];
}

function readMock(): BoardCard[] {
  try {
    const ver = parseInt(window.localStorage.getItem(SEED_KEY) ?? "0", 10);
    if (ver < SEED_VERSION) {
      const seeded = buildSeed();
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(seeded));
      window.localStorage.setItem(SEED_KEY, String(SEED_VERSION));
      return seeded;
    }
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return buildSeed();
    return JSON.parse(raw) as BoardCard[];
  } catch {
    return buildSeed();
  }
}

function writeMock(list: BoardCard[]) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  } catch {
    /* ignore */
  }
}

const boardApiMock = {
  list: (): BoardCard[] => readMock().sort((a, b) => b.createdAt - a.createdAt),
  setStatus: (id: string, status: BoardStatus): BoardCard[] => {
    const list = readMock().map((c) => (c.id === id ? { ...c, status } : c));
    writeMock(list);
    return list;
  },
  add: (
    card: Omit<BoardCard, "id" | "createdAt" | "status"> & { status?: BoardStatus },
  ): BoardCard[] => {
    const created: BoardCard = {
      ...card,
      id: `b-${Date.now().toString(36)}`,
      createdAt: Date.now(),
      status: card.status ?? "Pendente",
    };
    const list = [created, ...readMock()];
    writeMock(list);
    return list;
  },
  remove: (id: string): BoardCard[] => {
    const list = readMock().filter((c) => c.id !== id);
    writeMock(list);
    return list;
  },
};

// =====================================================================
// REAL — derivado de pacientes + laudos
// =====================================================================

type BackendPaciente = { id: number; nome: string };
type BackendLaudo = {
  id: number;
  paciente_id: number;
  tipo_laudo_id: number | null;
  status: string;
  criado_em: string;
};
type BackendTipo = { id: number; nome: string };

let _tipos: BackendTipo[] = [];
let _cache: BoardCard[] = [];
let _loaded = false;

function statusFromBackend(s: string): BoardStatus {
  const m: Record<string, BoardStatus> = {
    pendente: "Pendente",
    "em-andamento": "Em Andamento",
    concluido: "Concluído",
    revisado: "Revisado",
  };
  return m[s] ?? "Pendente";
}

function statusToBackend(s: BoardStatus): string {
  const m: Record<BoardStatus, string> = {
    Pendente: "pendente",
    "Em Andamento": "em-andamento",
    Concluído: "concluido",
    Revisado: "revisado",
  };
  return m[s];
}

function tipoNome(id: number | null) {
  return _tipos.find((t) => t.id === id)?.nome ?? "Exame";
}

async function loadAll(): Promise<BoardCard[]> {
  const [{ data: pacientes }, { data: tipos }] = await Promise.all([
    apiClient.get<BackendPaciente[]>("/pacientes"),
    apiClient.get<BackendTipo[]>("/laudos/tipos"),
  ]);
  _tipos = tipos;

  const all: BoardCard[] = [];
  for (const p of pacientes) {
    try {
      const { data } = await apiClient.get<BackendLaudo[]>(
        `/laudos/paciente/${p.id}/todos`,
      );
      for (const l of data) {
        all.push({
          id: String(l.id),
          patientId: String(l.paciente_id),
          patientName: p.nome,
          exam: tipoNome(l.tipo_laudo_id),
          doctor: "—",
          priority: "média",
          status: statusFromBackend(l.status),
          createdAt: l.criado_em ? new Date(l.criado_em).getTime() : Date.now(),
        });
      }
    } catch (e) {
      console.error(`Falha ao listar laudos do paciente ${p.id}`, e);
    }
  }

  _cache = all.sort((a, b) => b.createdAt - a.createdAt);
  _loaded = true;
  return _cache;
}

const boardApiReal = {
  list: (): BoardCard[] => {
    if (!_loaded) {
      loadAll().catch((e) => console.error("Falha ao montar board", e));
    }
    return _cache;
  },
  listAsync: async (): Promise<BoardCard[]> => loadAll(),

  setStatus: (id: string, status: BoardStatus): BoardCard[] => {
    apiClient
      .put(`/laudos/paciente/${id}`, { status: statusToBackend(status) })
      .catch((e) => console.error("Falha ao atualizar status do laudo", e));
    _cache = _cache.map((c) => (c.id === id ? { ...c, status } : c));
    return _cache;
  },

  add: (
    card: Omit<BoardCard, "id" | "createdAt" | "status"> & { status?: BoardStatus },
  ): BoardCard[] => {
    apiClient
      .post("/laudos/paciente", {
        paciente_id: Number(card.patientId),
        tipo_laudo_id: null,
        conteudo: card.notes ?? "",
      })
      .catch((e) => console.error("Falha ao criar laudo no board", e));
    const created: BoardCard = {
      ...card,
      id: `local-${Date.now().toString(36)}`,
      createdAt: Date.now(),
      status: card.status ?? "Pendente",
    };
    _cache = [created, ..._cache];
    return _cache;
  },

  remove: (id: string): BoardCard[] => {
    apiClient
      .delete(`/laudos/paciente/${id}`)
      .catch((e) => console.error("Falha ao remover laudo", e));
    _cache = _cache.filter((c) => c.id !== id);
    return _cache;
  },
};

export const boardApi = env.useMock ? boardApiMock : boardApiReal;
