"""Endpoints de pacientes."""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.deps import get_current_user
from app.models import Paciente
from app.schemas import PacienteCreate, PacienteOut, PacienteUpdate

router = APIRouter(
    prefix="/pacientes",
    tags=["pacientes"],
    dependencies=[Depends(get_current_user)],
)


@router.get("", response_model=list[PacienteOut])
def listar(db: Session = Depends(get_db)):
    return db.query(Paciente).order_by(Paciente.nome).all()


@router.post("", response_model=PacienteOut, status_code=status.HTTP_201_CREATED)
def criar(payload: PacienteCreate, db: Session = Depends(get_db)):
    if payload.cpf:
        existing = db.query(Paciente).filter(Paciente.cpf == payload.cpf).first()
        if existing:
            raise HTTPException(status_code=409, detail="CPF já cadastrado")
    paciente = Paciente(**payload.model_dump())
    db.add(paciente)
    db.commit()
    db.refresh(paciente)
    return paciente


@router.get("/{paciente_id}", response_model=PacienteOut)
def buscar(paciente_id: int, db: Session = Depends(get_db)):
    paciente = db.get(Paciente, paciente_id)
    if not paciente:
        raise HTTPException(status_code=404, detail="Paciente não encontrado")
    return paciente


@router.put("/{paciente_id}", response_model=PacienteOut)
def atualizar(
    paciente_id: int,
    payload: PacienteUpdate,
    db: Session = Depends(get_db),
):
    paciente = db.get(Paciente, paciente_id)
    if not paciente:
        raise HTTPException(status_code=404, detail="Paciente não encontrado")

    for k, v in payload.model_dump(exclude_unset=True).items():
        setattr(paciente, k, v)
    db.commit()
    db.refresh(paciente)
    return paciente


@router.delete("/{paciente_id}", status_code=204)
def deletar(paciente_id: int, db: Session = Depends(get_db)):
    paciente = db.get(Paciente, paciente_id)
    if not paciente:
        raise HTTPException(status_code=404, detail="Paciente não encontrado")
    db.delete(paciente)
    db.commit()
    return None
