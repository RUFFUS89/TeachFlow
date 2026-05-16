"""Schemas Pydantic — painel de correção (Fase 6)."""

from datetime import datetime
from decimal import Decimal
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field

from app.models.submission import SubmissionStatus

# =============================================================================
# Notificação (mínima — usada na resposta do grade)
# =============================================================================


class NotificationRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    recipient_profile_id: UUID
    type: str
    title: str
    body: str | None = None
    link: str | None = None
    read_at: datetime | None = None
    created_at: datetime


# =============================================================================
# Grade (nota lançada)
# =============================================================================


class GradeRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    assignment_id: UUID
    student_profile_id: UUID
    submission_id: UUID | None = None
    score: Decimal
    feedback: str | None = None
    graded_by: UUID
    graded_at: datetime
    released_at: datetime | None = None
    created_at: datetime
    updated_at: datetime


class GradeInput(BaseModel):
    score: Decimal = Field(ge=0)
    feedback: str | None = None
    release: bool = True


# =============================================================================
# Critérios de rubrica
# =============================================================================


class CriterionScoreRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    submission_id: UUID
    criterion_id: UUID
    criterion_name: str = ""
    max_score: Decimal = Decimal("0")
    score: Decimal
    feedback: str | None = None
    updated_at: datetime


class CriterionScoreInput(BaseModel):
    criterion_id: UUID
    score: Decimal = Field(ge=0)
    feedback: str | None = None


class SaveCriteriaPayload(BaseModel):
    scores: list[CriterionScoreInput]


# =============================================================================
# Attachment de submissão
# =============================================================================


class SubmissionAttachmentRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    submission_id: UUID
    name: str
    storage_path: str
    mime_type: str | None = None
    size_bytes: int | None = None
    created_at: datetime


# =============================================================================
# List item (tabela de submissões)
# =============================================================================


class SubmissionListItem(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    assignment_id: UUID
    assignment_title: str = ""
    assignment_type: str = ""
    course_id: UUID | None = None
    course_title: str = ""
    student_profile_id: UUID
    student_name: str = ""
    attempt: int
    status: SubmissionStatus
    submitted_at: datetime | None = None
    score: Decimal | None = None
    is_late: bool = False
    created_at: datetime


# =============================================================================
# Detail (drawer de correção)
# =============================================================================


class SubmissionDetail(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    assignment_id: UUID
    assignment_title: str = ""
    assignment_type: str = ""
    course_title: str = ""
    student_profile_id: UUID
    student_name: str = ""
    attempt: int
    content: str | None = None
    status: SubmissionStatus
    submitted_at: datetime | None = None
    score: Decimal | None = None
    is_late: bool = False
    created_at: datetime
    updated_at: datetime
    grade: GradeRead | None = None
    criterion_scores: list[CriterionScoreRead] = []
    attachments: list[SubmissionAttachmentRead] = []


# =============================================================================
# Summary (4 contadores)
# =============================================================================


class SubmissionsSummary(BaseModel):
    total: int
    pending: int
    graded: int
    late: int
