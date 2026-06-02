/**
 * Calcula a idade em anos baseado na data de nascimento
 * @param dataNascimento - Data de nascimento em formato string (ISO 8601 ou qualquer formato que Date() aceite)
 * @returns A idade em anos
 */
export const calcularIdade = (dataNascimento: string | Date): number => {
  const nasc = new Date(dataNascimento);
  const hoje = new Date();
  
  let idade = hoje.getFullYear() - nasc.getFullYear();
  const mês = hoje.getMonth() - nasc.getMonth();
  
  if (mês < 0 || (mês === 0 && hoje.getDate() < nasc.getDate())) {
    idade--;
  }
  
  return idade;
};

/**
 * Formata uma data para o padrão brasileiro DD/MM/YYYY
 * @param data - Data a ser formatada
 * @returns Data formatada em DD/MM/YYYY
 */
export const formatarDataBR = (data: string | Date): string => {
  const d = new Date(data);
  const dia = String(d.getDate()).padStart(2, '0');
  const mês = String(d.getMonth() + 1).padStart(2, '0');
  const ano = d.getFullYear();
  return `${dia}/${mês}/${ano}`;
};
