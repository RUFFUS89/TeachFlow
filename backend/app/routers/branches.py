"""Endpoints de filiais."""

from uuid import UUID

from fastapi import APIRouter, status
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError

from app.auth.dependencies import CurrentProfile, DbSession
from app.core.exceptions import ConflictError, NotFoundError
from app.core.permissions import (
    current_user_branches,
    require_branch_owner,
    require_branch_staff,
)
from app.models.identity import Branch, BranchMember, BranchRole, MemberStatus
from app.schemas.identity import BranchCreate, BranchRead, BranchUpdate

router = APIRouter(prefix="/branches", tags=["branches"])


@router.get("/", response_model=list[BranchRead])
async def list_my_branches(profile: CurrentProfile, db: DbSession) -> list[Branch]:
    """Filiais onde o usuário é membro ativo (qualquer papel)."""
    branch_ids = await current_user_branches(db, profile.id)
    if not branch_ids:
        return []
    result = await db.execute(select(Branch).where(Branch.id.in_(branch_ids)))
    return list(result.scalars().all())


@router.post("/", response_model=BranchRead, status_code=status.HTTP_201_CREATED)
async def create_branch(
    payload: BranchCreate,
    profile: CurrentProfile,
    db: DbSession,
) -> Branch:
    """Cria uma nova filial e torna o solicitante OWNER dela.

    Aberto a qualquer usuário autenticado. Como OWNER pode ter múltiplas
    filiais (rede/franquia), não há limite imposto aqui.

    Branch + BranchMember são criados na mesma transação — se a criação
    do membership falhar, a filial inteira é desfeita pelo rollback.
    """
    branch = Branch(
        name=payload.name,
        slug=payload.slug,
        cnpj=payload.cnpj,
        address_line=payload.address_line,
        city=payload.city,
        state=payload.state,
        postal_code=payload.postal_code,
        logo_url=payload.logo_url,
    )
    db.add(branch)
    try:
        await db.flush()
    except IntegrityError as e:
        await db.rollback()
        # Pode ser slug duplicado ou CNPJ duplicado
        msg = str(e.orig).lower() if e.orig else ""
        if "slug" in msg:
            raise ConflictError(f"Slug '{payload.slug}' já está em uso") from e
        if "cnpj" in msg:
            raise ConflictError(f"CNPJ '{payload.cnpj}' já está cadastrado") from e
        raise ConflictError("Já existe uma filial com esses dados") from e

    db.add(
        BranchMember(
            branch_id=branch.id,
            profile_id=profile.id,
            role=BranchRole.OWNER,
            status=MemberStatus.ACTIVE,
        )
    )
    await db.commit()
    await db.refresh(branch)
    return branch


@router.get("/{branch_id}", response_model=BranchRead)
async def get_branch(
    branch_id: UUID,
    profile: CurrentProfile,
    db: DbSession,
) -> Branch:
    """Qualquer membro ativo pode ver os dados básicos da filial."""
    branch_ids = await current_user_branches(db, profile.id)
    if branch_id not in branch_ids:
        raise NotFoundError("Filial")
    branch = await db.get(Branch, branch_id)
    if branch is None:
        raise NotFoundError("Filial")
    return branch


@router.patch("/{branch_id}", response_model=BranchRead)
async def update_branch(
    branch_id: UUID,
    payload: BranchUpdate,
    profile: CurrentProfile,
    db: DbSession,
) -> Branch:
    """Apenas OWNER pode editar a filial."""
    await require_branch_owner(db, profile.id, branch_id)
    branch = await db.get(Branch, branch_id)
    if branch is None:
        raise NotFoundError("Filial")

    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(branch, field, value)
    try:
        await db.commit()
    except IntegrityError as e:
        await db.rollback()
        raise ConflictError("Conflito ao atualizar (slug ou CNPJ duplicado)") from e
    await db.refresh(branch)
    return branch
