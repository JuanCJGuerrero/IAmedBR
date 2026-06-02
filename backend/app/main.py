"""
Backend principal — Plataforma Médica Integrada.

Inicializa o app FastAPI, registra routers, configura CORS e cria
o usuário admin inicial caso a tabela esteja vazia.
"""

from contextlib import asynccontextmanager
import logging

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import get_settings
from app.database import Base, SessionLocal, engine
from app.models import Usuario, TipoLaudo
from app.routers import audios, auth, exames, laudos, pacientes
from app.security import hash_password

logger = logging.getLogger("backend")
logging.basicConfig(level=logging.INFO)

settings = get_settings()


def _bootstrap_admin() -> None:
    """Cria o usuário admin inicial e tipos de laudo padrão (idempotente)."""
    with SessionLocal() as db:
        if db.query(Usuario).count() == 0:
            admin = Usuario(
                nome="Administrador",
                email=settings.admin_bootstrap_email,
                senha_hash=hash_password(settings.admin_bootstrap_password),
                papel="admin",
                ativo=True,
            )
            db.add(admin)
            logger.warning(
                "Admin inicial criado: %s — TROQUE A SENHA NO PRIMEIRO LOGIN.",
                settings.admin_bootstrap_email,
            )

        if db.query(TipoLaudo).count() == 0:
            for nome in [
                "Raio-X",
                "Tomografia",
                "Ressonância",
                "Ultrassom",
                "Eletrocardiograma",
                "Ecocardiograma",
                "Eletroencefalograma",
                "Check-up",
            ]:
                db.add(TipoLaudo(nome=nome))

        db.commit()


@asynccontextmanager
async def lifespan(_app: FastAPI):
    Base.metadata.create_all(bind=engine)
    _bootstrap_admin()
    logger.info("Aplicação iniciada (env=%s)", settings.app_env)
    yield


app = FastAPI(
    title=settings.app_name,
    version="1.0.0",
    debug=settings.debug,
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type"],
)

app.include_router(auth.router)
app.include_router(pacientes.router)
app.include_router(laudos.router)
app.include_router(exames.router)
app.include_router(audios.router)


@app.get("/health")
def health():
    return {"status": "ok", "env": settings.app_env}
