"""
OCR Microservice — Documentos Brasileiros
Substitui OCR/index.js (Node + Tesseract.js)
Porta: 8000  |  Health: GET /health
"""

import io
import logging
import os
from typing import List, Optional

import cv2
import fitz  # PyMuPDF
import numpy as np
from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from paddleocr import PaddleOCR
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

# ---------------------------------------------------------------------------
# PaddleOCR — inicializa uma vez na subida do serviço
# ---------------------------------------------------------------------------
logger.info("Carregando modelo PaddleOCR...")
_ocr = PaddleOCR(
    use_angle_cls=True,   # corrige texto rotacionado
    lang="pt",            # português (fallback para latim + inglês internamente)
    use_gpu=False,        # altere para True se tiver GPU disponível
    show_log=False,
)
logger.info("PaddleOCR pronto.")

# ---------------------------------------------------------------------------
# App
# ---------------------------------------------------------------------------
app = FastAPI(
    title="OCR Service — Documentos BR",
    version="2.0.0",
    description="Extrai campos de RG, CNH e documentos alternativos brasileiros.",
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
# Helpers de pré-processamento
# ---------------------------------------------------------------------------
def _preprocess_image(raw: bytes) -> np.ndarray:
    """Decodifica, redimensiona e deskewa a imagem para melhorar o OCR."""
    arr = np.frombuffer(raw, np.uint8)
    img = cv2.imdecode(arr, cv2.IMREAD_COLOR)
    if img is None:
        raise ValueError("Imagem inválida ou formato não suportado.")

    # Garante resolução mínima de 1200 px no maior lado
    h, w = img.shape[:2]
    if max(h, w) < 1200:
        scale = 1200 / max(h, w)
        img = cv2.resize(img, None, fx=scale, fy=scale, interpolation=cv2.INTER_CUBIC)

    # Deskew leve (corrige inclinações < 15°)
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    _, thresh = cv2.threshold(gray, 0, 255, cv2.THRESH_BINARY_INV + cv2.THRESH_OTSU)
    coords = np.column_stack(np.where(thresh > 0))
    if len(coords) > 200:
        angle = cv2.minAreaRect(coords)[-1]
        if angle < -45:
            angle = -(90 + angle)
        else:
            angle = -angle
        if 0.5 < abs(angle) < 15:
            (h2, w2) = img.shape[:2]
            M = cv2.getRotationMatrix2D((w2 // 2, h2 // 2), angle, 1.0)
            img = cv2.warpAffine(
                img, M, (w2, h2),
                flags=cv2.INTER_CUBIC,
                borderMode=cv2.BORDER_REPLICATE,
            )

    return img


def _pdf_to_images(raw: bytes) -> List[np.ndarray]:
    """Converte cada página do PDF em ndarray BGR."""
    doc = fitz.open(stream=raw, filetype="pdf")
    images: List[np.ndarray] = []
    for page in doc:
        # 2× zoom → ~150 dpi base → ~300 dpi efetivo
        mat = fitz.Matrix(2.0, 2.0)
        pix = page.get_pixmap(matrix=mat, colorspace=fitz.csRGB)
        arr = np.frombuffer(pix.samples, dtype=np.uint8).reshape(pix.h, pix.w, 3)
        images.append(cv2.cvtColor(arr, cv2.COLOR_RGB2BGR))
    doc.close()
    return images


def _run_ocr(img: np.ndarray) -> str:
    """Roda PaddleOCR em uma imagem e retorna texto puro."""
    result = _ocr.ocr(img, cls=True)
    if not result or not result[0]:
        return ""
    lines = [
        item[1][0]
        for item in result[0]
        if item[1][1] >= 0.5          # confiança mínima 50 %
    ]
    return "\n".join(lines)


def _process_upload(file: UploadFile) -> OCRResponse:
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
            images = _pdf_to_images(content)
        else:
            images = [_preprocess_image(content)]

        if not images:
            return OCRResponse(success=False, error="Nenhuma imagem encontrada no arquivo.")

        full_text = "\n".join(_run_ocr(img) for img in images).strip()

        if not full_text:
            return OCRResponse(
                success=False,
                error="Não foi possível extrair texto. "
                      "Verifique se a imagem está nítida e bem iluminada.",
            )

        data = parse_document(full_text)
        return OCRResponse(success=True, data=DocumentData(**data.__dict__))
    except Exception as exc:
        logger.exception("Erro ao processar documento")
        return OCRResponse(success=False, error=str(exc))


# ---------------------------------------------------------------------------
# Rotas
# ---------------------------------------------------------------------------
@app.get("/health")
def health():
    return {"status": "ok", "service": "ocr-br", "version": "2.0.0"}


@app.post("/ocr/document", response_model=OCRResponse)
async def ocr_document(file: UploadFile = File(...)):
    """
    Recebe uma foto (JPEG/PNG/WEBP/TIFF) ou PDF de um documento de identidade
    brasileiro e retorna os campos extraídos de forma estruturada.

    Retorna 200 em todos os casos; verifique `success` no corpo.
    """
    return _process_upload(file)


@app.post("/api/ocr", response_model=LegacyOcrResponse)
def legacy_ocr(image: UploadFile = File(...)):
    """Compatibilidade com o frontend atual (campo multipart: image)."""
    result = _process_upload(image)
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
