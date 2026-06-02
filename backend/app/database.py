"""Sessao e Base do SQLAlchemy."""

from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, sessionmaker

from app.config import get_settings

settings = get_settings()

# SQLite precisa de connect_args especificos quando usado em servidor web
# multi-thread. Postgres nao precisa.
_is_sqlite = settings.database_url.startswith("sqlite")
_connect_args = {"check_same_thread": False} if _is_sqlite else {}

engine = create_engine(
    settings.database_url,
    pool_pre_ping=True,
    future=True,
    connect_args=_connect_args,
)

SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine,
    future=True,
)


class Base(DeclarativeBase):
    """Base declarativa para todos os models."""


def get_db():
    """Dependencia de banco para FastAPI."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
