/**
 * Mock adapter — quando ativado (VITE_USE_MOCK=true), intercepta as chamadas
 * dos AxiosInstances e devolve dados em memória, permitindo testar a UI
 * sem subir backend, OCR, IA ou Postgres.
 *
 * Credenciais aceitas em modo mock:
 *   - admin@local / admin123
 *   - qualquer e-mail válido com a senha "demo"
 *
 * Os dados ficam apenas na memória do tab atual.
 */

import type { AxiosInstance, InternalAxiosRequestConfig } from "axios";
import type { SessionUser } from "./authStorage";

// ------------------------------------------------------------------ helpers

type MockResponse = { status?: number; data: unknown };
type Handler = (
  config: InternalAxiosRequestConfig,
  match: RegExpMatchArray
) => MockResponse | Promise<MockResponse>;

type Route = {
  method: string;
  pattern: RegExp;
  handler: Handler;
};

function rid() {
  return Math.floor(Math.random() * 1_000_000) + 1;
}

function ok(data: unknown, status = 200): MockResponse {
  return { status, data };
}

// ------------------------------------------------------------------ state

const adminUser: SessionUser = {
  id: 1,
  nome: "Administrador (modo demo)",
  email: "admin@local",
  papel: "admin",
};

let pacientes: any[] = [
  {
    id: 1,
    nome: "Maria Santos",
    cpf: "123.456.789-00",
    rg: "12.345.678-9",
    data_nascimento: "1985-03-12",
    prontuario: "P-001",
    rg_photo: null,
    criado_em: new Date().toISOString(),
    atualizado_em: new Date().toISOString(),
  },
  {
    id: 2,
    nome: "João Oliveira",
    cpf: "987.654.321-00",
    rg: "98.765.432-1",
    data_nascimento: "1972-07-04",
    prontuario: "P-002",
    rg_photo: null,
    criado_em: new Date().toISOString(),
    atualizado_em: new Date().toISOString(),
  },
];

const tiposLaudo = [
  { id: 1, nome: "Raio-X" },
  { id: 2, nome: "Tomografia" },
  { id: 3, nome: "Ressonância" },
  { id: 4, nome: "Ultrassom" },
];

let laudos: any[] = [
  {
    id: 10,
    paciente_id: 1,
    tipo_laudo_id: 1,
    conteudo: "Radiografia de tórax sem alterações pleuropulmonares.",
    status: "concluido",
    criado_em: new Date().toISOString(),
    atualizado_em: new Date().toISOString(),
  },
];

const laudosBase: any[] = [
  {
    id: 1,
    titulo: "Raio-X de Tórax Normal",
    tipo_laudo_id: 1,
    tipo_conteudo: "texto",
    conteudo:
      "INDICAÇÃO CLÍNICA:\n\nTÉCNICA: Radiografia em PA e perfil.\n\nDESCRIÇÃO:\nPulmões bem expandidos.\n\nCONCLUSÃO:\nSem alterações.",
    arquivo_pdf: null,
    ativo: true,
    criado_em: new Date().toISOString(),
  },
];

let exames: any[] = [];
let audios: any[] = [];

// ------------------------------------------------------------------ rotas

const routes: Route[] = [
  // Auth
  {
    method: "post",
    pattern: /\/auth\/login$/,
    handler(config) {
      const body =
        typeof config.data === "string" ? JSON.parse(config.data) : config.data;
      const email = body?.email ?? "";
      const password = body?.password ?? "";
      const valid =
        (email === "admin@local" && password === "admin123") ||
        (typeof email === "string" && email.includes("@") && password === "demo");
      if (!valid) return ok({ detail: "Credenciais inválidas" }, 401);
      return ok({
        access_token: "mock.access.token",
        refresh_token: "mock.refresh.token",
        token_type: "bearer",
        user: adminUser,
      });
    },
  },
  {
    method: "get",
    pattern: /\/auth\/me$/,
    handler: () => ok(adminUser),
  },
  {
    method: "post",
    pattern: /\/auth\/logout$/,
    handler: () => ok(null, 204),
  },

  // Pacientes
  {
    method: "get",
    pattern: /\/pacientes$/,
    handler: () => ok(pacientes),
  },
  {
    method: "post",
    pattern: /\/pacientes$/,
    handler(config) {
      const body =
        typeof config.data === "string" ? JSON.parse(config.data) : config.data;
      const novo = {
        id: rid(),
        ...body,
        criado_em: new Date().toISOString(),
        atualizado_em: new Date().toISOString(),
      };
      pacientes = [...pacientes, novo];
      return ok(novo, 201);
    },
  },
  {
    method: "get",
    pattern: /\/pacientes\/(\d+)$/,
    handler: (_c, m) => {
      const p = pacientes.find((x) => x.id === Number(m[1]));
      return p ? ok(p) : ok({ detail: "Não encontrado" }, 404);
    },
  },
  {
    method: "put",
    pattern: /\/pacientes\/(\d+)$/,
    handler(config, m) {
      const id = Number(m[1]);
      const body =
        typeof config.data === "string" ? JSON.parse(config.data) : config.data;
      pacientes = pacientes.map((p) =>
        p.id === id ? { ...p, ...body, atualizado_em: new Date().toISOString() } : p
      );
      const updated = pacientes.find((x) => x.id === id);
      return updated ? ok(updated) : ok({ detail: "Não encontrado" }, 404);
    },
  },
  {
    method: "delete",
    pattern: /\/pacientes\/(\d+)$/,
    handler(_c, m) {
      pacientes = pacientes.filter((p) => p.id !== Number(m[1]));
      return ok(null, 204);
    },
  },

  // Tipos / templates
  { method: "get", pattern: /\/laudos\/tipos$/, handler: () => ok(tiposLaudo) },
  { method: "get", pattern: /\/laudos\/base$/, handler: () => ok(laudosBase) },

  // Laudos
  {
    method: "get",
    pattern: /\/laudos\/paciente\/(\d+)\/todos$/,
    handler: (_c, m) =>
      ok(laudos.filter((l) => l.paciente_id === Number(m[1]))),
  },
  {
    method: "post",
    pattern: /\/laudos\/paciente$/,
    handler(config) {
      const body =
        typeof config.data === "string" ? JSON.parse(config.data) : config.data;
      const novo = {
        id: rid(),
        paciente_id: body.paciente_id,
        tipo_laudo_id: body.tipo_laudo_id ?? null,
        conteudo: body.conteudo ?? "",
        status: "pendente",
        criado_em: new Date().toISOString(),
        atualizado_em: new Date().toISOString(),
      };
      laudos = [...laudos, novo];
      return ok(novo, 201);
    },
  },
  {
    method: "put",
    pattern: /\/laudos\/paciente\/(\d+)$/,
    handler(config, m) {
      const id = Number(m[1]);
      const body =
        typeof config.data === "string" ? JSON.parse(config.data) : config.data;
      laudos = laudos.map((l) =>
        l.id === id ? { ...l, ...body, atualizado_em: new Date().toISOString() } : l
      );
      const updated = laudos.find((x) => x.id === id);
      return updated ? ok(updated) : ok({ detail: "Não encontrado" }, 404);
    },
  },
  {
    method: "get",
    pattern: /\/laudos\/(\d+)$/,
    handler: (_c, m) => {
      const l = laudos.find((x) => x.id === Number(m[1]));
      return l ? ok(l) : ok({ detail: "Não encontrado" }, 404);
    },
  },

  // Exames / áudios (apenas leitura/delete em mock)
  {
    method: "get",
    pattern: /\/exames\/laudos\/(\d+)\/exames$/,
    handler: (_c, m) => ok(exames.filter((e) => e.laudo_id === Number(m[1]))),
  },
  {
    method: "delete",
    pattern: /\/exames\/(\d+)$/,
    handler(_c, m) {
      exames = exames.filter((e) => e.id !== Number(m[1]));
      return ok(null, 204);
    },
  },
  {
    method: "get",
    pattern: /\/audios\/laudos\/(\d+)$/,
    handler: (_c, m) => ok(audios.filter((a) => a.laudo_id === Number(m[1]))),
  },
  {
    method: "delete",
    pattern: /\/audios\/(\d+)$/,
    handler(_c, m) {
      audios = audios.filter((a) => a.id !== Number(m[1]));
      return ok(null, 204);
    },
  },

  // OCR
  {
    method: "post",
    pattern: /\/api\/ocr$/,
    handler: () =>
      ok({
        status: "sucesso",
        dados: {
          nome: "JOÃO DA SILVA TESTE",
          cpf: "123.456.789-00",
          rg: "12.345.678-9",
          data_nascimento: "10/02/1990",
        },
      }),
  },
  {
    method: "get",
    pattern: /\/api\/rg\/ultimo$/,
    handler: () => ok({ status: "sucesso", dados: null }),
  },

  // Transcrição / IA
  {
    method: "post",
    pattern: /\/transcrever$/,
    handler: () =>
      ok({
        texto_transcrito:
          "Paciente refere dor torácica há 3 dias, sem febre. Pressão arterial normal.",
      }),
  },
  {
    method: "post",
    pattern: /\/transcrever-e-gerar-laudo$/,
    handler: () =>
      ok({
        texto_transcrito:
          "Paciente refere dor torácica há 3 dias, sem febre. Pressão arterial normal.",
        laudo: {
          paciente_nome: "(modo demo)",
          diagnostico_hipotese: "Dor torácica de etiologia a esclarecer",
          exames_sugeridos: ["ECG", "Raio-X de tórax", "Hemograma"],
          recomendacoes: "Avaliar com cardiologista. Hidratação adequada.",
          cid_sugerido: "R07.4",
        },
      }),
  },
];

// ------------------------------------------------------------------ install

function findRoute(method: string, url: string) {
  for (const r of routes) {
    if (r.method !== method.toLowerCase()) continue;
    const m = url.match(r.pattern);
    if (m) return { route: r, match: m };
  }
  return null;
}

/**
 * Aplica o mock em uma instância axios. Intercepta o REQUEST antes da
 * camada de rede, monta uma resposta fake e curto-circuita a chamada via
 * `config.adapter`.
 */
export function installMockAdapter(client: AxiosInstance) {
  client.interceptors.request.use(async (config) => {
    const url = (config.url ?? "").replace(client.defaults.baseURL ?? "", "");
    const found = findRoute(config.method ?? "get", url);
    if (!found) {
      // Sem rota correspondente — devolve 404 falso para sinalizar.
      config.adapter = async () => ({
        data: { detail: `Mock: rota não mapeada (${config.method} ${url})` },
        status: 404,
        statusText: "Not Found (mock)",
        headers: {},
        config,
      });
      return config;
    }

    const { route, match } = found;
    config.adapter = async () => {
      const result = await route.handler(config, match);
      return {
        data: result.data,
        status: result.status ?? 200,
        statusText: "OK (mock)",
        headers: { "content-type": "application/json" },
        config,
      };
    };
    return config;
  });
}
