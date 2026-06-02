import { ocrClient } from "./httpClient";

export type OcrResult = {
  status: "sucesso" | "erro";
  dados: {
    nome: string | null;
    cpf: string | null;
    rg: string | null;
    data_nascimento: string | null;
  };
};

export const ocrServices = {
  async lerRG(file: File): Promise<OcrResult> {
    const fd = new FormData();
    fd.append("image", file);
    const { data } = await ocrClient.post<OcrResult>("/api/ocr", fd, {
      headers: { "Content-Type": "multipart/form-data" },
      timeout: 60_000,
    });
    return data;
  },
};
