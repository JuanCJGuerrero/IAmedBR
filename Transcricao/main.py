"""
Microserviço de transcrição de áudio (Whisper).

Recebe um arquivo de áudio (multipart/form-data, campo `file`),
transcreve com Whisper e opcionalmente encaminha o texto ao
microserviço de IA (`IA_URL/gerar-laudo`).
"""

import logging
import os
import shutil
import tempfile
from typing import List

import httpx
import uvicorn
from faster_whisper import WhisperModel
from dotenv import load_dotenv
from fastapi import BackgroundTasks, FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

load_dotenv()

logger = logging.getLogger("transcricao")
logging.basicConfig(level=logging.INFO)


def _origins_from_env() -> List[str]:
    raw = os.getenv("CORS_ORIGINS", "http://localhost:3000")
    return [o.strip() for o in raw.split(",") if o.strip()]


PASTA_PROJETO = os.path.dirname(os.path.abspath(__file__))
WHISPER_MODEL_NAME = os.getenv("WHISPER_MODEL", "small")
WHISPER_LANG = os.getenv("WHISPER_LANGUAGE", "pt") or None
IA_URL = os.getenv("IA_URL", "http://localhost:8200").rstrip("/")
HOST = os.getenv("HOST", "0.0.0.0")
PORT = int(os.getenv("PORT", "8300"))
MAX_UPLOAD_BYTES = 20 * 1024 * 1024  # 20 MB
ALLOWED_AUDIO_TYPES = {
    "audio/webm",
    "audio/wav",
    "audio/x-wav",
    "audio/mpeg",
    "audio/mp3",
    "audio/ogg",
    "audio/mp4",
    "audio/m4a",
}

# ffmpeg empacotado junto ao serviço (Windows). No Linux/Docker usamos o do sistema.
caminho_ffmpeg = os.path.join(PASTA_PROJETO, "ffmpeg.exe")
if os.path.exists(caminho_ffmpeg):
    os.environ["PATH"] += os.pathsep + PASTA_PROJETO
    logger.info("FFmpeg local detectado: %s", caminho_ffmpeg)

app = FastAPI(title="Transcrição de Laudo", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=_origins_from_env(),
    allow_credentials=False,
    allow_methods=["POST", "GET", "OPTIONS"],
    allow_headers=["*"],
)

logger.info("Carregando modelo faster-whisper '%s'...", WHISPER_MODEL_NAME)
logger.info("IA_URL configurado: %s", IA_URL)
# device="cpu" + compute_type="int8" = ótimo desempenho sem GPU
model = WhisperModel(WHISPER_MODEL_NAME, device="cpu", compute_type="int8")
logger.info("Modelo faster-whisper pronto.")


def _validar_upload(file: UploadFile) -> None:
    if file.content_type and not (
        file.content_type in ALLOWED_AUDIO_TYPES
        or file.content_type.startswith("audio/")
        or file.content_type.startswith("video/")
    ):
        raise HTTPException(
            status_code=415,
            detail=f"Tipo de mídia não suportado: {file.content_type}",
        )


def _salvar_temp(file: UploadFile) -> str:
    tmp = tempfile.NamedTemporaryFile(delete=False, suffix=os.path.splitext(file.filename or "")[1] or ".webm")
    try:
        # Limita o tamanho lido para evitar DoS por upload gigante.
        total = 0
        while True:
            chunk = file.file.read(1024 * 1024)
            if not chunk:
                break
            total += len(chunk)
            if total > MAX_UPLOAD_BYTES:
                tmp.close()
                os.unlink(tmp.name)
                raise HTTPException(status_code=413, detail="Arquivo muito grande")
            tmp.write(chunk)
        tmp.flush()
    finally:
        tmp.close()
    try:
        tamanho = os.path.getsize(tmp.name)
    except OSError:
        tamanho = 0
    logger.info(
        "Audio recebido e salvo: nome=%s tipo=%s tamanho=%d bytes",
        file.filename or "(sem nome)",
        file.content_type or "(desconhecido)",
        tamanho,
    )
    return tmp.name


@app.get("/health")
def health():
    return {"status": "ok", "model": WHISPER_MODEL_NAME}


@app.post("/transcrever")
async def transcrever(
    background_tasks: BackgroundTasks, file: UploadFile = File(...)
):
    """Transcreve um áudio e retorna apenas o texto."""
    _validar_upload(file)
    temp_path = _salvar_temp(file)
    background_tasks.add_task(
        lambda: os.path.exists(temp_path) and os.remove(temp_path)
    )

    try:
        segments, _ = model.transcribe(temp_path, language=WHISPER_LANG, beam_size=5)
        texto = " ".join(seg.text for seg in segments).strip()
    except Exception:
        logger.exception("Falha ao transcrever áudio")
        raise HTTPException(status_code=500, detail="Erro ao transcrever áudio")

    if not texto:
        raise HTTPException(status_code=422, detail="Transcrição vazia")
    return {"texto_transcrito": texto}


@app.post("/transcrever-e-gerar-laudo")
async def transcrever_e_gerar_laudo(
    background_tasks: BackgroundTasks, file: UploadFile = File(...)
):
    """Transcreve um áudio e encadeia ao serviço de IA para gerar o laudo."""
    _validar_upload(file)
    temp_path = _salvar_temp(file)
    background_tasks.add_task(
        lambda: os.path.exists(temp_path) and os.remove(temp_path)
    )

    try:
        segments, _ = model.transcribe(temp_path, language=WHISPER_LANG, beam_size=5)
        texto = " ".join(seg.text for seg in segments).strip()
    except Exception:
        logger.exception("Falha ao transcrever áudio")
        raise HTTPException(status_code=500, detail="Erro ao transcrever áudio")

    if not texto:
        raise HTTPException(status_code=422, detail="Transcrição vazia")

    try:
        async with httpx.AsyncClient(timeout=120) as client:
            response = await client.post(
                f"{IA_URL}/gerar-laudo", json={"sintomas": texto}
            )
        response.raise_for_status()
        return {"laudo": response.json(), "texto_transcrito": texto}
    except httpx.HTTPError as exc:
        logger.error("Falha ao chamar IA: %s", exc)
        return JSONResponse(
            status_code=502,
            content={"detail": "IA indisponível", "texto_transcrito": texto},
        )


if __name__ == "__main__":
    uvicorn.run(app, host=HOST, port=PORT)
