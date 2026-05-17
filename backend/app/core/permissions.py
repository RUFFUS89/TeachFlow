"""Permissões aplicadas no nível de aplicação.

IMPORTANTE: o backend conecta no Postgres como o usuário `postgres`,
que BYPASSA RLS por padrão. Isso significa:

  - A primeira linha de defesa contra acesso indevido SÃO essas funções
    Python, não a RLS.
  - A RLS no banco protege apenas clientes que falam direto com o
    Supabase (supabase-js, supabase-py com anon key).

Toda rota que lida com dados de usuários DEVE chamar uma destas funções
antes de retornar/modificar coisas.
"""

from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import ForbiddenError
from app.models.identity import BranchMember, BranchRole, MemberStatus


async def current_user_branches(db: AsyncSession, user_id: UUID) -> list[UUID]:
    """IDs das filiais onde o usuário é membro ativo."""
    result = await db.execute(
        select(BranchMember.branch_id).where(
            BranchMember.profile_id == user_id,
            BranchMember.status == MemberStatus.ACTIVE,
        )
    )
    return list(result.scalars().all())


async def has_branch_role(
    db: AsyncSession,
    user_id: UUID,
    branch_id: UUID,
    roles: list[BranchRole],
) -> bool:
    result = await db.execute(
        select(BranchMember.id).where(
            BranchMember.profile_id == user_id,
            BranchMember.branch_id == branch_id,
            BranchMember.status == MemberStatus.ACTIVE,
            BranchMember.role.in_(roles),
        )
    )
    return result.scalar_one_or_none() is not None


async def is_branch_staff(db: AsyncSession, user_id: UUID, branch_id: UUID) -> bool:
    """Owner ou admin podem editar conteúdo da filial."""
    return await has_branch_role(db, user_id, branch_id, [BranchRole.OWNER, BranchRole.ADMIN])


async def is_branch_member(db: AsyncSession, user_id: UUID, branch_id: UUID) -> bool:
    """Qualquer papel ativo na filial."""
    return await has_branch_role(
        db, user_id, branch_id, [BranchRole.OWNER, BranchRole.ADMIN, BranchRole.USUARIO]
    )


# Helpers que LANÇAM 403 quando não autorizado --------------------------------


async def require_branch_role(
    db: AsyncSession,
    user_id: UUID,
    branch_id: UUID,
    roles: list[BranchRole],
) -> None:
    if not await has_branch_role(db, user_id, branch_id, roles):
        nomes = ", ".join(r.value for r in roles)
        raise ForbiddenError(f"Esta ação requer um dos papéis: {nomes}")


async def require_branch_staff(db: AsyncSession, user_id: UUID, branch_id: UUID) -> None:
    await require_branch_role(db, user_id, branch_id, [BranchRole.OWNER, BranchRole.ADMIN])


async def require_branch_owner(db: AsyncSession, user_id: UUID, branch_id: UUID) -> None:
    await require_branch_role(db, user_id, branch_id, [BranchRole.OWNER])


async def require_branch_member(db: AsyncSession, user_id: UUID, branch_id: UUID) -> None:
    await require_branch_role(
        db, user_id, branch_id, [BranchRole.OWNER, BranchRole.ADMIN, BranchRole.USUARIO]
    )
