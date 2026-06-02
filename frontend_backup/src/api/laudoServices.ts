import { apiClient, transcricaoClient } from "./httpClient";

export type TipoLaudo = {
  id: number;
  nome: string;
};

export type LaudoDTO = {
  id: number;
  paciente_id: number;
  tipo_laudo_id: number | null;
  conteudo: string;
  status: "pendente" | "em-andamento" | "concluido" | "revisado";
  criado_em: string;
  atualizado_em: string;
};

export type LaudoCreate = {
  paciente_id: number;
  tipo_laudo_id?: number | null;
  conteudo: string;
};

export type ExameDTO = {
  id: number;
  laudo_id: number;
  tipo: string;
  url: string;
  data_upload?: string;
};

export type AudioDTO = {
  id: number;
  laudo_id: number;
  url: string;
  duracao: number;
  data_upload: string;
};

export const laudoServices = {
  async listarTipos(): Promise<TipoLaudo[]> {
    const { data } = await apiClient.get<TipoLaudo[]>("/laudos/tipos");
    return data;
  },

  async listarPorPaciente(pacienteId: number): Promise<LaudoDTO[]> {
    const { data } = await apiClient.get<LaudoDTO[]>(
      `/laudos/paciente/${pacienteId}/todos`
    );
    return data;
  },

  async buscar(id: number): Promise<LaudoDTO> {
    const { data } = await apiClient.get<LaudoDTO>(`/laudos/${id}`);
    return data;
  },

  async criar(payload: LaudoCreate): Promise<LaudoDTO> {
    const { data } = await apiClient.post<LaudoDTO>("/laudos/paciente", payload);
    return data;
  },

  async atualizar(id: number, payload: Partial<LaudoCreate>): Promise<LaudoDTO> {
    const { data } = await apiClient.put<LaudoDTO>(
      `/laudos/paciente/${id}`,
      payload
    );
    return data;
  },

  async listarExames(laudoId: number): Promise<ExameDTO[]> {
    const { data } = await apiClient.get<ExameDTO[]>(
      `/exames/laudos/${laudoId}/exames`
    );
    return data;
  },

  async deletarExame(exameId: number): Promise<void> {
    await apiClient.delete(`/exames/${exameId}`);
  },

  async listarAudios(laudoId: number): Promise<AudioDTO[]> {
    const { data } = await apiClient.get<AudioDTO[]>(`/audios/laudos/${laudoId}`);
    return data;
  },

  async deletarAudio(audioId: number): Promise<void> {
    await apiClient.delete(`/audios/${audioId}`);
  },

  async transcreverEGerarLaudo(audioBlob: Blob): Promise<{ laudo: any }> {
    const fd = new FormData();
    fd.append("file", audioBlob, "gravacao.webm");
    const { data } = await transcricaoClient.post<{ laudo: any }>(
      "/transcrever-e-gerar-laudo",
      fd,
      { headers: { "Content-Type": "multipart/form-data" }, timeout: 120_000 }
    );
    return data;
  },
};
