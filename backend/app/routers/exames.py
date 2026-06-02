"""Endpoints de exames."""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.deps import get_current_user
from app.models import Exame, Laudo
from app.schemas import ExameOut

router = APIRouter(
    prefix="/exames",
    tags=["exames"],
    dependencies=[Depends(get_current_user)],
)


@router.get("/laudos/{laudo_id}/exames", response_model=list[ExameOut])
def listar_por_laudo(laudo_id: int, db: Session = Depends(get_db)):
    if not db.get(Laudo, laudo_id):
        raise HTTPException(status_code=404, detail="Laudo não encontrado")
    return (
        db.query(Exame)
        .filter(Exame.laudo_id == laudo_id)
        .order_by(Exame.data_upload.desc())
        .all()
    )


@router.delete("/{exame_id}", status_code=204)
def deletar(exame_id: int, db: Session = Depends(get_db)):
    exame = db.get(Exame, exame_id)
    if not exame:
        raise HTTPException(status_code=404, detail="Exame não encontrado")
    db.delete(exame)
    db.commit()
    return None
