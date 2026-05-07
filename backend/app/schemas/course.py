"""Schemas Pydantic — request/response de cursos e dashboard."""

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field

from app.models.course import CourseStatus

# =============================================================================
# Course
# =============================================================================


class CourseCreate(BaseModel):
    branch_id: UUID
    title: str = Field(min_length=1, max_length=200)
    description: str | None = None
    cover_url: str | None = None
    color_tone: str | None = None


class CourseUpdate(BaseModel):
    title: str | None = Field(default=None, min_length=1, max_length=200)
    description: str | None = None
    cover_url: str | None = None
    color_tone: str | None = None
    status: CourseStatus | None = None


class CourseRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    branch_id: UUID
    author_id: UUID
    title: str
    description: str | None = None
    cover_url: str | None = None
    color_tone: str | None = None
    status: CourseStatus
    created_at: datetime
    updated_at: datetime


class CourseListItem(BaseModel):
    """Curso resumido para listagens (inclui contadores calculados)."""

    id: UUID
    branch_id: UUID
    author_id: UUID
    title: str
    description: str | None = None
    cover_url: str | None = None
    color_tone: str | None = None
    status: CourseStatus
    created_at: datetime
    updated_at: datetime
    students_count: int = 0
    items_count: int = 0


# =============================================================================
# Dashboard
# =============================================================================


class DashboardStats(BaseModel):
    active_courses: int
    active_students: int
    pending_submissions: int
    weekly_activity_count: int
