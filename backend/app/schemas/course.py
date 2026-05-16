"""Schemas Pydantic — request/response de cursos e dashboard."""

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field

from app.models.course import CourseItemKind, CourseStatus

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
# Course Modules
# =============================================================================


class CourseModuleRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    course_id: UUID
    name: str
    position: int
    created_at: datetime


class CourseModuleCreate(BaseModel):
    name: str = Field(min_length=1, max_length=200)


class CourseModuleUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=200)
    position: int | None = None


# =============================================================================
# Course Items
# =============================================================================


class CourseItemRead(BaseModel):
    """Item do curso com título resolvido via JOIN com lesson/assignment."""

    id: UUID
    course_id: UUID
    module_id: UUID | None
    position: int
    kind: CourseItemKind
    lesson_id: UUID | None
    assignment_id: UUID | None
    title: str
    created_at: datetime
    updated_at: datetime


class CourseItemCreate(BaseModel):
    module_id: UUID | None = None
    kind: CourseItemKind
    title: str = Field(min_length=1, max_length=200)


class ReorderItemsPayload(BaseModel):
    ordered_ids: list[UUID]


# =============================================================================
# Course Enrollments
# =============================================================================


class CourseEnrollmentRead(BaseModel):
    id: UUID
    course_id: UUID
    student_profile_id: UUID
    enrolled_at: datetime
    completed_at: datetime | None
    student_name: str
    student_avatar_url: str | None = None


class CourseEnrollmentCreate(BaseModel):
    student_profile_id: UUID


# =============================================================================
# Course Detail (resposta expandida com módulos, itens e contadores)
# =============================================================================


class CourseDetail(BaseModel):
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
    modules: list[CourseModuleRead] = []
    items: list[CourseItemRead] = []
    students_count: int = 0
    items_count: int = 0


# =============================================================================
# Activity feed do curso
# =============================================================================


class CourseActivityItem(BaseModel):
    kind: str
    actor_name: str
    actor_avatar_url: str | None = None
    description: str
    created_at: datetime


# =============================================================================
# Dashboard
# =============================================================================


class DashboardStats(BaseModel):
    active_courses: int
    active_students: int
    pending_submissions: int
    weekly_activity_count: int
