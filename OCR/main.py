"""
OCR Microservice — Documentos Brasileiros
Porta: 8000  |  Health: GET /health
"""

import asyncio
import base64
import io
import json
import logging
import os
from typing import List, Optional

import fitz  # PyMuPDF
import httpx
from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from PIL import Image
from pydantic import BaseModel

from document_parser import parse_document

# ---------------------------------------------------------------------------
# Logging
# ---------------------------------------------------------------------------
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s  %(levelname)-8s  %(name)s — %(message)s",
)
logger = logging.getLogger("ocr_service")

# ---------------------------------------------------------------------------
# Config
# ---------------------------------------------------------------------------
MAX_UPLOAD_MB: int = int(os.getenv("MAX_UPLOAD_MB", "10"))
MAX_BYTES: int = MAX_UPLOAD_MB * 1024 * 1024
CORS_ORIGINS: List[str] = os.getenv("CORS_ORIGINS", "http://localhost:3000").split(",")

ALLOWED_MIME: set = {
    "image/jpeg",
    "image/png",
    "image/webp",
    "image/tiff",
    "image/bmp",
    "application/pdf",
}

GROQ_ENDPOINT: str = os.getenv("GROQ_ENDPOINT", "https://api.groq.com/openai/v1/chat/completions")
GROQ_MODEL: str = os.getenv("GROQ_MODEL", "meta-llama/llama-4-scout-17b-16e-instruct")
GROQ_TEMPERATURE: float = float(os.getenv("GROQ_TEMPERATURE", "0"))
GROQ_MAX_IMAGE_SIDE: int = int(os.getenv("GROQ_MAX_IMAGE_SIDE", "1600"))

# ---------------------------------------------------------------------------
# App
# ---------------------------------------------------------------------------
app = FastAPI(
    title="OCR Service — Documentos BR",
    version="3.0.0",
    description="Extrai campos de RG, CNH e documentos alternativos brasileiros usando Groq Vision.",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["POST", "GET"],
    allow_headers=["*"],
)


# ---------------------------------------------------------------------------
# Schemas de resposta
# ---------------------------------------------------------------------------
class DocumentData(BaseModel):
    document_type: Optional[str] = None   # RG | CNH | RNE | Passaporte | Desconhecido
    name: Optional[str] = None
    cpf: Optional[str] = None
    rg: Optional[str] = None
    birth_date: Optional[str] = None
    father_name: Optional[str] = None
    mother_name: Optional[str] = None
    nationality: Optional[str] = None
    birth_place: Optional[str] = None
    issue_date: Optional[str] = None
    expiry_date: Optional[str] = None
    issuing_organ: Optional[str] = None
    cnh_category: Optional[str] = None    # só CNH
    cnh_number: Optional[str] = None      # só CNH
    raw_text: str = ""


class OCRResponse(BaseModel):
    success: bool
    data: Optional[DocumentData] = None
    error: Optional[str] = None


class LegacyOcrResponse(BaseModel):
    dados: dict


# ---------------------------------------------------------------------------
# Helpers de imagem e Groq
# ---------------------------------------------------------------------------
def _resize_image(image: Image.Image) -> Image.Image:
    """Reduz imagens muito grandes antes de enviá-las ao modelo visual."""
    image = image.convert("RGB")
    image.thumbnail((GROQ_MAX_IMAGE_SIDE, GROQ_MAX_IMAGE_SIDE))
    return image


def _image_to_jpeg_bytes(image: Image.Image) -> bytes:
    buffer = io.BytesIO()
    image.save(buffer, format="JPEG", quality=90, optimize=True)
    return buffer.getvalue()


def _prepare_image_bytes(raw: bytes) -> bytes:
    with Image.open(io.BytesIO(raw)) as image:
        return _image_to_jpeg_bytes(_resize_image(image))


def _pdf_to_image_bytes(raw: bytes) -> List[bytes]:
    """Converte cada página do PDF em bytes JPEG prontos para o Groq."""
    doc = fitz.open(stream=raw, filetype="pdf")
    images: List[bytes] = []
    for page in doc:
        mat = fitz.Matrix(2.0, 2.0)
        pix = page.get_pixmap(matrix=mat, colorspace=fitz.csRGB)
        pil_image = Image.frombytes("RGB", [pix.width, pix.height], pix.samples)
        images.append(_image_to_jpeg_bytes(_resize_image(pil_image)))
    doc.close()
    return images


def _bytes_to_data_url(image_bytes: bytes, mime_type: str = "image/jpeg") -> str:
    encoded = base64.b64encode(image_bytes).decode("ascii")
    return f"data:{mime_type};base64,{encoded}"


def _extract_content_text(content) -> str:
    if isinstance(content, str):
        return content.strip()
    if isinstance(content, list):
        parts = []
        for item in content:
            if isinstance(item, dict):
                text = item.get("text")
                if text:
                    parts.append(text)
        return "\n".join(parts).strip()
    return str(content).strip()


def _merge_document_payload(base: dict, extra: dict) -> dict:
    merged = dict(base)
    for key, value in extra.items():
        if value in (None, "", [], {}):
            continue
        if key == "raw_text" and merged.get(key):
            merged[key] = f"{merged[key]}\n{value}".strip()
            continue
        if not merged.get(key):
            merged[key] = value
    return merged


async def _extract_document_with_groq(image_bytes: bytes, page_label: str = "") -> dict:
    """Extrai campos estruturados da imagem usando Groq Vision."""
    api_key = os.getenv("GROQ_API_KEY")
    if not api_key:
        raise RuntimeError("GROQ_API_KEY deve estar definida")

    prompt = (
        "Extraia os dados deste documento brasileiro e responda SOMENTE com um JSON válido. "
        "Inclua as chaves: document_type, name, cpf, rg, birth_date, father_name, mother_name, "
        "nationality, birth_place, issue_date, expiry_date, issuing_organ, cnh_category, cnh_number, raw_text. "
        "Preencha cpf com o CPF completo, se houver. "
        "Em raw_text, inclua a transcrição fiel do texto visível. "
        "Se algum campo não existir, use null."
    )
    if page_label:
        prompt = f"{prompt}\nPágina: {page_label}"

    payload = {
        "model": GROQ_MODEL,
        "temperature": GROQ_TEMPERATURE,
        "messages": [
            {
                "role": "system",
                "content": "Você é um OCR especializado em documentos brasileiros e retorna apenas JSON.",
            },
            {
                "role": "user",
                "content": [
                    {"type": "text", "text": prompt},
                    {
                        "type": "image_url",
                        "image_url": {
                            "url": _bytes_to_data_url(image_bytes),
                        },
                    },
                ],
            },
        ],
        "max_completion_tokens": 2048,
        "response_format": {"type": "json_object"},
    }

    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json",
    }

    async with httpx.AsyncClient(timeout=60) as client:
        response = await client.post(GROQ_ENDPOINT, json=payload, headers=headers)
        if response.status_code >= 400:
            logger.error("Groq error %s: %s", response.status_code, response.text)
            response.raise_for_status()

    data = response.json()
    choices = data.get("choices") or []
    if not choices:
        return {}

    message = choices[0].get("message") or {}
    content = _extract_content_text(message.get("content"))
    if not content:
        return {}

    try:
        parsed = json.loads(content)
        return parsed if isinstance(parsed, dict) else {}
    except json.JSONDecodeError:
        logger.error("Groq returned non-JSON content: %s", content)
        return {}


async def _process_upload(file: UploadFile) -> OCRResponse:
    if file.content_type not in ALLOWED_MIME:
        raise HTTPException(
            status_code=415,
            detail=f"Tipo de arquivo não suportado: {file.content_type}. "
                   f"Aceitos: {', '.join(sorted(ALLOWED_MIME))}",
        )

    content = file.file.read()

    if len(content) > MAX_BYTES:
        raise HTTPException(
            status_code=413,
            detail=f"Arquivo excede o limite de {MAX_UPLOAD_MB} MB.",
        )

    try:
        if file.content_type == "application/pdf":
            images = _pdf_to_image_bytes(content)
        else:
            images = [_prepare_image_bytes(content)]

        if not images:
            return OCRResponse(success=False, error="Nenhuma imagem encontrada no arquivo.")

        document_payload: dict = {}
        for index, image_bytes in enumerate(images, start=1):
            page_label = f"{index}/{len(images)}" if len(images) > 1 else ""
            page_payload = await _extract_document_with_groq(image_bytes, page_label=page_label)
            if page_payload:
                document_payload = _merge_document_payload(document_payload, page_payload)

        raw_text = str(document_payload.get("raw_text") or "").strip()
        fallback_data = parse_document(raw_text) if raw_text else None

        if fallback_data:
            document_payload = _merge_document_payload(document_payload, fallback_data.__dict__)

        if not document_payload:
            return OCRResponse(
                success=False,
                error="Não foi possível extrair texto. "
                      "Verifique se a imagem está nítida e bem iluminada.",
            )

        return OCRResponse(success=True, data=DocumentData(**document_payload))
    except Exception as exc:
        logger.exception("Erro ao processar documento")
        return OCRResponse(success=False, error=str(exc))


# ---------------------------------------------------------------------------
# Integração com Groq (API externa)
# ---------------------------------------------------------------------------
async def call_groq(text: str, timeout: int = 30) -> dict:
    """Chamada textual auxiliar para a API Groq."""
    api_key = os.getenv("GROQ_API_KEY")
    if not api_key:
        raise RuntimeError("GROQ_API_KEY deve estar definida")

    payload = {
        "model": os.getenv("GROQ_MODEL", GROQ_MODEL),
        "temperature": 0,
        "messages": [
            {"role": "user", "content": text},
        ],
    }

    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json",
    }

    async with httpx.AsyncClient(timeout=timeout) as client:
        resp = await client.post(GROQ_ENDPOINT, json=payload, headers=headers)
        resp.raise_for_status()
        return resp.json()


def call_groq_sync(text: str, timeout: int = 30) -> dict:
    """Wrapper síncrono para chamadas rápidas a partir da CLI/testes."""
    return asyncio.run(call_groq(text, timeout=timeout))


# ---------------------------------------------------------------------------
# Rotas
# ---------------------------------------------------------------------------
@app.get("/health")
def health():
    return {"status": "ok", "service": "ocr-br", "version": "3.0.0"}


@app.post("/ocr/document", response_model=OCRResponse)
async def ocr_document(file: UploadFile = File(...)):
    """
    Recebe uma foto (JPEG/PNG/WEBP/TIFF) ou PDF de um documento de identidade
    brasileiro e retorna os campos extraídos de forma estruturada.

    Retorna 200 em todos os casos; verifique `success` no corpo.
    """
    return await _process_upload(file)


@app.post("/api/ocr", response_model=LegacyOcrResponse)
async def legacy_ocr(image: UploadFile = File(...)):
    """Compatibilidade com o frontend atual (campo multipart: image)."""
    result = await _process_upload(image)
    if not result.success or not result.data:
        return LegacyOcrResponse(dados={})
    return LegacyOcrResponse(
        dados={
            "nome": result.data.name or "",
            "cpf": result.data.cpf or "",
            "rg": result.data.rg or "",
            "data_nascimento": result.data.birth_date or "",
        }
    )
