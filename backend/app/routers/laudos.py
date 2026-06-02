"""Endpoints de laudos e tipos de laudo."""

from io import BytesIO

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, status
from pypdf import PdfReader
from sqlalchemy.orm import Session

from app.database import get_db
from app.deps import get_current_user
from app.models import Laudo, LaudoBase, Paciente, TipoLaudo, Usuario
from app.schemas import (
    LaudoBaseOut,
    LaudoCreate,
    LaudoOut,
    LaudoUpdate,
    PdfExtractOut,
    TipoLaudoOut,
)

router = APIRouter(
    prefix="/laudos",
    tags=["laudos"],
    dependencies=[Depends(get_current_user)],
)


@router.get("/tipos", response_model=list[TipoLaudoOut])
def listar_tipos(db: Session = Depends(get_db)):
    return db.query(TipoLaudo).order_by(TipoLaudo.nome).all()


@router.get("/base", response_model=list[LaudoBaseOut])
def listar_modelos(db: Session = Depends(get_db)):
    return (
        db.query(LaudoBase)
        .filter(LaudoBase.ativo.is_(True))
        .order_by(LaudoBase.titulo)
        .all()
    )


@router.post("/base/extract-pdf", response_model=PdfExtractOut)
async def extrair_pdf(file: UploadFile = File(...)):
    if file.content_type != "application/pdf":
        raise HTTPException(status_code=400, detail="Envie um PDF valido")

    data = await file.read()
    if not data:
        raise HTTPException(status_code=400, detail="Arquivo vazio")

    try:
        reader = PdfReader(BytesIO(data))
        parts: list[str] = []
        for page in reader.pages:
            text = page.extract_text() or ""
            if text.strip():
                parts.append(text.strip())
        content = "\n\n".join(parts).strip()
    except Exception as exc:  # pragma: no cover - safe fallback
        raise HTTPException(status_code=422, detail="Nao foi possivel ler o PDF") from exc

    if not content:
        raise HTTPException(status_code=422, detail="PDF sem texto extraivel")

    return PdfExtractOut(text=content)


@router.get("/{laudo_id}", response_model=LaudoOut)
def buscar(laudo_id: int, db: Session = Depends(get_db)):
    laudo = db.get(Laudo, laudo_id)
    if not laudo:
        raise HTTPException(status_code=404, detail="Laudo não encontrado")
    return laudo


@router.get("/paciente/{paciente_id}/todos", response_model=list[LaudoOut])
def listar_por_paciente(paciente_id: int, db: Session = Depends(get_db)):
    paciente = db.get(Paciente, paciente_id)
    if not paciente:
        raise HTTPException(status_code=404, detail="Paciente não encontrado")
    return (
        db.query(Laudo)
        .filter(Laudo.paciente_id == paciente_id)
        .order_by(Laudo.criado_em.desc())
        .all()
    )


@router.post("/paciente", response_model=LaudoOut, status_code=status.HTTP_201_CREATED)
def criar(
    payload: LaudoCreate,
    db: Session = Depends(get_db),
    user: Usuario = Depends(get_current_user),
):
    paciente = db.get(Paciente, payload.paciente_id)
    if not paciente:
        raise HTTPException(status_code=404, detail="Paciente não encontrado")

    laudo = Laudo(
        paciente_id=payload.paciente_id,
        tipo_laudo_id=payload.tipo_laudo_id,
        conteudo=payload.conteudo,
        autor_id=user.id,
    )
    db.add(laudo)
    db.commit()
    db.refresh(laudo)
    return laudo


@router.put("/paciente/{laudo_id}", response_model=LaudoOut)
def atualizar(laudo_id: int, payload: LaudoUpdate, db: Session = Depends(get_db)):
    laudo = db.get(Laudo, laudo_id)
    if not laudo:
        raise HTTPException(status_code=404, detail="Laudo não encontrado")
    for k, v in payload.model_dump(exclude_unset=True).items():
        setattr(laudo, k, v)
    db.commit()
    db.refresh(laudo)
    return laudo


@router.delete("/paciente/{laudo_id}", status_code=204)
def deletar(laudo_id: int, db: Session = Depends(get_db)):
    laudo = db.get(Laudo, laudo_id)
    if not laudo:
        raise HTTPException(status_code=404, detail="Laudo não encontrado")
    db.delete(laudo)
    db.commit()
    return None
