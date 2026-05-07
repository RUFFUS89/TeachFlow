"""Endpoints do dashboard do professor."""

from uuid import UUID

from fastapi import APIRouter
from sqlalchemy import text

from app.auth.dependencies import CurrentProfile, DbSession
from app.core.permissions import require_branch_staff
from app.schemas.course import DashboardStats

router = APIRouter(prefix="/dashboard", tags=["dashboard"])


@router.get("/stats", response_model=DashboardStats)
async def get_dashboard_stats(
    branch_id: UUID,
    profile: CurrentProfile,
    db: DbSession,
) -> DashboardStats:
    """Retorna os 4 contadores do dashboard professor."""
    await require_branch_staff(db, profile.id, branch_id)

    active_courses: int = (
        await db.execute(
            text("SELECT COUNT(*) FROM courses WHERE branch_id = :bid AND status = 'active'"),
            {"bid": branch_id},
        )
    ).scalar_one() or 0

    active_students: int = (
        await db.execute(
            text(
                "SELECT COUNT(*) FROM branch_members"
                " WHERE branch_id = :bid AND role = 'usuario' AND status = 'active'"
            ),
            {"bid": branch_id},
        )
    ).scalar_one() or 0

    # Submissions aguardando correção — tabela criada na Fase 5; retorna 0 até lá
    try:
        pending_submissions: int = (
            await db.execute(
                text(
                    "SELECT COUNT(*) FROM submissions s"
                    " JOIN assignments a ON a.id = s.assignment_id"
                    " JOIN courses c ON c.id = a.course_id"
                    " WHERE c.branch_id = :bid AND s.status = 'submitted'"
                ),
                {"bid": branch_id},
            )
        ).scalar_one() or 0
    except Exception:
        pending_submissions = 0

    # Atividade dos últimos 7 dias (daily_activity preenchida por trigger — Fase 8)
    try:
        weekly_activity_count: int = (
            await db.execute(
                text(
                    "SELECT COALESCE(SUM(da.count), 0) FROM daily_activity da"
                    " WHERE da.date >= CURRENT_DATE - INTERVAL '7 days'"
                    " AND da.profile_id IN ("
                    "   SELECT profile_id FROM branch_members"
                    "   WHERE branch_id = :bid AND status = 'active'"
                    " )"
                ),
                {"bid": branch_id},
            )
        ).scalar_one() or 0
    except Exception:
        weekly_activity_count = 0

    return DashboardStats(
        active_courses=active_courses,
        active_students=active_students,
        pending_submissions=pending_submissions,
        weekly_activity_count=weekly_activity_count,
    )
