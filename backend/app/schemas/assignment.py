"""Schemas Pydantic — assignments, quiz, submissions."""

from datetime import datetime
from decimal import Decimal
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field

from app.models.assignment import AssignmentType, QuizFeedbackMode
from app.models.quiz import QuestionType
from app.models.submission import SubmissionStatus

# =============================================================================
# Assignment
# =============================================================================


class AssignmentRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    course_id: UUID
    author_id: UUID
    title: str
    instructions: str | None = None
    type: AssignmentType
    max_score: Decimal
    weight: Decimal
    due_date: datetime | None = None
    available_from: datetime | None = None
    published_at: datetime | None = None
    allow_late_submission: bool
    max_attempts: int | None = None
    time_limit_minutes: int | None = None
    shuffle_questions: bool
    feedback_mode: QuizFeedbackMode
    pass_threshold_percent: Decimal | None = None
    created_at: datetime
    updated_at: datetime


class AssignmentCreate(BaseModel):
    course_id: UUID
    title: str = Field(min_length=1, max_length=300)
    instructions: str | None = None
    type: AssignmentType = AssignmentType.TASK
    max_score: Decimal = Decimal("10")
    weight: Decimal = Decimal("1.0")
    due_date: datetime | None = None
    available_from: datetime | None = None
    allow_late_submission: bool = False
    max_attempts: int | None = None
    time_limit_minutes: int | None = None
    shuffle_questions: bool = False
    feedback_mode: QuizFeedbackMode = QuizFeedbackMode.ON_SUBMIT
    pass_threshold_percent: Decimal | None = None


class AssignmentUpdate(BaseModel):
    title: str | None = Field(default=None, min_length=1, max_length=300)
    instructions: str | None = None
    type: AssignmentType | None = None
    max_score: Decimal | None = None
    weight: Decimal | None = None
    due_date: datetime | None = None
    available_from: datetime | None = None
    published_at: datetime | None = None
    allow_late_submission: bool | None = None
    max_attempts: int | None = None
    time_limit_minutes: int | None = None
    shuffle_questions: bool | None = None
    feedback_mode: QuizFeedbackMode | None = None
    pass_threshold_percent: Decimal | None = None


# =============================================================================
# Quiz Questions & Options
# =============================================================================


class QuizOptionRead(BaseModel):
    """Opção com is_correct — apenas para staff."""

    id: UUID
    question_id: UUID
    content: str
    is_correct: bool
    position: int


class QuizOptionStudentRead(BaseModel):
    """Opção sem is_correct — para alunos."""

    id: UUID
    question_id: UUID
    content: str
    position: int


class QuizOptionCreate(BaseModel):
    content: str = Field(min_length=1)
    is_correct: bool = False
    position: int = 1


class QuizOptionUpdate(BaseModel):
    content: str | None = Field(default=None, min_length=1)
    is_correct: bool | None = None
    position: int | None = None


class QuizQuestionRead(BaseModel):
    """Questão com opções completas — apenas para staff."""

    id: UUID
    assignment_id: UUID
    prompt: str
    hint: str | None = None
    type: QuestionType
    points: Decimal
    position: int
    options: list[QuizOptionRead] = []
    created_at: datetime
    updated_at: datetime


class QuizQuestionStudentRead(BaseModel):
    """Questão sem is_correct nas opções — para alunos."""

    id: UUID
    prompt: str
    hint: str | None = None
    type: QuestionType
    points: Decimal
    position: int
    options: list[QuizOptionStudentRead] = []


class QuizQuestionCreate(BaseModel):
    prompt: str = Field(min_length=1)
    hint: str | None = None
    type: QuestionType = QuestionType.MULTIPLE_CHOICE
    points: Decimal = Decimal("1")
    position: int | None = None


class QuizQuestionUpdate(BaseModel):
    prompt: str | None = Field(default=None, min_length=1)
    hint: str | None = None
    type: QuestionType | None = None
    points: Decimal | None = None
    position: int | None = None


# =============================================================================
# Assignment Criteria
# =============================================================================


class AssignmentCriterionRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    assignment_id: UUID
    name: str
    description: str | None = None
    max_score: Decimal
    position: int


class AssignmentCriterionCreate(BaseModel):
    name: str = Field(min_length=1, max_length=200)
    description: str | None = None
    max_score: Decimal


# =============================================================================
# Submissions
# =============================================================================


class SubmissionRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    assignment_id: UUID
    student_profile_id: UUID
    attempt: int
    content: str | None = None
    status: SubmissionStatus
    submitted_at: datetime | None = None
    score: Decimal | None = None
    created_at: datetime
    updated_at: datetime


class AnswerInput(BaseModel):
    question_id: UUID
    selected_option_id: UUID | None = None
    text_answer: str | None = None


class SubmitAnswersPayload(BaseModel):
    answers: list[AnswerInput]
    finalize: bool = False


# =============================================================================
# Play response (student)
# =============================================================================


class AssignmentPlayResponse(BaseModel):
    assignment: AssignmentRead
    questions: list[QuizQuestionStudentRead]
    submission: SubmissionRead | None = None
