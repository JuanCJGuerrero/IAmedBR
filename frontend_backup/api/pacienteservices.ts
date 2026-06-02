/**
 * @deprecated  Mantido apenas como camada de compatibilidade.
 * Use `frontend/src/api/pacienteServices.ts` em código novo.
 */
import { pacienteServices } from "../src/api/pacienteServices";

export const criarPaciente = (paciente: any) => pacienteServices.criar(paciente);
export const atualizarPaciente = (id: string | number, paciente: any) =>
  pacienteServices.atualizar(Number(id), paciente);
export const deletarPaciente = (id: string | number) =>
  pacienteServices.deletar(Number(id));
