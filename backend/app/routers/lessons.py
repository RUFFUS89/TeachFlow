"""Endpoints de aulas (lessons)."""

from datetime import UTC, datetime
from uuid import UUID

from fastapi import APIRouter, status
from sqlalchemy import select

from app.auth.dependencies import CurrentProfile, DbSession
from app.core.exceptions import NotFoundError
from app.core.permissions import require_branch_member, require_branch_staff
from app.core.supabase_admin import get_supabase_admin
from app.models.course import Course, CourseItem
from app.models.identity import Profile
from app.models.lesson import (
    ItemProgress,
    ItemProgressStatus,
    Lesson,
    LessonAttachment,
    LessonComment,
    LessonFavorite,
)
from app.schemas.lesson import (
    FavoriteToggleResponse,
    ItemProgressRead,
    ItemProgressUpdate,
    LessonAttachmentCreate,
    LessonAttachmentRead,
    LessonCommentCreate,
    LessonCommentRead,
    LessonRead,
    LessonUpdate,
)

router = APIRouter(prefix="/lessons", tags=["lessons"])


# =============================================================================
# Helpers
# =============================================================================


async def _get_lesson_and_assert_member(lesson_id: UUID, profile_id: UUID, db: DbSession) -> Lesson:
    lesson = await db.get(Lesson, lesson_id)
    if lesson is None:
        raise NotFoundError("Aula")
    await require_branch_member(db, profile_id, await _branch_id_for_course(lesson.course_id, db))
    return lesson


async def _branch_id_for_course(course_id: UUID, db: DbSession) -> UUID:
    course = await db.get(Course, course_id)
    if course is None:
        raise NotFoundError("Curso")
    return course.branch_id  # type: ignore[return-value]


# =============================================================================
# Lesson CRUD
# =============================================================================


@router.get("/{lesson_id}", response_model=LessonRead)
async def get_lesson(
    lesson_id: UUID,
    profile: CurrentProfile,
    db: DbSession,
) -> Lesson:
    return await _get_lesson_and_assert_member(lesson_id, profile.id, db)


@router.patch("/{lesson_id}", response_model=LessonRead)
async def update_lesson(
    lesson_id: UUID,
    payload: LessonUpdate,
    profile: CurrentProfile,
    db: DbSession,
) -> Lesson:
    lesson = await db.get(Lesson, lesson_id)
    if lesson is None:
        raise NotFoundError("Aula")
    branch_id = await _branch_id_for_course(lesson.course_id, db)
    await require_branch_staff(db, profile.id, branch_id)

    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(lesson, field, value)
    await db.commit()
    await db.refresh(lesson)
    return lesson


@router.delete("/{lesson_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_lesson(
    lesson_id: UUID,
    profile: CurrentProfile,
    db: DbSession,
) -> None:
    lesson = await db.get(Lesson, lesson_id)
    if lesson is None:
        raise NotFoundError("Aula")
    branch_id = await _branch_id_for_course(lesson.course_id, db)
    await require_branch_staff(db, profile.id, branch_id)

    await db.delete(lesson)
    await db.commit()


# =============================================================================
# Comments
# =============================================================================


@router.get("/{lesson_id}/comments", response_model=list[LessonCommentRead])
async def list_comments(
    lesson_id: UUID,
    profile: CurrentProfile,
    db: DbSession,
) -> list[LessonCommentRead]:
    lesson = await db.get(Lesson, lesson_id)
    if lesson is None:
        raise NotFoundError("Aula")
    await require_branch_member(db, profile.id, await _branch_id_for_course(lesson.course_id, db))

    result = await db.execute(
        select(LessonComment, Profile)
        .join(Profile, LessonComment.author_id == Profile.id)
        .where(LessonComment.lesson_id == lesson_id)
        .where(LessonComment.parent_id.is_(None))
        .order_by(LessonComment.created_at.asc())
    )
    return [
        LessonCommentRead(
            id=row.LessonComment.id,
            lesson_id=row.LessonComment.lesson_id,
            author_id=row.LessonComment.author_id,
            parent_id=row.LessonComment.parent_id,
            author_name=row.Profile.full_name,
            author_avatar_url=row.Profile.avatar_url,
            content=row.LessonComment.content,
            created_at=row.LessonComment.created_at,
        )
        for row in result.all()
    ]


@router.post(
    "/{lesson_id}/comments",
    response_model=LessonCommentRead,
    status_code=status.HTTP_201_CREATED,
)
async def create_comment(
    lesson_id: UUID,
    payload: LessonCommentCreate,
    profile: CurrentProfile,
    db: DbSession,
) -> LessonCommentRead:
    lesson = await db.get(Lesson, lesson_id)
    if lesson is None:
        raise NotFoundError("Aula")
    await require_branch_member(db, profile.id, await _branch_id_for_course(lesson.course_id, db))

    comment = LessonComment(
        lesson_id=lesson_id,
        author_id=profile.id,
        parent_id=payload.parent_id,
        content=payload.content,
    )
    db.add(comment)
    await db.commit()
    await db.refresh(comment)

    return LessonCommentRead(
        id=comment.id,
        lesson_id=comment.lesson_id,
        author_id=comment.author_id,
        parent_id=comment.parent_id,
        author_name=profile.full_name,
        author_avatar_url=profile.avatar_url,
        content=comment.content,
        created_at=comment.created_at,
    )


@router.delete("/comments/{comment_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_comment(
    comment_id: UUID,
    profile: CurrentProfile,
    db: DbSession,
) -> None:
    comment = await db.get(LessonComment, comment_id)
    if comment is None:
        raise NotFoundError("Comentário")

    lesson = await db.get(Lesson, comment.lesson_id)
    if lesson is None:
        raise NotFoundError("Aula")
    branch_id = await _branch_id_for_course(lesson.course_id, db)

    if comment.author_id != profile.id:
        await require_branch_staff(db, profile.id, branch_id)

    await db.delete(comment)
    await db.commit()


# =============================================================================
# Favorite toggle
# =============================================================================


@router.post("/{lesson_id}/favorite", response_model=FavoriteToggleResponse)
async def toggle_favorite(
    lesson_id: UUID,
    profile: CurrentProfile,
    db: DbSession,
) -> FavoriteToggleResponse:
    lesson = await db.get(Lesson, lesson_id)
    if lesson is None:
        raise NotFoundError("Aula")
    await require_branch_member(db, profile.id, await _branch_id_for_course(lesson.course_id, db))

    result = await db.execute(
        select(LessonFavorite).where(
            LessonFavorite.lesson_id == lesson_id,
            LessonFavorite.profile_id == profile.id,
        )
    )
    existing = result.scalar_one_or_none()

    if existing:
        await db.delete(existing)
        await db.commit()
        return FavoriteToggleResponse(favorited=False)
    else:
        db.add(LessonFavorite(lesson_id=lesson_id, profile_id=profile.id))
        await db.commit()
        return FavoriteToggleResponse(favorited=True)


# =============================================================================
# Progress
# =============================================================================


@router.post("/{lesson_id}/progress", response_model=ItemProgressRead)
async def update_progress(
    lesson_id: UUID,
    payload: ItemProgressUpdate,
    profile: CurrentProfile,
    db: DbSession,
) -> ItemProgressRead:
    lesson = await db.get(Lesson, lesson_id)
    if lesson is None:
        raise NotFoundError("Aula")
    await require_branch_member(db, profile.id, await _branch_id_for_course(lesson.course_id, db))

    item_result = await db.execute(select(CourseItem).where(CourseItem.lesson_id == lesson_id))
    course_item = item_result.scalar_one_or_none()
    if course_item is None:
        raise NotFoundError("Item do curso")

    progress_result = await db.execute(
        select(ItemProgress).where(
            ItemProgress.course_item_id == course_item.id,
            ItemProgress.student_profile_id == profile.id,
        )
    )
    progress = progress_result.scalar_one_or_none()

    now = datetime.now(UTC)

    if progress is None:
        progress = ItemProgress(
            course_item_id=course_item.id,
            student_profile_id=profile.id,
            status=payload.status or ItemProgressStatus.IN_PROGRESS,
            watch_seconds=payload.watch_seconds,
            started_at=now,
        )
        db.add(progress)
    else:
        if payload.status is not None:
            progress.status = payload.status
            if payload.status == ItemProgressStatus.COMPLETED and progress.completed_at is None:
                progress.completed_at = now
        if payload.watch_seconds is not None:
            progress.watch_seconds = payload.watch_seconds

    await db.commit()
    await db.refresh(progress)
    return ItemProgressRead(
        id=progress.id,
        course_item_id=progress.course_item_id,
        student_profile_id=progress.student_profile_id,
        status=progress.status,
        started_at=progress.started_at,
        completed_at=progress.completed_at,
        watch_seconds=progress.watch_seconds,
        created_at=progress.created_at,
        updated_at=progress.updated_at,
    )


# =============================================================================
# Attachments
# =============================================================================


@router.get("/{lesson_id}/attachments", response_model=list[LessonAttachmentRead])
async def list_attachments(
    lesson_id: UUID,
    profile: CurrentProfile,
    db: DbSession,
) -> list[LessonAttachmentRead]:
    lesson = await db.get(Lesson, lesson_id)
    if lesson is None:
        raise NotFoundError("Aula")
    await require_branch_member(db, profile.id, await _branch_id_for_course(lesson.course_id, db))

    result = await db.execute(
        select(LessonAttachment)
        .where(LessonAttachment.lesson_id == lesson_id)
        .order_by(LessonAttachment.created_at.asc())
    )
    return [LessonAttachmentRead.model_validate(a) for a in result.scalars().all()]


@router.post(
    "/{lesson_id}/attachments",
    response_model=LessonAttachmentRead,
    status_code=status.HTTP_201_CREATED,
)
async def register_attachment(
    lesson_id: UUID,
    payload: LessonAttachmentCreate,
    profile: CurrentProfile,
    db: DbSession,
) -> LessonAttachmentRead:
    """Registra anexo já enviado pro Supabase Storage. Requer owner|admin."""
    lesson = await db.get(Lesson, lesson_id)
    if lesson is None:
        raise NotFoundError("Aula")
    branch_id = await _branch_id_for_course(lesson.course_id, db)
    await require_branch_staff(db, profile.id, branch_id)

    attachment = LessonAttachment(
        lesson_id=lesson_id,
        name=payload.name,
        storage_path=payload.storage_path,
        mime_type=payload.mime_type,
        size_bytes=payload.size_bytes,
    )
    db.add(attachment)
    await db.commit()
    await db.refresh(attachment)
    return LessonAttachmentRead.model_validate(attachment)


@router.get("/{lesson_id}/attachments/{attachment_id}/url")
async def get_attachment_url(
    lesson_id: UUID,
    attachment_id: UUID,
    profile: CurrentProfile,
    db: DbSession,
) -> dict[str, str]:
    """Retorna URL assinada para download do anexo (válida 1h)."""
    lesson = await db.get(Lesson, lesson_id)
    if lesson is None:
        raise NotFoundError("Aula")
    await require_branch_member(db, profile.id, await _branch_id_for_course(lesson.course_id, db))

    attachment = await db.get(LessonAttachment, attachment_id)
    if attachment is None or attachment.lesson_id != lesson_id:
        raise NotFoundError("Anexo")

    supabase = get_supabase_admin()
    response = supabase.storage.from_("lesson-materials").create_signed_url(
        attachment.storage_path, 3600
    )
    return {"url": response["signedURL"]}
