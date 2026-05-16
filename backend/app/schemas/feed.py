"""Schemas Pydantic — feed do aluno e notificações."""

from datetime import date, datetime
from uuid import UUID

from pydantic import BaseModel

from app.models.course import CourseStatus

# =============================================================================
# Feed
# =============================================================================


class FeedContinueItem(BaseModel):
    """Último item em progresso do aluno."""

    course_item_id: UUID
    lesson_id: UUID
    lesson_title: str
    course_id: UUID
    course_title: str
    color_tone: str | None = None
    watch_seconds: int | None = None


class EnrolledCourseItem(BaseModel):
    """Curso matriculado com indicador de progresso."""

    course_id: UUID
    title: str
    description: str | None = None
    color_tone: str | None = None
    cover_url: str | None = None
    status: CourseStatus
    enrolled_at: datetime
    completed_at: datetime | None = None
    total_items: int = 0
    completed_items: int = 0

    @property
    def progress_percent(self) -> float:
        if self.total_items == 0:
            return 0.0
        return round(self.completed_items / self.total_items * 100, 1)


class DeadlineItem(BaseModel):
    """Atividade com prazo próximo."""

    assignment_id: UUID
    title: str
    assignment_type: str
    course_id: UUID
    course_title: str
    due_date: datetime


class FeedResponse(BaseModel):
    """Resposta completa do feed do aluno."""

    continue_item: FeedContinueItem | None = None
    enrolled_courses: list[EnrolledCourseItem] = []
    upcoming_deadlines: list[DeadlineItem] = []
    streak_days: int = 0


class StreakDay(BaseModel):
    """Atividade de um dia para o heatmap."""

    date: date
    count: int


# =============================================================================
# Notificações
# =============================================================================


class NotificationRead(BaseModel):
    """Notificação para o destinatário."""

    id: UUID
    type: str
    title: str
    body: str | None = None
    link: str | None = None
    read_at: datetime | None = None
    created_at: datetime
