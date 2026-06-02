"""Dependências comuns: usuário autenticado e checagem de papéis."""

from typing import Iterable

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Usuario
from app.security import decode_token

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login", auto_error=False)


def get_current_user(
    token: str | None = Depends(oauth2_scheme),
    db: Session = Depends(get_db),
) -> Usuario:
    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Não autenticado",
            headers={"WWW-Authenticate": "Bearer"},
        )
    try:
        payload = decode_token(token)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token inválido",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if payload.get("typ") != "access":
        raise HTTPException(status_code=401, detail="Token de acesso esperado")

    user_id = payload.get("sub")
    user = db.query(Usuario).filter(Usuario.id == int(user_id)).first()
    if not user or not user.ativo:
        raise HTTPException(status_code=401, detail="Usuário inválido")
    return user


def require_roles(*roles: str):
    """Factory de dependência: exige um dos papéis listados."""
    allowed: Iterable[str] = roles

    def _checker(user: Usuario = Depends(get_current_user)) -> Usuario:
        if user.papel not in allowed:
            raise HTTPException(status_code=403, detail="Acesso negado")
        return user

    return _checker
