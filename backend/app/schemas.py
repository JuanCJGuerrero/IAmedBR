"""Pydantic schemas (request/response)."""

from datetime import date, datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, EmailStr, Field

# ----- Auth -----


class LoginRequest(BaseModel):
    # Aceita qualquer string nao-vazia. A validacao "existe esse email no
    # banco" e feita pelo router; nao queremos rejeitar com 422 antes disso
    # (e tambem permitimos formatos como admin@local em ambiente de teste).
    email: str = Field(min_length=3, max_length=180)
    password: str = Field(min_length=6, max_length=128)


class UsuarioOut(BaseModel):
    id: int
    nome: str
    email: str
    papel: str
    model_config = ConfigDict(from_attributes=True)


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: Literal["bearer"] = "bearer"
    user: UsuarioOut


class UsuarioCreate(BaseModel):
    nome: str = Field(min_length=2, max_length=120)
    # Cadastro de usuario real exige email valido com TLD.
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)
    papel: Literal["admin", "medico", "secretaria"] = "medico"


# ----- Paciente -----


class PacienteBase(BaseModel):
    nome: str = Field(min_length=2, max_length=180)
    cpf: str | None = Field(default=None, max_length=14)
    rg: str | None = Field(default=None, max_length=20)
    data_nascimento: date | None = None
    prontuario: str | None = Field(default=None, max_length=40)
    rg_photo: str | None = None


class PacienteCreate(PacienteBase):
    pass


class PacienteUpdate(BaseModel):
    nome: str | None = None
    cpf: str | None = None
    rg: str | None = None
    data_nascimento: date | None = None
    prontuario: str | None = None
    rg_photo: str | None = None


class PacienteOut(PacienteBase):
    id: int
    criado_em: datetime
    atualizado_em: datetime
    model_config = ConfigDict(from_attributes=True)


# ----- Tipo de laudo -----


class TipoLaudoOut(BaseModel):
    id: int
    nome: str
    model_config = ConfigDict(from_attributes=True)


# ----- Laudo -----


class LaudoCreate(BaseModel):
    paciente_id: int
    tipo_laudo_id: int | None = None
    conteudo: str = ""


class LaudoUpdate(BaseModel):
    tipo_laudo_id: int | None = None
    conteudo: str | None = None
    status: Literal["pendente", "em-andamento", "concluido", "revisado"] | None = None


class LaudoOut(BaseModel):
    id: int
    paciente_id: int
    tipo_laudo_id: int | None
    conteudo: str
    status: str
    criado_em: datetime
    atualizado_em: datetime
    model_config = ConfigDict(from_attributes=True)


# ----- Exame / Audio -----


class ExameOut(BaseModel):
    id: int
    laudo_id: int
    tipo: str
    url: str
    data_upload: datetime
    model_config = ConfigDict(from_attributes=True)


class AudioOut(BaseModel):
    id: int
    laudo_id: int
    url: str
    duracao: int
    data_upload: datetime
    model_config = ConfigDict(from_attributes=True)


# ----- Templates de laudo -----


class LaudoBaseOut(BaseModel):
    id: int
    titulo: str
    tipo_laudo_id: int | None
    tipo_conteudo: str
    conteudo: str
    arquivo_pdf: str | None
    ativo: bool
    criado_em: datetime
    model_config = ConfigDict(from_attributes=True)


class PdfExtractOut(BaseModel):
    text: str
