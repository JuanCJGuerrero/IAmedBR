"""Endpoints de áudios anexados a laudos."""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.deps import get_current_user
from app.models import Audio, Laudo
from app.schemas import AudioOut

router = APIRouter(
    prefix="/audios",
    tags=["audios"],
    dependencies=[Depends(get_current_user)],
)


@router.get("/laudos/{laudo_id}", response_model=list[AudioOut])
def listar_por_laudo(laudo_id: int, db: Session = Depends(get_db)):
    if not db.get(Laudo, laudo_id):
        raise HTTPException(status_code=404, detail="Laudo não encontrado")
    return (
        db.query(Audio)
        .filter(Audio.laudo_id == laudo_id)
        .order_by(Audio.data_upload.desc())
        .all()
    )


@router.delete("/{audio_id}", status_code=204)
def deletar(audio_id: int, db: Session = Depends(get_db)):
    audio = db.get(Audio, audio_id)
    if not audio:
        raise HTTPException(status_code=404, detail="Áudio não encontrado")
    db.delete(audio)
    db.commit()
    return None
