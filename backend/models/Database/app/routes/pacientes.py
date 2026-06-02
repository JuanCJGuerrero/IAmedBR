from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session


from app.database import SessionLocal
from app.models import Paciente
from app.schemas import PacienteCreate, PacienteOut

router = APIRouter(
    prefix="/pacientes",
    tags=["Pacientes"]
)

# Dependência do banco
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# 🔹 CREATE
@router.post("", status_code=status.HTTP_201_CREATED)
def criar_paciente(
    paciente: PacienteCreate,
    db: Session = Depends(get_db)
):
    novo = Paciente(**paciente.model_dump())
    db.add(novo)
    db.commit()
    db.refresh(novo)
    return novo

# 🔹 GET ALL – Listar pacientes
@router.get("", response_model=List[PacienteOut])
def listar_pacientes(db: Session = Depends(get_db)):
    pacientes = db.query(Paciente).order_by(Paciente.nome).all()
    resultado = []
    for p in pacientes:
        paciente_dict = {
            'id': p.id,
            'nome': p.nome,
            'cpf': p.cpf,
            'rg': p.rg,
            'data_nascimento': p.data_nascimento,
            'idade': p.calcular_idade()
        }
        resultado.append(paciente_dict)
    return resultado


# 🔹 READ (por id)
@router.get("/{id}")
def buscar_por_id(
    id: int,
    db: Session = Depends(get_db)
):
    paciente = db.query(Paciente).filter(Paciente.id == id).first()

    if not paciente:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Paciente não encontrado"
        )

    return paciente


# 🔹 UPDATE
@router.put("/{id}")
def atualizar_paciente(
    id: int,
    paciente: PacienteCreate,
    db: Session = Depends(get_db)
):
    paciente_db = db.query(Paciente).filter(Paciente.id == id).first()

    if not paciente_db:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Paciente não encontrado"
        )

    for campo, valor in paciente.model_dump().items():
        setattr(paciente_db, campo, valor)

    db.commit()
    db.refresh(paciente_db)
    return paciente_db


# 🔹 DELETE
@router.delete("/{id}", status_code=status.HTTP_204_NO_CONTENT)
def deletar_paciente(
    id: int,
    db: Session = Depends(get_db)
):
    paciente = db.query(Paciente).filter(Paciente.id == id).first()

    if not paciente:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Paciente não encontrado"
        )

    db.delete(paciente)
    db.commit()
