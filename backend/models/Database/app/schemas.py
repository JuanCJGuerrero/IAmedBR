from pydantic import BaseModel, EmailStr, field_validator
from datetime import date, datetime
from typing import List, Optional


# ---------- PACIENTE ----------

class PacienteBase(BaseModel):
    nome: str
    cpf: str
    rg: str
    data_nascimento: datetime


class PacienteCreate(BaseModel):
    nome: str
    rg: str
    cpf: str
    data_nascimento: datetime
   


class PacienteResponse(PacienteBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True

class PacienteOut(PacienteBase):
    id: int
    idade: int | None = None
    data_criacao: date | None = None  # se existir no model

    class Config:
        from_attributes = True

    @field_validator('idade', mode='before')
    @classmethod
    def calcular_idade_validator(cls, v, values):
        """Calcula a idade baseado em data_nascimento se não estiver na resposta"""
        if v is not None:
            return v
        
        # Se vier do SQLAlchemy, tenta usar o método do model ou calcular manual
        if hasattr(values, 'data'):
            data_nasc = values.data.get('data_nascimento')
        else:
            data_nasc = values.get('data_nascimento')
            
        if data_nasc:
            if isinstance(data_nasc, datetime):
                data_nasc = data_nasc.date()
            elif isinstance(data_nasc, str):
                data_nasc = datetime.fromisoformat(data_nasc).date()
                
            hoje = date.today()
            idade = hoje.year - data_nasc.year
            if (hoje.month, hoje.day) < (data_nasc.month, data_nasc.day):
                idade -= 1
            return idade
        return 0

        
# ---------- LAUDO DO PACIENTE ----------

class LaudoBaseCreate(BaseModel):
    tipo_laudo_id: int
    titulo: Optional[str]
    conteudo: str

class TipoLaudoCreate(BaseModel):
    titulo: str
    tipo_laudo_id: int
    tipo_conteudo: str  # "PDF" ou "TEXTO"
    conteudo_texto: Optional[str] = None

class LaudoPacienteCreate(BaseModel):
    paciente_id: int
    tipo_laudo_id: int
    conteudo: str
    status: str


class LaudoResponse(LaudoPacienteCreate):
    id: int
    paciente_id: int
    data_criacao: datetime
    data_atualizacao: datetime

    class Config:
        from_attributes = True


class LaudoPacienteResponse(BaseModel):
    id: int
    paciente_id: int
    tipo_laudo_id: int
    conteudo: str
    status: str
    criado_em: datetime

    class Config:
        from_attributes = True

# ---------- AUDIO DO MÉDICO ----------



class AudioBase(BaseModel):
    laudo_id: int


class AudioCreate(AudioBase):
    """
    Usado apenas para referência lógica.
    O upload real do arquivo é feito via UploadFile (FormData).
    """
    pass


class AudioResponse(AudioBase):
    id: int
    caminho_arquivo: str
    duracao: int
    criado_em: datetime
    
    class Config:
        from_attributes = True

# ---------- EXAME FOTO ----------


class ExameBase(BaseModel):
    tipo_arquivo: str
    caminho_arquivo: str

class ExameCreate(ExameBase):
    laudo_id: int

class ExameOut(ExameBase):
    id: int
    laudo_id: int
    data_upload: datetime

    class Config:
        from_attributes = True


# ---------- MÉDICO ----------

class MedicoBase(BaseModel):
    nome: str
    email: EmailStr


class MedicoCreate(MedicoBase):
    senha: str


class MedicoResponse(MedicoBase):
    id: int
    criado_em: datetime
    atualizado_em: datetime

    class Config:
        from_attributes = True


# ---------- SECRETÁRIA ----------

class SecretariaBase(BaseModel):
    nome: str
    email: EmailStr


class SecretariaCreate(SecretariaBase):
    senha: str


class SecretariaResponse(SecretariaBase):
    id: int
    criado_em: datetime
    atualizado_em: datetime

    class Config:
        from_attributes = True