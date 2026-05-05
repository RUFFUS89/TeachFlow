"""Verifica JWTs emitidos pelo Supabase Auth.

Supabase agora emite tokens assinados com ES256 (chaves ECC). A validação
busca a chave pública via JWKS (endpoint /.well-known/jwks.json do projeto)
e cacheia em memória. Se o Supabase rotacionar a chave, o cache é invalidado
automaticamente quando um KID desconhecido aparece.
"""

from typing import Any
from uuid import UUID

import httpx
import jwt
from fastapi import HTTPException, status
from jwt import PyJWKClient

from app.config import get_settings


class TokenError(HTTPException):
    def __init__(self, detail: str = "Token inválido ou expirado"):
        super().__init__(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=detail,
            headers={"WWW-Authenticate": "Bearer"},
        )


# Cache do client JWKS (lazy init pra não quebrar testes que não usam auth)
_jwks_client: PyJWKClient | None = None


def _get_jwks_client() -> PyJWKClient:
    global _jwks_client
    if _jwks_client is None:
        settings = get_settings()
        jwks_url = f"{settings.SUPABASE_URL}/auth/v1/.well-known/jwks.json"
        _jwks_client = PyJWKClient(jwks_url, cache_keys=True, lifespan=3600)
    return _jwks_client


def decode_supabase_jwt(token: str) -> dict[str, Any]:
    """Decodifica e valida o JWT. Levanta TokenError se inválido."""
    try:
        signing_key = _get_jwks_client().get_signing_key_from_jwt(token)
        return jwt.decode(
            token,
            signing_key.key,
            algorithms=["ES256", "RS256", "HS256"],  # cobre rotação
            audience="authenticated",
        )
    except jwt.ExpiredSignatureError as e:
        raise TokenError("Token expirado") from e
    except jwt.InvalidTokenError as e:
        raise TokenError(f"Token inválido: {e}") from e
    except (httpx.HTTPError, jwt.PyJWKClientError) as e:
        raise TokenError(f"Erro ao buscar chave pública: {e}") from e


def extract_user_id(payload: dict[str, Any]) -> UUID:
    sub = payload.get("sub")
    if not sub:
        raise TokenError("Token sem sub")
    try:
        return UUID(sub)
    except (ValueError, TypeError) as e:
        raise TokenError("sub não é um UUID válido") from e
