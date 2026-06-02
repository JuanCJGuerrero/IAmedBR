import os
from typing import List
from pydantic import BaseModel, Field

from langchain_groq import ChatGroq
from langchain_core.prompts import PromptTemplate
from langchain_core.output_parsers import JsonOutputParser


# -------- MODELO DE SAÍDA --------
class LaudoMedico(BaseModel):
    paciente_nome: str = Field(description="Nome completo do paciente")
    diagnostico_hipotese: str = Field(description="Hipótese diagnóstica baseada nos sintomas")
    exames_sugeridos: List[str] = Field(description="Lista de exames complementares")
    recomendacoes: str = Field(description="Orientações médicas detalhadas")
    cid_sugerido: str = Field(description="Código Internacional de Doenças (CID-10)")


# -------- GERADOR --------
class GeradorLaudo:
    def __init__(self):
        api_key = os.getenv("GROQ_API_KEY")
        if not api_key:
            raise RuntimeError("GROQ_API_KEY não encontrada no ambiente")

        # Modelo configurável via env (default: llama-3.1-8b-instant)
        model_name = os.getenv("GROQ_MODEL", "llama-3.1-8b-instant")
        self.llm = ChatGroq(
            model=model_name,
            api_key=api_key,
            temperature=0,
        )

        self.parser = JsonOutputParser(pydantic_object=LaudoMedico)

        self.prompt = PromptTemplate(
            template="""
Você é um assistente médico integrado a um sistema clínico.

Siga rigorosamente o pipeline abaixo antes de gerar qualquer resposta:

ETAPA 1  Identificação de dados
Consulte o banco de dados interno do sistema.
Localize os dados do paciente quando houver identificadores disponíveis.
Não presuma nem invente informações ausentes.

ETAPA 2  Consulta de padrões clínicos
Consulte o banco de dados de laudos médicos existentes.
Utilize laudos semelhantes como referência de estrutura, linguagem e formatação.
Respeite integralmente o padrão institucional adotado.

ETAPA 3  Análise clínica
Analise exclusivamente os sintomas e informações fornecidas pelo médico.
Utilize linguagem médica técnica, clara e responsável.
Não adicione sinais, sintomas ou históricos não informados.

ETAPA 4  Hipóteses diagnósticas
Gere apenas hipóteses diagnósticas clínicas.
Sugira CID compatível quando possível.
Não forneça diagnóstico definitivo.

ETAPA 5  Exames e condutas
Sugira exames complementares compatíveis com as hipóteses.
Indique condutas iniciais seguras e não invasivas.
Não prescreva medicamentos.

ETAPA 6  Validação ética e clínica
Verifique consistência clínica do laudo.
Evite conclusões precipitadas.
Caso faltem dados, registre de forma clara e objetiva.

ETAPA 7  Estruturação final
Organize o laudo conforme o formato padrão do sistema.
Preencha apenas os campos com informações disponíveis.
Campos sem informação devem permanecer vazios ou nulos.

Regras obrigatórias:
Não invente dados do paciente.
Não exponha decisões internas ou o pipeline.
Não utilize linguagem alarmista.
Não substitua a avaliação médica presencial.

INFORMAÇÕES FORNECIDAS PELO MÉDICO:
{sintomas}

{format_instructions}
""",
            input_variables=["sintomas"],
            partial_variables={
                "format_instructions": self.parser.get_format_instructions()
            }
        )

        self.chain = self.prompt | self.llm | self.parser

    def gerar(self, sintomas_paciente: str, tipo_exame: str | None = None):
        payload = {"sintomas": sintomas_paciente}
        if tipo_exame:
            payload["sintomas"] = f"Tipo de exame: {tipo_exame}\n\n{payload['sintomas']}"
        return self.chain.invoke(payload)


# -------- TESTE DIRETO --------
if __name__ == "__main__":
    gerador = GeradorLaudo()

    resultado = gerador.gerar(
        "Paciente com febre alta, dor no corpo, tosse seca e cansaço há 3 dias."
    )

    print("\n===== LAUDO GERADO =====\n")
    print(resultado)
    print("\n=======================\n")
    print("Módulo GeradorLaudo pronto para uso.")