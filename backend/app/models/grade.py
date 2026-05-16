"""Modelos de nota lançada, critérios, anexo de submissão e notificação."""

from datetime import datetime
from decimal import Decimal
from enum import StrEnum
from uuid import UUID

from sqlalchemy import DateTime, ForeignKey, Integer, Numeric, Text
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.dialects.postgresql import UUID as PgUUID  # noqa: N811
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base, created_at, updated_at, uuid_pk


class Grade(Base):
    """Nota lançada pelo professor. É a fonte da verdade; submissions.score é cache."""

    __tablename__ = "grades"

    id: Mapped[uuid_pk]
    assignment_id: Mapped[UUID] = mapped_column(
        PgUUID(as_uuid=True), ForeignKey("assignments.id", ondelete="CASCADE"), nullable=False
    )
    student_profile_id: Mapped[UUID] = mapped_column(
        PgUUID(as_uuid=True), ForeignKey("profiles.id", ondelete="CASCADE"), nullable=False
    )
    submission_id: Mapped[UUID | None] = mapped_column(
        PgUUID(as_uuid=True), ForeignKey("submissions.id", ondelete="SET NULL")
    )
    score: Mapped[Decimal] = mapped_column(Numeric(6, 2), nullable=False)
    feedback: Mapped[str | None] = mapped_column(Text)
    graded_by: Mapped[UUID] = mapped_column(
        PgUUID(as_uuid=True), ForeignKey("profiles.id", ondelete="SET NULL"), nullable=False
    )
    graded_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    # NULL = rascunho interno; not-null = nota publicada ao aluno
    released_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    created_at: Mapped[created_at]
    updated_at: Mapped[updated_at]


class SubmissionCriterionScore(Base):
    """Pontuação por critério de rubrica numa submissão."""

    __tablename__ = "submission_criterion_scores"

    id: Mapped[uuid_pk]
    submission_id: Mapped[UUID] = mapped_column(
        PgUUID(as_uuid=True), ForeignKey("submissions.id", ondelete="CASCADE"), nullable=False
    )
    criterion_id: Mapped[UUID] = mapped_column(
        PgUUID(as_uuid=True),
        ForeignKey("assignment_criteria.id", ondelete="CASCADE"),
        nullable=False,
    )
    score: Mapped[Decimal] = mapped_column(Numeric(6, 2), nullable=False, server_default="0")
    feedback: Mapped[str | None] = mapped_column(Text)
    created_at: Mapped[created_at]
    updated_at: Mapped[updated_at]


class SubmissionAttachment(Base):
    """Arquivo enviado pelo aluno junto com a submissão."""

    __tablename__ = "submission_attachments"

    id: Mapped[uuid_pk]
    submission_id: Mapped[UUID] = mapped_column(
        PgUUID(as_uuid=True), ForeignKey("submissions.id", ondelete="CASCADE"), nullable=False
    )
    name: Mapped[str]
    storage_path: Mapped[str]
    mime_type: Mapped[str | None]
    size_bytes: Mapped[int | None] = mapped_column(Integer)
    created_at: Mapped[created_at]


class NotificationType(StrEnum):
    GRADE_RELEASED = "grade_released"
    SUBMISSION_RECEIVED = "submission_received"
    ASSIGNMENT_DUE = "assignment_due"
    COURSE_ENROLLED = "course_enrolled"
    GENERAL = "general"


class Notification(Base):
    """Notificação enviada a um perfil."""

    __tablename__ = "notifications"

    id: Mapped[uuid_pk]
    recipient_profile_id: Mapped[UUID] = mapped_column(
        PgUUID(as_uuid=True), ForeignKey("profiles.id", ondelete="CASCADE"), nullable=False
    )
    branch_id: Mapped[UUID | None] = mapped_column(
        PgUUID(as_uuid=True), ForeignKey("branches.id", ondelete="CASCADE")
    )
    type: Mapped[str] = mapped_column(nullable=False, server_default="general")
    title: Mapped[str]
    body: Mapped[str | None] = mapped_column(Text)
    link: Mapped[str | None]
    metadata_: Mapped[dict | None] = mapped_column("metadata", JSONB)
    read_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    created_at: Mapped[created_at]
