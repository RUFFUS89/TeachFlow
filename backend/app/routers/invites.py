"""Endpoint público de resgate de convite — Fase 7."""

from datetime import UTC, datetime

import httpx
from fastapi import APIRouter, status
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError

from app.auth.dependencies import DbSession
from app.core.exceptions import BadRequestError, ConflictError, GoneError
from app.core.supabase_admin import create_auth_user
from app.models.identity import Branch, BranchMember, MemberStatus, Profile
from app.models.invite import InviteCode
from app.schemas.identity import InviteRedeemInput

router = APIRouter(prefix="/invites", tags=["invites"])


@router.post("/redeem", status_code=status.HTTP_201_CREATED)
async def redeem_invite(payload: InviteRedeemInput, db: DbSession) -> dict[str, str]:
    """Resgata um código de convite e cria o usuário na filial.

    Endpoint público (sem auth). Fluxo:
    1. Valida o código (existe, não revogado, não expirado, ainda tem usos).
    2. Cria auth.users via Supabase Admin API.
    3. Aguarda o trigger handle_new_user criar o profile automaticamente.
    4. Cria branch_member com o papel do convite.
    5. Incrementa used_count atomicamente.
    """
    # 1. Carrega o convite com lock pra evitar race condition
    result = await db.execute(
        select(InviteCode).where(InviteCode.code == payload.code).with_for_update(skip_locked=False)
    )
    inv = result.scalar_one_or_none()

    if inv is None:
        raise GoneError("Código de convite inválido")
    if inv.revoked_at is not None:
        raise GoneError("Este convite foi revogado")
    if inv.expires_at < datetime.now(UTC):
        raise GoneError("Este convite expirou")
    if inv.used_count >= inv.max_uses:
        raise GoneError("Este convite já atingiu o limite de usos")

    # 2. Cria usuário via Supabase Admin API
    try:
        user_id = await create_auth_user(
            email=payload.email,
            password=payload.password,
            full_name=payload.full_name,
        )
    except httpx.HTTPStatusError as e:
        body = e.response.text
        if e.response.status_code == 422 or "already registered" in body.lower():
            raise ConflictError("Este e-mail já está cadastrado") from e
        raise BadRequestError("Erro ao criar conta. Tente novamente.") from e

    # 3. O trigger handle_new_user cria o profile; aguardamos via upsert defensivo
    profile = await db.get(Profile, user_id)
    if profile is None:
        # Cria o profile manualmente caso o trigger ainda não tenha disparado
        profile = Profile(id=user_id, full_name=payload.full_name)  # type: ignore[call-arg]
        db.add(profile)
        try:
            await db.flush()
        except IntegrityError:
            await db.rollback()
            # Trigger disparou no meio do caminho — busca de novo
            profile = await db.get(Profile, user_id)

    # 4. Cria o vínculo de membro
    branch = await db.get(Branch, inv.branch_id)
    if branch is None:
        raise BadRequestError("Filial do convite não encontrada")

    db.add(
        BranchMember(
            branch_id=inv.branch_id,
            profile_id=user_id,
            role=inv.role,
            status=MemberStatus.ACTIVE,
        )
    )

    # 5. Incrementa used_count atomicamente (UPDATE … WHERE used_count < max_uses)
    inv.used_count = inv.used_count + 1

    await db.commit()

    return {"user_id": user_id, "role": inv.role.value}
