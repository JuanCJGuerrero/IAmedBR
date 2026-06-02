import { apiClient } from "./httpClient";

export type PacienteDTO = {
  id: number;
  nome: string;
  cpf?: string | null;
  rg?: string | null;
  data_nascimento?: string | null;
  prontuario?: string | null;
  ultima_visita?: string | null;
  rg_photo?: string | null;
};

export type PacienteCreate = Omit<PacienteDTO, "id">;
export type PacienteUpdate = Partial<PacienteCreate>;

export const pacienteServices = {
  async listar(): Promise<PacienteDTO[]> {
    const { data } = await apiClient.get<PacienteDTO[]>("/pacientes");
    return data;
  },

  async buscar(id: number): Promise<PacienteDTO> {
    const { data } = await apiClient.get<PacienteDTO>(`/pacientes/${id}`);
    return data;
  },

  async criar(payload: PacienteCreate): Promise<PacienteDTO> {
    const { data } = await apiClient.post<PacienteDTO>("/pacientes", payload);
    return data;
  },

  async atualizar(id: number, payload: PacienteUpdate): Promise<PacienteDTO> {
    const { data } = await apiClient.put<PacienteDTO>(`/pacientes/${id}`, payload);
    return data;
  },

  async deletar(id: number): Promise<void> {
    await apiClient.delete(`/pacientes/${id}`);
  },
};
