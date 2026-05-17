"""Modelo de atividade (assignment)."""

from datetime import datetime
from decimal import Decimal
from enum import StrEnum
from uuid import UUID

from sqlalchemy import Boolean, DateTime, ForeignKey, Integer, Numeric, String, Text
from sqlalchemy import Enum as SAEnum
from sqlalchemy.dialects.postgresql import UUID as PgUUID  # noqa: N811
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base, created_at, updated_at, uuid_pk


class AssignmentType(StrEnum):
    TASK = "task"
    QUIZ = "quiz"
    EXAM = "exam"
    PROJECT = "project"


class QuizFeedbackMode(StrEnum):
    IMMEDIATE = "immediate"
    ON_SUBMIT = "on_submit"
    MANUAL_RELEASE = "manual_release"


assignment_type_pg = SAEnum(
    AssignmentType,
    name="assignment_type",
    create_type=False,
    values_callable=lambda x: [m.value for m in x],
)

quiz_feedback_mode_pg = SAEnum(
    QuizFeedbackMode,
    name="quiz_feedback_mode",
    create_type=False,
    values_callable=lambda x: [m.value for m in x],
)


class Assignment(Base):
    __tablename__ = "assignments"

    id: Mapped[uuid_pk]
    course_id: Mapped[UUID] = mapped_column(
        PgUUID(as_uuid=True), ForeignKey("courses.id", ondelete="CASCADE"), nullable=False
    )
    author_id: Mapped[UUID] = mapped_column(
        PgUUID(as_uuid=True), ForeignKey("profiles.id"), nullable=False
    )
    title: Mapped[str] = mapped_column(String, nullable=False)
    instructions: Mapped[str | None] = mapped_column(Text)
    type: Mapped[AssignmentType] = mapped_column(assignment_type_pg, nullable=False)
    max_score: Mapped[Decimal] = mapped_column(Numeric(6, 2), nullable=False, server_default="10")
    weight: Mapped[Decimal] = mapped_column(Numeric(5, 2), nullable=False, server_default="1.0")
    due_date: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    available_from: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    published_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    allow_late_submission: Mapped[bool] = mapped_column(
        Boolean, nullable=False, server_default="false"
    )
    max_attempts: Mapped[int | None] = mapped_column(Integer)
    time_limit_minutes: Mapped[int | None] = mapped_column(Integer)
    shuffle_questions: Mapped[bool] = mapped_column(Boolean, nullable=False, server_default="false")
    feedback_mode: Mapped[QuizFeedbackMode] = mapped_column(
        quiz_feedback_mode_pg, nullable=False, server_default="on_submit"
    )
    pass_threshold_percent: Mapped[Decimal | None] = mapped_column(Numeric(5, 2))
    created_at: Mapped[created_at]
    updated_at: Mapped[updated_at]
