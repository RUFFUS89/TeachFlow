"""FastAPI dependencies pra autenticação."""

from typing import Annotated
from uuid import UUID

from fastapi import Depends
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.jwt import TokenError, decode_supabase_jwt, extract_user_id
from app.database import get_db
from app.models.identity import Profile

bearer_scheme = HTTPBearer(auto_error=True)


async def get_current_user_id(
    credentials: Annotated[HTTPAuthorizationCredentials, Depends(bearer_scheme)],
) -> UUID:
    """Apenas valida o token e retorna o UUID. Não vai ao banco."""
    payload = decode_supabase_jwt(credentials.credentials)
    return extract_user_id(payload)


async def get_current_profile(
    user_id: Annotated[UUID, Depends(get_current_user_id)],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> Profile:
    """Carrega o perfil completo. Falha 401 se o usuário não tem profile ainda
    (não deveria acontecer — o trigger handle_new_user cria automaticamente)."""
    result = await db.execute(select(Profile).where(Profile.id == user_id))
    profile = result.scalar_one_or_none()
    if profile is None:
        raise TokenError("Profile não encontrado pra este usuário")
    return profile


# Aliases legíveis pra usar nas rotas
CurrentUserId = Annotated[UUID, Depends(get_current_user_id)]
CurrentProfile = Annotated[Profile, Depends(get_current_profile)]
DbSession = Annotated[AsyncSession, Depends(get_db)]
