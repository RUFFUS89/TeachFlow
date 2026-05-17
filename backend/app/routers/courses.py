"""Endpoints de cursos."""

from uuid import UUID

from fastapi import APIRouter, Query, status
from sqlalchemy import func as sa_func
from sqlalchemy import select, text, update
from sqlalchemy.orm import selectinload

from app.auth.dependencies import CurrentProfile, DbSession
from app.core.exceptions import NotFoundError
from app.core.permissions import require_branch_member, require_branch_staff
from app.models.assignment import Assignment
from app.models.course import (
    Course,
    CourseEnrollment,
    CourseItem,
    CourseItemKind,
    CourseModule,
    CourseStatus,
)
from app.models.identity import Profile
from app.models.lesson import Lesson
from app.schemas.course import (
    CourseActivityItem,
    CourseCreate,
    CourseDetail,
    CourseEnrollmentCreate,
    CourseEnrollmentRead,
    CourseItemCreate,
    CourseItemRead,
    CourseListItem,
    CourseModuleCreate,
    CourseModuleRead,
    CourseModuleUpdate,
    CourseRead,
    CourseUpdate,
    ReorderItemsPayload,
)

router = APIRouter(prefix="/courses", tags=["courses"])


# =============================================================================
# Courses
# =============================================================================


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


@router.get("/{course_id}", response_model=CourseDetail)
async def get_course(
    course_id: UUID,
    profile: CurrentProfile,
    db: DbSession,
) -> CourseDetail:
    """Retorna detalhes completos do curso com módulos e itens. Requer membro da filial."""
    stmt = (
        select(Course)
        .options(selectinload(Course.modules), selectinload(Course.items))
        .where(Course.id == course_id)
    )
    result = await db.execute(stmt)
    course = result.scalar_one_or_none()
    if course is None:
        raise NotFoundError("Curso")
    await require_branch_member(db, profile.id, course.branch_id)

    students_count_result = await db.execute(
        select(sa_func.count(CourseEnrollment.id)).where(CourseEnrollment.course_id == course_id)
    )
    students_count = students_count_result.scalar_one() or 0

    items_stmt = (
        select(
            CourseItem,
            sa_func.coalesce(Lesson.title, Assignment.title).label("item_title"),
        )
        .outerjoin(Lesson, CourseItem.lesson_id == Lesson.id)
        .outerjoin(Assignment, CourseItem.assignment_id == Assignment.id)
        .where(CourseItem.course_id == course_id)
        .order_by(CourseItem.position)
    )
    items_result = await db.execute(items_stmt)
    items = [
        CourseItemRead(
            id=row.CourseItem.id,
            course_id=row.CourseItem.course_id,
            module_id=row.CourseItem.module_id,
            position=row.CourseItem.position,
            kind=row.CourseItem.kind,
            lesson_id=row.CourseItem.lesson_id,
            assignment_id=row.CourseItem.assignment_id,
            title=row.item_title or "",
            created_at=row.CourseItem.created_at,
            updated_at=row.CourseItem.updated_at,
        )
        for row in items_result.all()
    ]

    return CourseDetail(
        id=course.id,
        branch_id=course.branch_id,
        author_id=course.author_id,
        title=course.title,
        description=course.description,
        cover_url=course.cover_url,
        color_tone=course.color_tone,
        status=course.status,
        created_at=course.created_at,
        updated_at=course.updated_at,
        modules=[CourseModuleRead.model_validate(m) for m in course.modules],
        items=items,
        students_count=students_count,
        items_count=len(items),
    )


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


# =============================================================================
# Modules
# =============================================================================


@router.post(
    "/{course_id}/modules",
    response_model=CourseModuleRead,
    status_code=status.HTTP_201_CREATED,
)
async def create_module(
    course_id: UUID,
    payload: CourseModuleCreate,
    profile: CurrentProfile,
    db: DbSession,
) -> CourseModule:
    """Cria um módulo no curso. Requer owner|admin."""
    course = await db.get(Course, course_id)
    if course is None:
        raise NotFoundError("Curso")
    await require_branch_staff(db, profile.id, course.branch_id)

    max_pos_result = await db.execute(
        select(sa_func.coalesce(sa_func.max(CourseModule.position), 0)).where(
            CourseModule.course_id == course_id
        )
    )
    next_pos = (max_pos_result.scalar_one() or 0) + 1

    module = CourseModule(course_id=course_id, name=payload.name, position=next_pos)
    db.add(module)
    await db.commit()
    await db.refresh(module)
    return module


@router.patch("/{course_id}/modules/{module_id}", response_model=CourseModuleRead)
async def update_module(
    course_id: UUID,
    module_id: UUID,
    payload: CourseModuleUpdate,
    profile: CurrentProfile,
    db: DbSession,
) -> CourseModule:
    """Atualiza nome/posição de um módulo. Requer owner|admin."""
    module = await db.get(CourseModule, module_id)
    if module is None or module.course_id != course_id:
        raise NotFoundError("Módulo")
    course = await db.get(Course, course_id)
    if course is None:
        raise NotFoundError("Curso")
    await require_branch_staff(db, profile.id, course.branch_id)

    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(module, field, value)
    await db.commit()
    await db.refresh(module)
    return module


@router.delete("/{course_id}/modules/{module_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_module(
    course_id: UUID,
    module_id: UUID,
    profile: CurrentProfile,
    db: DbSession,
) -> None:
    """Remove módulo; itens voltam para sem módulo. Requer owner|admin."""
    module = await db.get(CourseModule, module_id)
    if module is None or module.course_id != course_id:
        raise NotFoundError("Módulo")
    course = await db.get(Course, course_id)
    if course is None:
        raise NotFoundError("Curso")
    await require_branch_staff(db, profile.id, course.branch_id)

    await db.execute(
        update(CourseItem).where(CourseItem.module_id == module_id).values(module_id=None)
    )
    await db.delete(module)
    await db.commit()


# =============================================================================
# Items
# =============================================================================


@router.post(
    "/{course_id}/items",
    response_model=CourseItemRead,
    status_code=status.HTTP_201_CREATED,
)
async def create_item(
    course_id: UUID,
    payload: CourseItemCreate,
    profile: CurrentProfile,
    db: DbSession,
) -> CourseItemRead:
    """Cria aula ou atividade no curso (cria shell + course_item). Requer owner|admin."""
    course = await db.get(Course, course_id)
    if course is None:
        raise NotFoundError("Curso")
    await require_branch_staff(db, profile.id, course.branch_id)

    max_pos_result = await db.execute(
        select(sa_func.coalesce(sa_func.max(CourseItem.position), 0)).where(
            CourseItem.course_id == course_id
        )
    )
    next_pos = (max_pos_result.scalar_one() or 0) + 1

    lesson_id = None
    assignment_id = None

    if payload.kind == CourseItemKind.LESSON:
        lesson = Lesson(course_id=course_id, author_id=profile.id, title=payload.title)
        db.add(lesson)
        await db.flush()
        lesson_id = lesson.id
    else:
        assignment = Assignment(
            course_id=course_id,
            author_id=profile.id,
            title=payload.title,
            type="task",
        )
        db.add(assignment)
        await db.flush()
        assignment_id = assignment.id

    item = CourseItem(
        course_id=course_id,
        module_id=payload.module_id,
        position=next_pos,
        kind=payload.kind,
        lesson_id=lesson_id,
        assignment_id=assignment_id,
    )
    db.add(item)
    await db.commit()
    await db.refresh(item)

    return CourseItemRead(
        id=item.id,
        course_id=item.course_id,
        module_id=item.module_id,
        position=item.position,
        kind=item.kind,
        lesson_id=item.lesson_id,
        assignment_id=item.assignment_id,
        title=payload.title,
        created_at=item.created_at,
        updated_at=item.updated_at,
    )


@router.patch("/{course_id}/items/reorder", status_code=status.HTTP_204_NO_CONTENT)
async def reorder_items(
    course_id: UUID,
    payload: ReorderItemsPayload,
    profile: CurrentProfile,
    db: DbSession,
) -> None:
    """Reordena itens do curso (posição = índice na lista). Requer owner|admin."""
    course = await db.get(Course, course_id)
    if course is None:
        raise NotFoundError("Curso")
    await require_branch_staff(db, profile.id, course.branch_id)

    for position, item_id in enumerate(payload.ordered_ids, start=1):
        await db.execute(
            update(CourseItem)
            .where(CourseItem.id == item_id, CourseItem.course_id == course_id)
            .values(position=position)
        )
    await db.commit()


@router.delete("/{course_id}/items/{item_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_item(
    course_id: UUID,
    item_id: UUID,
    profile: CurrentProfile,
    db: DbSession,
) -> None:
    """Remove item do curso. Requer owner|admin."""
    item = await db.get(CourseItem, item_id)
    if item is None or item.course_id != course_id:
        raise NotFoundError("Item")
    course = await db.get(Course, course_id)
    if course is None:
        raise NotFoundError("Curso")
    await require_branch_staff(db, profile.id, course.branch_id)

    await db.delete(item)
    await db.commit()


# =============================================================================
# Enrollments
# =============================================================================


@router.get("/{course_id}/enrollments", response_model=list[CourseEnrollmentRead])
async def list_enrollments(
    course_id: UUID,
    profile: CurrentProfile,
    db: DbSession,
) -> list[CourseEnrollmentRead]:
    """Lista alunos matriculados. Requer owner|admin."""
    course = await db.get(Course, course_id)
    if course is None:
        raise NotFoundError("Curso")
    await require_branch_staff(db, profile.id, course.branch_id)

    result = await db.execute(
        select(CourseEnrollment, Profile)
        .join(Profile, CourseEnrollment.student_profile_id == Profile.id)
        .where(CourseEnrollment.course_id == course_id)
        .order_by(CourseEnrollment.enrolled_at.desc())
    )
    return [
        CourseEnrollmentRead(
            id=row.CourseEnrollment.id,
            course_id=row.CourseEnrollment.course_id,
            student_profile_id=row.CourseEnrollment.student_profile_id,
            enrolled_at=row.CourseEnrollment.enrolled_at,
            completed_at=row.CourseEnrollment.completed_at,
            student_name=row.Profile.full_name,
            student_avatar_url=row.Profile.avatar_url,
        )
        for row in result.all()
    ]


@router.post(
    "/{course_id}/enrollments",
    response_model=CourseEnrollmentRead,
    status_code=status.HTTP_201_CREATED,
)
async def enroll_student(
    course_id: UUID,
    payload: CourseEnrollmentCreate,
    profile: CurrentProfile,
    db: DbSession,
) -> CourseEnrollmentRead:
    """Matricula aluno no curso. Requer owner|admin."""
    course = await db.get(Course, course_id)
    if course is None:
        raise NotFoundError("Curso")
    await require_branch_staff(db, profile.id, course.branch_id)

    student = await db.get(Profile, payload.student_profile_id)
    if student is None:
        raise NotFoundError("Aluno")

    enrollment = CourseEnrollment(
        course_id=course_id,
        student_profile_id=payload.student_profile_id,
    )
    db.add(enrollment)
    await db.commit()
    await db.refresh(enrollment)

    return CourseEnrollmentRead(
        id=enrollment.id,
        course_id=enrollment.course_id,
        student_profile_id=enrollment.student_profile_id,
        enrolled_at=enrollment.enrolled_at,
        completed_at=enrollment.completed_at,
        student_name=student.full_name,
        student_avatar_url=student.avatar_url,
    )


@router.delete(
    "/{course_id}/enrollments/{student_profile_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
async def unenroll_student(
    course_id: UUID,
    student_profile_id: UUID,
    profile: CurrentProfile,
    db: DbSession,
) -> None:
    """Remove matrícula de aluno. Requer owner|admin."""
    course = await db.get(Course, course_id)
    if course is None:
        raise NotFoundError("Curso")
    await require_branch_staff(db, profile.id, course.branch_id)

    result = await db.execute(
        select(CourseEnrollment).where(
            CourseEnrollment.course_id == course_id,
            CourseEnrollment.student_profile_id == student_profile_id,
        )
    )
    enrollment = result.scalar_one_or_none()
    if enrollment is None:
        raise NotFoundError("Matrícula")

    await db.delete(enrollment)
    await db.commit()


# =============================================================================
# Activity feed
# =============================================================================


@router.get("/{course_id}/activity", response_model=list[CourseActivityItem])
async def get_course_activity(
    course_id: UUID,
    profile: CurrentProfile,
    db: DbSession,
) -> list[CourseActivityItem]:
    """Atividade recente do curso (matrículas + entregas). Requer membro da filial."""
    course = await db.get(Course, course_id)
    if course is None:
        raise NotFoundError("Curso")
    await require_branch_member(db, profile.id, course.branch_id)

    try:
        rows = await db.execute(
            text("""
                SELECT 'enrollment' AS kind,
                       p.full_name AS actor_name,
                       p.avatar_url AS actor_avatar_url,
                       'se matriculou no curso' AS description,
                       e.enrolled_at AS created_at
                FROM course_enrollments e
                JOIN profiles p ON p.id = e.student_profile_id
                WHERE e.course_id = :course_id

                UNION ALL

                SELECT 'submission' AS kind,
                       p.full_name AS actor_name,
                       p.avatar_url AS actor_avatar_url,
                       CONCAT('entregou: ', a.title) AS description,
                       s.submitted_at AS created_at
                FROM submissions s
                JOIN profiles p ON p.id = s.student_profile_id
                JOIN assignments a ON a.id = s.assignment_id
                JOIN course_items ci ON ci.assignment_id = a.id
                WHERE ci.course_id = :course_id
                  AND s.submitted_at IS NOT NULL

                ORDER BY created_at DESC
                LIMIT 20
            """),
            {"course_id": course_id},
        )
        return [
            CourseActivityItem(
                kind=row.kind,
                actor_name=row.actor_name,
                actor_avatar_url=row.actor_avatar_url,
                description=row.description,
                created_at=row.created_at,
            )
            for row in rows.all()
        ]
    except Exception:
        return []
