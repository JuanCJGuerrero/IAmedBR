/**
 * Configuracao central do front. Le VITE_* do bundle do Vite.
 * Toda chamada de rede passa por aqui — nunca hardcode URL nos componentes.
 */

function readEnv(key: string, fallback: string): string {
  const v = (import.meta.env as Record<string, string | undefined>)[key];
  return v && v.trim().length > 0 ? v : fallback;
}

function readFlag(key: string, fallback = false): boolean {
  const v = (import.meta.env as Record<string, string | undefined>)[key];
  if (v === undefined) return fallback;
  return v === "true" || v === "1";
}

export const env = {
  apiUrl: readEnv("VITE_API_URL", "http://localhost:8100"),
  ocrUrl: readEnv("VITE_OCR_URL", "http://localhost:8000"),
  iaUrl: readEnv("VITE_IA_URL", "http://localhost:8200"),
  transcricaoUrl: readEnv("VITE_TRANSCRICAO_URL", "http://localhost:8300"),

  /**
   * true  = mocks em localStorage (jeito original do Lovable, funciona offline)
   * false = chama backend FastAPI real
   */
  useMock: readFlag("VITE_USE_MOCK", true),
} as const;

export type AppEnv = typeof env;
