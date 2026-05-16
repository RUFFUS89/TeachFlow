"""Modelos de quiz — questões, opções e critérios de avaliação."""

from decimal import Decimal
from enum import StrEnum
from uuid import UUID

from sqlalchemy import Boolean, ForeignKey, Integer, Numeric, String, Text
from sqlalchemy import Enum as SAEnum
from sqlalchemy.dialects.postgresql import UUID as PgUUID  # noqa: N811
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base, created_at, updated_at, uuid_pk


class QuestionType(StrEnum):
    MULTIPLE_CHOICE = "multiple_choice"
    TRUE_FALSE = "true_false"
    SHORT_TEXT = "short_text"
    LONG_TEXT = "long_text"


question_type_pg = SAEnum(
    QuestionType,
    name="question_type",
    create_type=False,
    values_callable=lambda x: [m.value for m in x],
)


class QuizQuestion(Base):
    __tablename__ = "quiz_questions"

    id: Mapped[uuid_pk]
    assignment_id: Mapped[UUID] = mapped_column(
        PgUUID(as_uuid=True), ForeignKey("assignments.id", ondelete="CASCADE"), nullable=False
    )
    prompt: Mapped[str] = mapped_column(Text, nullable=False)
    hint: Mapped[str | None] = mapped_column(Text)
    type: Mapped[QuestionType] = mapped_column(question_type_pg, nullable=False)
    points: Mapped[Decimal] = mapped_column(Numeric(6, 2), nullable=False, server_default="1")
    position: Mapped[int] = mapped_column(Integer, nullable=False)
    created_at: Mapped[created_at]
    updated_at: Mapped[updated_at]


class QuizOption(Base):
    __tablename__ = "quiz_options"

    id: Mapped[uuid_pk]
    question_id: Mapped[UUID] = mapped_column(
        PgUUID(as_uuid=True), ForeignKey("quiz_questions.id", ondelete="CASCADE"), nullable=False
    )
    content: Mapped[str] = mapped_column(Text, nullable=False)
    is_correct: Mapped[bool] = mapped_column(Boolean, nullable=False, server_default="false")
    position: Mapped[int] = mapped_column(Integer, nullable=False)
    created_at: Mapped[created_at]


class AssignmentCriterion(Base):
    __tablename__ = "assignment_criteria"

    id: Mapped[uuid_pk]
    assignment_id: Mapped[UUID] = mapped_column(
        PgUUID(as_uuid=True), ForeignKey("assignments.id", ondelete="CASCADE"), nullable=False
    )
    name: Mapped[str] = mapped_column(String, nullable=False)
    description: Mapped[str | None] = mapped_column(Text)
    max_score: Mapped[Decimal] = mapped_column(Numeric(6, 2), nullable=False)
    position: Mapped[int] = mapped_column(Integer, nullable=False)
    created_at: Mapped[created_at]
