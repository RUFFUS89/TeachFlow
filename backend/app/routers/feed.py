"""Feed do aluno — cursos matriculados, continue assistindo, deadlines e streak."""

from datetime import UTC, date, datetime, timedelta
from uuid import UUID

from fastapi import APIRouter, Query
from sqlalchemy import func, select

from app.auth.dependencies import CurrentProfile, DbSession
from app.models.assignment import Assignment
from app.models.course import Course, CourseEnrollment, CourseItem, CourseItemKind
from app.models.lesson import ItemProgress, ItemProgressStatus, Lesson
from app.schemas.feed import (
    DeadlineItem,
    EnrolledCourseItem,
    FeedContinueItem,
    FeedResponse,
    StreakDay,
)

router = APIRouter(prefix="/feed", tags=["feed"])


@router.get("/me", response_model=FeedResponse)
async def feed_me(profile: CurrentProfile, db: DbSession) -> FeedResponse:
    """Feed personalizado do aluno: continue, cursos, prazos e streak."""

    # ------------------------------------------------------------------
    # 1. Continue assistindo — último item em progresso
    # ------------------------------------------------------------------
    continue_item = None

    progress_q = await db.execute(
        select(ItemProgress, CourseItem, Course)
        .join(CourseItem, CourseItem.id == ItemProgress.course_item_id)
        .join(Course, Course.id == CourseItem.course_id)
        .where(
            ItemProgress.student_profile_id == profile.id,
            ItemProgress.status == ItemProgressStatus.IN_PROGRESS,
            CourseItem.kind == CourseItemKind.LESSON,
            CourseItem.lesson_id.is_not(None),
        )
        .order_by(ItemProgress.updated_at.desc())
        .limit(1)
    )
    row = progress_q.first()
    if row:
        ip, ci, course = row
        lesson = await db.get(Lesson, ci.lesson_id)
        if lesson:
            continue_item = FeedContinueItem(
                course_item_id=ci.id,
                lesson_id=lesson.id,
                lesson_title=lesson.title,
                course_id=course.id,
                course_title=course.title,
                color_tone=course.color_tone,
                watch_seconds=ip.watch_seconds,
            )

    # ------------------------------------------------------------------
    # 2. Cursos matriculados com contagem de progresso
    # ------------------------------------------------------------------
    enrollments_q = await db.execute(
        select(CourseEnrollment, Course)
        .join(Course, Course.id == CourseEnrollment.course_id)
        .where(CourseEnrollment.student_profile_id == profile.id)
        .order_by(CourseEnrollment.enrolled_at.desc())
    )
    enrollments = enrollments_q.all()

    enrolled_courses = []
    for enrollment, course in enrollments:
        total_q = await db.execute(select(func.count()).where(CourseItem.course_id == course.id))
        total = total_q.scalar_one()

        done_q = await db.execute(
            select(func.count())
            .select_from(ItemProgress)
            .join(CourseItem, CourseItem.id == ItemProgress.course_item_id)
            .where(
                CourseItem.course_id == course.id,
                ItemProgress.student_profile_id == profile.id,
                ItemProgress.status == ItemProgressStatus.COMPLETED,
            )
        )
        done = done_q.scalar_one()

        enrolled_courses.append(
            EnrolledCourseItem(
                course_id=course.id,
                title=course.title,
                description=course.description,
                color_tone=course.color_tone,
                cover_url=course.cover_url,
                status=course.status,
                enrolled_at=enrollment.enrolled_at,
                completed_at=enrollment.completed_at,
                total_items=total,
                completed_items=done,
            )
        )

    # ------------------------------------------------------------------
    # 3. Próximos prazos (max 5, dentro de 30 dias)
    # ------------------------------------------------------------------
    now = datetime.now(UTC)
    enrolled_course_ids = [e.course_id for e, _ in enrollments]

    deadlines: list[DeadlineItem] = []
    if enrolled_course_ids:
        dl_q = await db.execute(
            select(Assignment, Course)
            .join(Course, Course.id == Assignment.course_id)
            .where(
                Assignment.course_id.in_(enrolled_course_ids),
                Assignment.due_date.is_not(None),
                Assignment.due_date > now,
                Assignment.due_date < now + timedelta(days=30),
            )
            .order_by(Assignment.due_date)
            .limit(5)
        )
        for assignment, course in dl_q.all():
            deadlines.append(
                DeadlineItem(
                    assignment_id=assignment.id,
                    title=assignment.title,
                    assignment_type=assignment.type.value,
                    course_id=course.id,
                    course_title=course.title,
                    due_date=assignment.due_date,
                )
            )

    # ------------------------------------------------------------------
    # 4. Streak — dias consecutivos com item concluído (regressivo)
    # ------------------------------------------------------------------
    streak_days = await _calculate_streak(db, profile.id)

    return FeedResponse(
        continue_item=continue_item,
        enrolled_courses=enrolled_courses,
        upcoming_deadlines=deadlines,
        streak_days=streak_days,
    )


@router.get("/streak", response_model=list[StreakDay])
async def feed_streak(
    profile: CurrentProfile,
    db: DbSession,
    days: int = Query(default=84, ge=7, le=365),
) -> list[StreakDay]:
    """Heatmap de atividade — dias agrupados com contagem de itens concluídos."""
    cutoff = datetime.now(UTC) - timedelta(days=days)

    q = await db.execute(
        select(
            func.date(ItemProgress.completed_at).label("day"),
            func.count().label("cnt"),
        )
        .where(
            ItemProgress.student_profile_id == profile.id,
            ItemProgress.status == ItemProgressStatus.COMPLETED,
            ItemProgress.completed_at.is_not(None),
            ItemProgress.completed_at >= cutoff,
        )
        .group_by(func.date(ItemProgress.completed_at))
        .order_by(func.date(ItemProgress.completed_at))
    )

    return [StreakDay(date=row.day, count=row.cnt) for row in q.all()]


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------


async def _calculate_streak(db: DbSession, profile_id: UUID) -> int:
    """Conta dias consecutivos com pelo menos 1 item concluído (regressivo do mais recente)."""
    q = await db.execute(
        select(func.date(ItemProgress.completed_at).label("day"))
        .where(
            ItemProgress.student_profile_id == profile_id,
            ItemProgress.status == ItemProgressStatus.COMPLETED,
            ItemProgress.completed_at.is_not(None),
        )
        .group_by(func.date(ItemProgress.completed_at))
        .order_by(func.date(ItemProgress.completed_at).desc())
    )
    active_days: list[date] = [row.day for row in q.all()]

    if not active_days:
        return 0

    today = date.today()
    # Se o dia mais recente for mais de 1 dia atrás, o streak quebrou
    if active_days[0] < today - timedelta(days=1):
        return 0

    streak = 0
    expected = active_days[0]
    for day in active_days:
        if day == expected:
            streak += 1
            expected -= timedelta(days=1)
        else:
            break

    return streak
