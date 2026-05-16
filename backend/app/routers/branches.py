"""Endpoints de filiais, membros e convites."""

import random
from datetime import UTC, datetime, timedelta
from uuid import UUID

from fastapi import APIRouter, Query, status
from sqlalchemy import func, select
from sqlalchemy.exc import IntegrityError

from app.auth.dependencies import CurrentProfile, DbSession
from app.core.exceptions import ConflictError, ForbiddenError, NotFoundError
from app.core.permissions import (
    current_user_branches,
    is_branch_staff,
    require_branch_member,
    require_branch_owner,
)
from app.models.assignment import Assignment
from app.models.course import Course, CourseStatus
from app.models.identity import Branch, BranchMember, BranchRole, MemberStatus, Profile
from app.models.invite import InviteCode
from app.models.submission import Submission, SubmissionStatus
from app.schemas.identity import (
    BranchCreate,
    BranchInsights,
    BranchMemberUpdate,
    BranchMemberWithProfile,
    BranchRead,
    BranchUpdate,
    BranchWithStats,
    InviteCodeCreate,
    InviteCodeRead,
)

router = APIRouter(prefix="/branches", tags=["branches"])

# Alphabet sem caracteres ambíguos (0/O/1/I removidos)
_CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"


def _generate_code() -> str:
    """Gera código no formato TF-XXXX-XXXX."""
    chars = "".join(random.choices(_CODE_ALPHABET, k=8))
    return f"TF-{chars[:4]}-{chars[4:]}"


def _invite_is_active(inv: InviteCode) -> bool:
    return (
        inv.revoked_at is None
        and inv.expires_at > datetime.now(UTC)
        and inv.used_count < inv.max_uses
    )


# ---------------------------------------------------------------------------
# Filiais
# ---------------------------------------------------------------------------


@router.get("/", response_model=list[BranchRead])
async def list_my_branches(profile: CurrentProfile, db: DbSession) -> list[Branch]:
    """Filiais onde o usuário é membro ativo (qualquer papel)."""
    branch_ids = await current_user_branches(db, profile.id)
    if not branch_ids:
        return []
    result = await db.execute(select(Branch).where(Branch.id.in_(branch_ids)))
    return list(result.scalars().all())


@router.get("/with-stats", response_model=list[BranchWithStats])
async def list_my_branches_with_stats(
    profile: CurrentProfile,
    db: DbSession,
) -> list[BranchWithStats]:
    """Filiais com contadores — usado no grid do OWNER."""
    branch_ids = await current_user_branches(db, profile.id)
    if not branch_ids:
        return []

    result = await db.execute(select(Branch).where(Branch.id.in_(branch_ids)))
    branches = list(result.scalars().all())

    out: list[BranchWithStats] = []
    for branch in branches:
        members_q = await db.execute(
            select(func.count()).where(
                BranchMember.branch_id == branch.id,
                BranchMember.status == MemberStatus.ACTIVE,
            )
        )
        members_count = members_q.scalar_one()

        students_q = await db.execute(
            select(func.count()).where(
                BranchMember.branch_id == branch.id,
                BranchMember.role == BranchRole.USUARIO,
                BranchMember.status == MemberStatus.ACTIVE,
            )
        )
        students_count = students_q.scalar_one()

        courses_q = await db.execute(
            select(func.count()).where(
                Course.branch_id == branch.id,
                Course.status == CourseStatus.ACTIVE,
            )
        )
        active_courses_count = courses_q.scalar_one()

        out.append(
            BranchWithStats(
                id=branch.id,
                name=branch.name,
                slug=branch.slug,
                cnpj=branch.cnpj,
                address_line=branch.address_line,
                city=branch.city,
                state=branch.state,
                postal_code=branch.postal_code,
                logo_url=branch.logo_url,
                status=branch.status,
                created_at=branch.created_at,
                updated_at=branch.updated_at,
                members_count=members_count,
                students_count=students_count,
                active_courses_count=active_courses_count,
            )
        )
    return out


@router.post("/", response_model=BranchRead, status_code=status.HTTP_201_CREATED)
async def create_branch(
    payload: BranchCreate,
    profile: CurrentProfile,
    db: DbSession,
) -> Branch:
    """Cria uma nova filial e torna o solicitante OWNER dela."""
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
    await require_branch_member(db, profile.id, branch_id)
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


# ---------------------------------------------------------------------------
# Membros
# ---------------------------------------------------------------------------


@router.get("/{branch_id}/members", response_model=list[BranchMemberWithProfile])
async def list_members(
    branch_id: UUID,
    profile: CurrentProfile,
    db: DbSession,
    role: BranchRole | None = Query(default=None),
    q: str | None = Query(default=None),
) -> list[BranchMemberWithProfile]:
    """Lista membros da filial. Apenas staff (owner/admin)."""
    if not await is_branch_staff(db, profile.id, branch_id):
        raise ForbiddenError("Apenas staff pode listar membros")

    stmt = (
        select(BranchMember, Profile)
        .join(Profile, Profile.id == BranchMember.profile_id)
        .where(BranchMember.branch_id == branch_id)
    )
    if role is not None:
        stmt = stmt.where(BranchMember.role == role)
    if q:
        stmt = stmt.where(Profile.full_name.ilike(f"%{q}%"))
    stmt = stmt.order_by(Profile.full_name)

    rows = await db.execute(stmt)
    result = []
    for member, prof in rows.all():
        result.append(
            BranchMemberWithProfile(
                id=member.id,
                branch_id=member.branch_id,
                profile_id=member.profile_id,
                role=member.role,
                status=member.status,
                created_at=member.created_at,
                full_name=prof.full_name,
                avatar_url=prof.avatar_url,
            )
        )
    return result


@router.patch("/{branch_id}/members/{member_id}", response_model=BranchMemberWithProfile)
async def update_member(
    branch_id: UUID,
    member_id: UUID,
    payload: BranchMemberUpdate,
    profile: CurrentProfile,
    db: DbSession,
) -> BranchMemberWithProfile:
    """Atualiza role ou status de um membro. Apenas OWNER."""
    await require_branch_owner(db, profile.id, branch_id)

    member = await db.get(BranchMember, member_id)
    if member is None or member.branch_id != branch_id:
        raise NotFoundError("Membro")

    if payload.role is not None:
        member.role = payload.role
    if payload.status is not None:
        member.status = payload.status

    await db.commit()
    await db.refresh(member)

    prof = await db.get(Profile, member.profile_id)
    return BranchMemberWithProfile(
        id=member.id,
        branch_id=member.branch_id,
        profile_id=member.profile_id,
        role=member.role,
        status=member.status,
        created_at=member.created_at,
        full_name=prof.full_name if prof else "",
        avatar_url=prof.avatar_url if prof else None,
    )


@router.delete("/{branch_id}/members/{member_id}", status_code=status.HTTP_204_NO_CONTENT)
async def remove_member(
    branch_id: UUID,
    member_id: UUID,
    profile: CurrentProfile,
    db: DbSession,
) -> None:
    """Remove membro da filial. Apenas OWNER. OWNER não pode remover a si mesmo."""
    await require_branch_owner(db, profile.id, branch_id)

    member = await db.get(BranchMember, member_id)
    if member is None or member.branch_id != branch_id:
        raise NotFoundError("Membro")
    if member.profile_id == profile.id:
        raise ForbiddenError("OWNER não pode remover a si mesmo")

    await db.delete(member)
    await db.commit()


# ---------------------------------------------------------------------------
# Insights
# ---------------------------------------------------------------------------


@router.get("/{branch_id}/insights", response_model=BranchInsights)
async def get_insights(
    branch_id: UUID,
    profile: CurrentProfile,
    db: DbSession,
) -> BranchInsights:
    """Métricas da filial. Apenas OWNER."""
    await require_branch_owner(db, profile.id, branch_id)

    total_q = await db.execute(
        select(func.count()).where(
            BranchMember.branch_id == branch_id,
            BranchMember.status == MemberStatus.ACTIVE,
        )
    )
    total_members = total_q.scalar_one()

    students_q = await db.execute(
        select(func.count()).where(
            BranchMember.branch_id == branch_id,
            BranchMember.role == BranchRole.USUARIO,
            BranchMember.status == MemberStatus.ACTIVE,
        )
    )
    active_students = students_q.scalar_one()

    courses_q = await db.execute(
        select(func.count()).where(
            Course.branch_id == branch_id,
            Course.status == CourseStatus.ACTIVE,
        )
    )
    active_courses = courses_q.scalar_one()

    pending_q = await db.execute(
        select(func.count())
        .select_from(Submission)
        .join(Assignment, Assignment.id == Submission.assignment_id)
        .join(Course, Course.id == Assignment.course_id)
        .where(
            Course.branch_id == branch_id,
            Submission.status == SubmissionStatus.SUBMITTED,
        )
    )
    pending_submissions = pending_q.scalar_one()

    return BranchInsights(
        total_members=total_members,
        active_students=active_students,
        active_courses=active_courses,
        completion_rate_percent=0.0,
        pending_submissions=pending_submissions,
    )


# ---------------------------------------------------------------------------
# Convites
# ---------------------------------------------------------------------------


@router.get("/{branch_id}/invites", response_model=list[InviteCodeRead])
async def list_invites(
    branch_id: UUID,
    profile: CurrentProfile,
    db: DbSession,
) -> list[InviteCodeRead]:
    """Lista convites ativos da filial. Apenas OWNER."""
    await require_branch_owner(db, profile.id, branch_id)

    result = await db.execute(
        select(InviteCode)
        .where(InviteCode.branch_id == branch_id)
        .order_by(InviteCode.created_at.desc())
    )
    invites = list(result.scalars().all())
    return [
        InviteCodeRead(
            id=inv.id,
            branch_id=inv.branch_id,
            role=inv.role,
            code=inv.code,
            created_by=inv.created_by,
            expires_at=inv.expires_at,
            max_uses=inv.max_uses,
            used_count=inv.used_count,
            revoked_at=inv.revoked_at,
            created_at=inv.created_at,
            is_active=_invite_is_active(inv),
        )
        for inv in invites
    ]


@router.post(
    "/{branch_id}/invites",
    response_model=InviteCodeRead,
    status_code=status.HTTP_201_CREATED,
)
async def create_invite(
    branch_id: UUID,
    payload: InviteCodeCreate,
    profile: CurrentProfile,
    db: DbSession,
) -> InviteCodeRead:
    """Gera novo código de convite. Apenas OWNER."""
    await require_branch_owner(db, profile.id, branch_id)

    # Tenta até 5 vezes pra evitar colisão de código (altamente improvável)
    for _ in range(5):
        code = _generate_code()
        existing = await db.execute(select(InviteCode).where(InviteCode.code == code))
        if existing.scalar_one_or_none() is None:
            break

    expires_at = datetime.now(UTC) + timedelta(days=payload.days_valid)
    inv = InviteCode(
        branch_id=branch_id,
        role=payload.role,
        code=code,
        created_by=profile.id,
        expires_at=expires_at,
        max_uses=payload.max_uses,
    )
    db.add(inv)
    await db.commit()
    await db.refresh(inv)

    return InviteCodeRead(
        id=inv.id,
        branch_id=inv.branch_id,
        role=inv.role,
        code=inv.code,
        created_by=inv.created_by,
        expires_at=inv.expires_at,
        max_uses=inv.max_uses,
        used_count=inv.used_count,
        revoked_at=inv.revoked_at,
        created_at=inv.created_at,
        is_active=_invite_is_active(inv),
    )


@router.delete("/{branch_id}/invites/{invite_id}", status_code=status.HTTP_204_NO_CONTENT)
async def revoke_invite(
    branch_id: UUID,
    invite_id: UUID,
    profile: CurrentProfile,
    db: DbSession,
) -> None:
    """Revoga um convite. Apenas OWNER."""
    await require_branch_owner(db, profile.id, branch_id)

    inv = await db.get(InviteCode, invite_id)
    if inv is None or inv.branch_id != branch_id:
        raise NotFoundError("Convite")

    inv.revoked_at = datetime.now(UTC)
    await db.commit()
