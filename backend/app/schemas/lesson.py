"""Schemas Pydantic — request/response de aulas."""

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field

from app.models.lesson import ItemProgressStatus, VideoProvider


class LessonRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    course_id: UUID
    author_id: UUID
    title: str
    description: str | None = None
    content: str | None = None
    video_url: str | None = None
    video_provider: VideoProvider | None = None
    video_duration_seconds: int | None = None
    is_essential: bool
    published_at: datetime | None = None
    created_at: datetime
    updated_at: datetime


class LessonUpdate(BaseModel):
    title: str | None = Field(default=None, min_length=1, max_length=300)
    description: str | None = None
    content: str | None = None
    video_url: str | None = None
    video_provider: VideoProvider | None = None
    video_duration_seconds: int | None = None
    is_essential: bool | None = None
    published_at: datetime | None = None


# =============================================================================
# Comments
# =============================================================================


class LessonCommentRead(BaseModel):
    id: UUID
    lesson_id: UUID
    author_id: UUID
    parent_id: UUID | None = None
    author_name: str
    author_avatar_url: str | None = None
    content: str
    created_at: datetime


class LessonCommentCreate(BaseModel):
    content: str = Field(min_length=1)
    parent_id: UUID | None = None


# =============================================================================
# Attachments
# =============================================================================


class LessonAttachmentRead(BaseModel):
    id: UUID
    lesson_id: UUID
    name: str
    storage_path: str
    mime_type: str | None = None
    size_bytes: int | None = None
    created_at: datetime


class LessonAttachmentCreate(BaseModel):
    name: str = Field(min_length=1, max_length=255)
    storage_path: str
    mime_type: str | None = None
    size_bytes: int | None = None


# =============================================================================
# Progress
# =============================================================================


class ItemProgressRead(BaseModel):
    id: UUID
    course_item_id: UUID
    student_profile_id: UUID
    status: ItemProgressStatus
    started_at: datetime | None = None
    completed_at: datetime | None = None
    watch_seconds: int | None = None
    created_at: datetime
    updated_at: datetime


class ItemProgressUpdate(BaseModel):
    status: ItemProgressStatus | None = None
    watch_seconds: int | None = None


# =============================================================================
# Favorite toggle response
# =============================================================================


class FavoriteToggleResponse(BaseModel):
    favorited: bool
