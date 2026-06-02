import enum
from sqlalchemy import (
    Column,
    Integer,
    LargeBinary,
    String,
    Text,
    ForeignKey,
    DateTime,
    Date,
    Enum as SAEnum
)
from sqlalchemy.sql import func
from sqlalchemy.types import Boolean
from sqlalchemy.orm import relationship
from datetime import datetime, date as date_type
from .database import Base


class Paciente(Base):
    __tablename__ = "paciente"

    id = Column(Integer, primary_key=True, index=True)
    nome = Column(String(255), nullable=False)
    rg = Column(String(20), unique=True, nullable=False)
    cpf = Column(String(14), unique=True, nullable=True)
    data_nascimento = Column(Date)

    laudos_paciente = relationship(
        "LaudoPaciente",
        back_populates="paciente",
        cascade="all, delete-orphan"
    )

    def calcular_idade(self) -> int:
        """Calcula a idade em anos baseado na data de nascimento"""
        if not self.data_nascimento:
            return 0
        hoje = date_type.today()
        idade = hoje.year - self.data_nascimento.year
        if (hoje.month, hoje.day) < (self.data_nascimento.month, self.data_nascimento.day):
            idade -= 1
        return idade


class TipoConteudoLaudo(enum.Enum):
    TEXTO = "texto"
    PDF = "pdf"


class LaudoBase(Base):
    __tablename__ = "laudo_base"

    id = Column(Integer, primary_key=True, index=True)

    tipo_laudo_id = Column(Integer, ForeignKey("tipo_laudo.id"), nullable=False)

    titulo = Column(String(100), nullable=False)

    # TEXTO DO MODELO (quando tipo_conteudo = TEXTO)
    conteudo = Column(Text, nullable=True)

    tipo_conteudo = Column(
        SAEnum(
            TipoConteudoLaudo,
            name="tipoconteudolaudo",  # MUITO IMPORTANTE
            native_enum=True
        ),
        nullable=False
    )

    # caminho do PDF (quando tipo_conteudo = PDF)
    arquivo_pdf = Column(String, nullable=True)

    ativo = Column(Boolean, default=True)
    criado_em = Column(DateTime, server_default=func.now())

    tipo = relationship("TipoLaudo", back_populates="laudos_base")

class TipoLaudo(Base):
    __tablename__ = "tipo_laudo"

    id = Column(Integer, primary_key=True, index=True)
    nome = Column(String, unique=True, nullable=False)
    descricao = Column(Text, nullable=True)

    laudos_paciente = relationship(
        "LaudoPaciente",
        back_populates="tipo_laudo"
    )

    laudos_base = relationship(
        "LaudoBase",
        back_populates="tipo",
        cascade="all, delete-orphan"
    )


class LaudoPaciente(Base):
    __tablename__ = "laudo_paciente"

    id = Column(Integer, primary_key=True, index=True)
    paciente_id = Column(Integer, ForeignKey("paciente.id"), nullable=False)
    tipo_laudo_id = Column(Integer, ForeignKey("tipo_laudo.id"), nullable=False)
    status = Column(String(50), nullable=False)
    conteudo = Column(Text, nullable=False)

    criado_em = Column(DateTime, server_default=func.now())

    paciente = relationship("Paciente", back_populates="laudos_paciente")
    tipo_laudo = relationship("TipoLaudo", back_populates="laudos_paciente")

    audios = relationship(
        "Audio",
        back_populates="laudo",
        cascade="all, delete-orphan"
    )

    exames = relationship(
        "Exame",
        back_populates="laudo",
        cascade="all, delete-orphan"
    )


class Audio(Base):
    __tablename__ = "audio"

    id = Column(Integer, primary_key=True, index=True)
    laudo_id = Column(
        Integer,
        ForeignKey("laudo_paciente.id", ondelete="CASCADE"),
        nullable=False
    )

    caminho_arquivo = Column(String, nullable=False)
    duracao = Column(Integer, nullable=False)
    data_upload = Column(DateTime, server_default=func.now())

    laudo = relationship("LaudoPaciente", back_populates="audios")


class Exame(Base):
    __tablename__ = "exames"

    id = Column(Integer, primary_key=True, index=True)

    laudo_id = Column(
        Integer,
        ForeignKey("laudo_paciente.id", ondelete="CASCADE"),
        nullable=False
    )

    tipo_arquivo = Column(String, nullable=False)
    caminho_arquivo = Column(String, nullable=False)
    data_upload = Column(DateTime, default=datetime.utcnow)

    # relacionamento
    laudo = relationship("LaudoPaciente", back_populates="exames")


class LaudoChunks(Base):
    __tablename__ = "laudo_chunks"

    id = Column(Integer, primary_key=True, index=True)
    
    laudo_id = Column(
        Integer,
        ForeignKey("laudo_paciente.id", ondelete="CASCADE"),
        nullable=False
    )

    conteudo_chunk = Column(Text, nullable=False)
    chunk_index = Column(Integer, nullable=False)
    embedding = Column(Text, nullable=False)  # JSON array

    criado_em = Column(DateTime, server_default=func.now())

    # relacionamento
    laudo = relationship("LaudoPaciente")


class Medico(Base):
    __tablename__ = "medico"

    id = Column(Integer, primary_key=True, index=True)
    nome = Column(String(255), nullable=False)
    email = Column(String(255), unique=True, nullable=False, index=True)
    senha_hash = Column(String(255), nullable=False)
    criado_em = Column(DateTime, server_default=func.now())
    atualizado_em = Column(DateTime, server_default=func.now(), onupdate=func.now())


class Secretaria(Base):
    __tablename__ = "secretaria"

    id = Column(Integer, primary_key=True, index=True)
    nome = Column(String(255), nullable=False)
    email = Column(String(255), unique=True, nullable=False, index=True)
    senha_hash = Column(String(255), nullable=False)
    criado_em = Column(DateTime, server_default=func.now())
    atualizado_em = Column(DateTime, server_default=func.now(), onupdate=func.now())