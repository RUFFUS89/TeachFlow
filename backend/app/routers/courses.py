"""Endpoints de cursos."""

from uuid import UUID

from fastapi import APIRouter, Query, status
from sqlalchemy import func as sa_func
from sqlalchemy import select

from app.auth.dependencies import CurrentProfile, DbSession
from app.core.exceptions import NotFoundError
from app.core.permissions import require_branch_member, require_branch_staff
from app.models.course import Course, CourseEnrollment, CourseItem, CourseStatus
from app.schemas.course import CourseCreate, CourseListItem, CourseRead, CourseUpdate

router = APIRouter(prefix="/courses", tags=["courses"])


@router.get("/", response_model=list[CourseListItem])
async def list_courses(
    branch_id: UUID,
    profile: CurrentProfile,
    db: DbSession,
    course_status: CourseStatus | None = Query(default=None, alias="status"),
) -> list[CourseListItem]:
    """Lista cursos de uma filial. Requer ser staff (owner|admin)."""
    await require_branch_staff(db, profile.id, branch_id)

    students_subq = (
        select(sa_func.count(CourseEnrollment.id))
        .where(CourseEnrollment.course_id == Course.id)
        .correlate(Course)
        .scalar_subquery()
    )
    items_subq = (
        select(sa_func.count(CourseItem.id))
        .where(CourseItem.course_id == Course.id)
        .correlate(Course)
        .scalar_subquery()
    )

    q = select(
        Course, students_subq.label("students_count"), items_subq.label("items_count")
    ).where(Course.branch_id == branch_id)
    if course_status is not None:
        q = q.where(Course.status == course_status)
    q = q.order_by(Course.created_at.desc())

    result = await db.execute(q)
    rows = result.all()

    return [
        CourseListItem(
            id=row.Course.id,
            branch_id=row.Course.branch_id,
            author_id=row.Course.author_id,
            title=row.Course.title,
            description=row.Course.description,
            cover_url=row.Course.cover_url,
            color_tone=row.Course.color_tone,
            status=row.Course.status,
            created_at=row.Course.created_at,
            updated_at=row.Course.updated_at,
            students_count=row.students_count or 0,
            items_count=row.items_count or 0,
        )
        for row in rows
    ]


@router.post("/", response_model=CourseRead, status_code=status.HTTP_201_CREATED)
async def create_course(
    payload: CourseCreate,
    profile: CurrentProfile,
    db: DbSession,
) -> Course:
    """Cria um curso na filial. Requer owner|admin."""
    await require_branch_staff(db, profile.id, payload.branch_id)

    course = Course(
        branch_id=payload.branch_id,
        author_id=profile.id,
        title=payload.title,
        description=payload.description,
        cover_url=payload.cover_url,
        color_tone=payload.color_tone,
    )
    db.add(course)
    await db.commit()
    await db.refresh(course)
    return course


@router.get("/{course_id}", response_model=CourseRead)
async def get_course(
    course_id: UUID,
    profile: CurrentProfile,
    db: DbSession,
) -> Course:
    """Retorna um curso. Requer ser membro da filial."""
    course = await db.get(Course, course_id)
    if course is None:
        raise NotFoundError("Curso")
    await require_branch_member(db, profile.id, course.branch_id)
    return course


@router.patch("/{course_id}", response_model=CourseRead)
async def update_course(
    course_id: UUID,
    payload: CourseUpdate,
    profile: CurrentProfile,
    db: DbSession,
) -> Course:
    """Atualiza um curso. Requer owner|admin da filial."""
    course = await db.get(Course, course_id)
    if course is None:
        raise NotFoundError("Curso")
    await require_branch_staff(db, profile.id, course.branch_id)

    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(course, field, value)
    await db.commit()
    await db.refresh(course)
    return course
