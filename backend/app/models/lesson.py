"""Modelo de aula (lesson) e entidades relacionadas."""

from datetime import datetime
from enum import StrEnum
from uuid import UUID

from sqlalchemy import Boolean, DateTime, ForeignKey, Integer, String, Text
from sqlalchemy import Enum as SAEnum
from sqlalchemy.dialects.postgresql import UUID as PgUUID  # noqa: N811
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base, created_at, updated_at, uuid_pk


class VideoProvider(StrEnum):
    YOUTUBE = "youtube"
    VIMEO = "vimeo"
    MUX = "mux"
    SELF_HOSTED = "self_hosted"


class ItemProgressStatus(StrEnum):
    NOT_STARTED = "not_started"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"


video_provider_pg = SAEnum(
    VideoProvider,
    name="video_provider",
    create_type=False,
    values_callable=lambda x: [m.value for m in x],
)

item_progress_status_pg = SAEnum(
    ItemProgressStatus,
    name="item_progress_status",
    create_type=False,
    values_callable=lambda x: [m.value for m in x],
)


class Lesson(Base):
    __tablename__ = "lessons"

    id: Mapped[uuid_pk]
    course_id: Mapped[UUID] = mapped_column(
        PgUUID(as_uuid=True), ForeignKey("courses.id", ondelete="CASCADE"), nullable=False
    )
    author_id: Mapped[UUID] = mapped_column(
        PgUUID(as_uuid=True), ForeignKey("profiles.id"), nullable=False
    )
    title: Mapped[str] = mapped_column(String, nullable=False)
    description: Mapped[str | None] = mapped_column(Text)
    content: Mapped[str | None] = mapped_column(Text)
    video_url: Mapped[str | None] = mapped_column(String)
    video_provider: Mapped[VideoProvider | None] = mapped_column(video_provider_pg)
    video_duration_seconds: Mapped[int | None] = mapped_column(Integer)
    is_essential: Mapped[bool] = mapped_column(Boolean, nullable=False, server_default="false")
    published_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    created_at: Mapped[created_at]
    updated_at: Mapped[updated_at]


class LessonAttachment(Base):
    __tablename__ = "lesson_attachments"

    id: Mapped[uuid_pk]
    lesson_id: Mapped[UUID] = mapped_column(
        PgUUID(as_uuid=True), ForeignKey("lessons.id", ondelete="CASCADE"), nullable=False
    )
    name: Mapped[str] = mapped_column(String, nullable=False)
    storage_path: Mapped[str] = mapped_column(String, nullable=False)
    mime_type: Mapped[str | None] = mapped_column(String)
    size_bytes: Mapped[int | None] = mapped_column(Integer)
    created_at: Mapped[created_at]


class LessonComment(Base):
    __tablename__ = "lesson_comments"

    id: Mapped[uuid_pk]
    lesson_id: Mapped[UUID] = mapped_column(
        PgUUID(as_uuid=True), ForeignKey("lessons.id", ondelete="CASCADE"), nullable=False
    )
    author_id: Mapped[UUID] = mapped_column(
        PgUUID(as_uuid=True), ForeignKey("profiles.id"), nullable=False
    )
    parent_id: Mapped[UUID | None] = mapped_column(
        PgUUID(as_uuid=True), ForeignKey("lesson_comments.id", ondelete="CASCADE")
    )
    content: Mapped[str] = mapped_column(Text, nullable=False)
    created_at: Mapped[created_at]


class LessonFavorite(Base):
    __tablename__ = "lesson_favorites"

    id: Mapped[uuid_pk]
    lesson_id: Mapped[UUID] = mapped_column(
        PgUUID(as_uuid=True), ForeignKey("lessons.id", ondelete="CASCADE"), nullable=False
    )
    profile_id: Mapped[UUID] = mapped_column(
        PgUUID(as_uuid=True), ForeignKey("profiles.id", ondelete="CASCADE"), nullable=False
    )
    created_at: Mapped[created_at]


class ItemProgress(Base):
    __tablename__ = "item_progress"

    id: Mapped[uuid_pk]
    course_item_id: Mapped[UUID] = mapped_column(
        PgUUID(as_uuid=True), ForeignKey("course_items.id", ondelete="CASCADE"), nullable=False
    )
    student_profile_id: Mapped[UUID] = mapped_column(
        PgUUID(as_uuid=True), ForeignKey("profiles.id", ondelete="CASCADE"), nullable=False
    )
    status: Mapped[ItemProgressStatus] = mapped_column(
        item_progress_status_pg, nullable=False, server_default="not_started"
    )
    started_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    completed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    watch_seconds: Mapped[int | None] = mapped_column(Integer)
    created_at: Mapped[created_at]
    updated_at: Mapped[updated_at]
