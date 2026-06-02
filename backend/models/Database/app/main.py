from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from app.database import Base, engine

from app.models import Paciente, TipoLaudo, LaudoBase, LaudoPaciente, Audio, LaudoChunks, Medico, Secretaria

from app.routes.pacientes import router as pacientes_router
from app.routes.laudos import router as laudos_router
from app.routes.audios import router as audios_router
from app.routes.exames import router as exames_router
from fastapi.middleware.cors import CORSMiddleware




app = FastAPI()


# 🚨 CORS — isso é OBRIGATÓRIO no browser
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # Vite
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(pacientes_router)
app.include_router(laudos_router)
app.include_router(audios_router)
app.include_router(exames_router)
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")



Base.metadata.create_all(bind=engine)

