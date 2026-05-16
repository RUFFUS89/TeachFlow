"""Modelos de submissão e respostas de quiz."""

from datetime import datetime
from decimal import Decimal
from enum import StrEnum
from uuid import UUID

from sqlalchemy import DateTime, ForeignKey, Numeric, Text
from sqlalchemy import Enum as SAEnum
from sqlalchemy.dialects.postgresql import UUID as PgUUID  # noqa: N811
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base, created_at, updated_at, uuid_pk


class SubmissionStatus(StrEnum):
    DRAFT = "draft"
    SUBMITTED = "submitted"
    LATE = "late"
    RETURNED = "returned"
    GRADED = "graded"


submission_status_pg = SAEnum(
    SubmissionStatus,
    name="submission_status",
    create_type=False,
    values_callable=lambda x: [m.value for m in x],
)


class Submission(Base):
    __tablename__ = "submissions"

    id: Mapped[uuid_pk]
    assignment_id: Mapped[UUID] = mapped_column(
        PgUUID(as_uuid=True), ForeignKey("assignments.id", ondelete="CASCADE"), nullable=False
    )
    student_profile_id: Mapped[UUID] = mapped_column(
        PgUUID(as_uuid=True), ForeignKey("profiles.id", ondelete="CASCADE"), nullable=False
    )
    attempt: Mapped[int] = mapped_column(nullable=False, server_default="1")
    content: Mapped[str | None] = mapped_column(Text)
    status: Mapped[SubmissionStatus] = mapped_column(
        submission_status_pg, nullable=False, server_default="draft"
    )
    submitted_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    score: Mapped[Decimal | None] = mapped_column(Numeric(6, 2))
    created_at: Mapped[created_at]
    updated_at: Mapped[updated_at]


class QuizResponse(Base):
    __tablename__ = "quiz_responses"

    id: Mapped[uuid_pk]
    submission_id: Mapped[UUID] = mapped_column(
        PgUUID(as_uuid=True), ForeignKey("submissions.id", ondelete="CASCADE"), nullable=False
    )
    question_id: Mapped[UUID] = mapped_column(
        PgUUID(as_uuid=True), ForeignKey("quiz_questions.id", ondelete="CASCADE"), nullable=False
    )
    selected_option_id: Mapped[UUID | None] = mapped_column(PgUUID(as_uuid=True))
    text_answer: Mapped[str | None] = mapped_column(Text)
    earned_points: Mapped[Decimal | None] = mapped_column(Numeric(6, 2))
    created_at: Mapped[created_at]
    updated_at: Mapped[updated_at]
