"""Endpoints de autenticação."""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.deps import get_current_user, require_roles
from app.models import Usuario
from app.schemas import LoginRequest, TokenResponse, UsuarioCreate, UsuarioOut
from app.security import create_token, hash_password, verify_password

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/login", response_model=TokenResponse)
def login(payload: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(Usuario).filter(Usuario.email == payload.email).first()
    if not user or not user.ativo or not verify_password(payload.password, user.senha_hash):
        # Resposta genérica para evitar enumeração de e-mails.
        raise HTTPException(status_code=401, detail="Credenciais inválidas")

    access = create_token(
        subject=user.id, email=user.email, role=user.papel, token_type="access"
    )
    refresh = create_token(
        subject=user.id, email=user.email, role=user.papel, token_type="refresh"
    )
    return TokenResponse(
        access_token=access,
        refresh_token=refresh,
        user=UsuarioOut.model_validate(user),
    )


@router.get("/me", response_model=UsuarioOut)
def me(current: Usuario = Depends(get_current_user)):
    return current


@router.post(
    "/register",
    response_model=UsuarioOut,
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(require_roles("admin"))],
)
def register(
    payload: UsuarioCreate,
    db: Session = Depends(get_db),
):
    """Apenas admin cria novos usuários (não há auto-cadastro público)."""
    existing = db.query(Usuario).filter(Usuario.email == payload.email).first()
    if existing:
        raise HTTPException(status_code=409, detail="E-mail já cadastrado")

    user = Usuario(
        nome=payload.nome,
        email=payload.email,
        papel=payload.papel,
        senha_hash=hash_password(payload.password),
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@router.post("/logout", status_code=204)
def logout(_: Usuario = Depends(get_current_user)):
    """
    Logout no servidor é no-op (JWT é stateless).
    O cliente deve simplesmente descartar o token.
    Para revogação real, implemente uma blacklist em Redis.
    """
    return None
