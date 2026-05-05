"""Endpoints do usuário logado."""

from fastapi import APIRouter
from sqlalchemy import select

from app.auth.dependencies import CurrentProfile, DbSession
from app.models.identity import BranchMember
from app.schemas.identity import BranchMembership, MeRead, ProfileRead, ProfileUpdate

router = APIRouter(prefix="/me", tags=["me"])


@router.get("/", response_model=MeRead)
async def get_me(profile: CurrentProfile, db: DbSession) -> MeRead:
    """Retorna o perfil do usuário logado e suas filiais."""
    result = await db.execute(
        select(BranchMember).where(BranchMember.profile_id == profile.id)
    )
    memberships = result.scalars().all()
    return MeRead(
        profile=ProfileRead.model_validate(profile),
        memberships=[BranchMembership.model_validate(m) for m in memberships],
    )


@router.patch("/", response_model=ProfileRead)
async def update_me(
    payload: ProfileUpdate,
    profile: CurrentProfile,
    db: DbSession,
) -> ProfileRead:
    data = payload.model_dump(exclude_unset=True)
    for field, value in data.items():
        setattr(profile, field, value)
    await db.commit()
    await db.refresh(profile)
    return ProfileRead.model_validate(profile)
