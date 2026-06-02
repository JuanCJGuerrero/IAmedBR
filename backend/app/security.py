"""
Hashing de senha (bcrypt) e emissao/validacao de JWT.

Tokens contem:
  sub : id do usuario (string)
  eml : e-mail
  rol : papel (admin/medico/secretaria)
  typ : "access" ou "refresh"
"""

from datetime import datetime, timedelta, timezone
from typing import Any, Literal

import bcrypt
from jose import JWTError, jwt

from app.config import get_settings

settings = get_settings()

TokenType = Literal["access", "refresh"]

# bcrypt aceita no maximo 72 bytes; truncamos explicitamente para evitar
# que o usuario receba erro silencioso e tambem para nao depender do
# comportamento legado do passlib.
_MAX_BCRYPT_BYTES = 72


def _normalize(plain: str) -> bytes:
    data = plain.encode("utf-8")
    return data[:_MAX_BCRYPT_BYTES]


def hash_password(plain: str) -> str:
    hashed = bcrypt.hashpw(_normalize(plain), bcrypt.gensalt())
    return hashed.decode("utf-8")


def verify_password(plain: str, hashed: str) -> bool:
    try:
        return bcrypt.checkpw(_normalize(plain), hashed.encode("utf-8"))
    except (ValueError, TypeError):
        return False


def _expires_for(token_type: TokenType) -> timedelta:
    if token_type == "refresh":
        return timedelta(days=settings.jwt_refresh_token_expire_days)
    return timedelta(minutes=settings.jwt_access_token_expire_minutes)


def create_token(
    *,
    subject,
    email: str,
    role: str,
    token_type: TokenType = "access",
) -> str:
    now = datetime.now(timezone.utc)
    payload: dict[str, Any] = {
        "sub": str(subject),
        "eml": email,
        "rol": role,
        "typ": token_type,
        "iat": int(now.timestamp()),
        "exp": int((now + _expires_for(token_type)).timestamp()),
    }
    return jwt.encode(payload, settings.jwt_secret, algorithm=settings.jwt_algorithm)


def decode_token(token: str) -> dict:
    try:
        return jwt.decode(token, settings.jwt_secret, algorithms=[settings.jwt_algorithm])
    except JWTError as exc:
        raise ValueError("Token invalido") from exc
