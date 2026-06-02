"""SQLAlchemy ORM models."""

from datetime import datetime, date

from sqlalchemy import (
    Boolean,
    Date,
    DateTime,
    ForeignKey,
    Integer,
    String,
    Text,
    UniqueConstraint,
    func,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class Usuario(Base):
    __tablename__ = "usuarios"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    nome: Mapped[str] = mapped_column(String(120), nullable=False)
    email: Mapped[str] = mapped_column(String(180), unique=True, nullable=False, index=True)
    senha_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    papel: Mapped[str] = mapped_column(String(30), default="medico", nullable=False)
    ativo: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    criado_em: Mapped[datetime] = mapped_column(DateTime, server_default=func.now(), nullable=False)


class TipoLaudo(Base):
    __tablename__ = "tipos_laudo"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    nome: Mapped[str] = mapped_column(String(120), unique=True, nullable=False)


class Paciente(Base):
    __tablename__ = "pacientes"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    nome: Mapped[str] = mapped_column(String(180), nullable=False, index=True)
    cpf: Mapped[str | None] = mapped_column(String(14), unique=True, nullable=True, index=True)
    rg: Mapped[str | None] = mapped_column(String(20), nullable=True)
    data_nascimento: Mapped[date | None] = mapped_column(Date, nullable=True)
    prontuario: Mapped[str | None] = mapped_column(String(40), unique=True, nullable=True, index=True)
    rg_photo: Mapped[str | None] = mapped_column(Text, nullable=True)  # path/URL, NÃO base64 cru no banco
    criado_em: Mapped[datetime] = mapped_column(DateTime, server_default=func.now(), nullable=False)
    atualizado_em: Mapped[datetime] = mapped_column(
        DateTime, server_default=func.now(), onupdate=func.now(), nullable=False
    )

    laudos: Mapped[list["Laudo"]] = relationship(back_populates="paciente", cascade="all, delete-orphan")


class Laudo(Base):
    __tablename__ = "laudos"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    paciente_id: Mapped[int] = mapped_column(ForeignKey("pacientes.id", ondelete="CASCADE"), index=True)
    tipo_laudo_id: Mapped[int | None] = mapped_column(ForeignKey("tipos_laudo.id"), nullable=True)
    autor_id: Mapped[int | None] = mapped_column(ForeignKey("usuarios.id"), nullable=True)
    conteudo: Mapped[str] = mapped_column(Text, default="", nullable=False)
    status: Mapped[str] = mapped_column(String(30), default="pendente", nullable=False)
    criado_em: Mapped[datetime] = mapped_column(DateTime, server_default=func.now(), nullable=False)
    atualizado_em: Mapped[datetime] = mapped_column(
        DateTime, server_default=func.now(), onupdate=func.now(), nullable=False
    )

    paciente: Mapped[Paciente] = relationship(back_populates="laudos")
    tipo: Mapped[TipoLaudo | None] = relationship()
    exames: Mapped[list["Exame"]] = relationship(back_populates="laudo", cascade="all, delete-orphan")
    audios: Mapped[list["Audio"]] = relationship(back_populates="laudo", cascade="all, delete-orphan")


class Exame(Base):
    __tablename__ = "exames"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    laudo_id: Mapped[int] = mapped_column(ForeignKey("laudos.id", ondelete="CASCADE"), index=True)
    tipo: Mapped[str] = mapped_column(String(80), nullable=False)
    url: Mapped[str] = mapped_column(Text, nullable=False)
    data_upload: Mapped[datetime] = mapped_column(DateTime, server_default=func.now(), nullable=False)

    laudo: Mapped[Laudo] = relationship(back_populates="exames")


class Audio(Base):
    __tablename__ = "audios"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    laudo_id: Mapped[int] = mapped_column(ForeignKey("laudos.id", ondelete="CASCADE"), index=True)
    url: Mapped[str] = mapped_column(Text, nullable=False)
    duracao: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    data_upload: Mapped[datetime] = mapped_column(DateTime, server_default=func.now(), nullable=False)

    laudo: Mapped[Laudo] = relationship(back_populates="audios")


class LaudoBase(Base):
    """Modelos de laudo (templates) cadastrados para reuso."""

    __tablename__ = "laudos_base"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    titulo: Mapped[str] = mapped_column(String(160), nullable=False)
    tipo_laudo_id: Mapped[int | None] = mapped_column(ForeignKey("tipos_laudo.id"), nullable=True)
    tipo_conteudo: Mapped[str] = mapped_column(String(20), default="texto", nullable=False)  # texto|pdf
    conteudo: Mapped[str] = mapped_column(Text, default="", nullable=False)
    arquivo_pdf: Mapped[str | None] = mapped_column(Text, nullable=True)
    ativo: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    criado_em: Mapped[datetime] = mapped_column(DateTime, server_default=func.now(), nullable=False)

    __table_args__ = (UniqueConstraint("titulo", "tipo_laudo_id", name="uix_laudobase_titulo_tipo"),)
