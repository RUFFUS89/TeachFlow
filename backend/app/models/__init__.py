"""Reúne todos os modelos para o Alembic descobrir.

Conforme adicionar novos arquivos em app/models/, importe-os aqui.
"""

from app.models.assignment import Assignment, AssignmentType, QuizFeedbackMode
from app.models.base import Base
from app.models.course import (
    Course,
    CourseEnrollment,
    CourseItem,
    CourseItemKind,
    CourseModule,
    CourseStatus,
)
from app.models.identity import (
    Branch,
    BranchMember,
    BranchRole,
    MemberStatus,
    Profile,
    TutorContact,
    TutorRelationshipType,
)
from app.models.lesson import (
    ItemProgress,
    ItemProgressStatus,
    Lesson,
    LessonAttachment,
    LessonComment,
    LessonFavorite,
    VideoProvider,
)
from app.models.quiz import AssignmentCriterion, QuestionType, QuizOption, QuizQuestion
from app.models.submission import QuizResponse, Submission, SubmissionStatus

__all__ = [
    "Assignment",
    "AssignmentCriterion",
    "AssignmentType",
    "Base",
    "Branch",
    "BranchMember",
    "BranchRole",
    "Course",
    "CourseEnrollment",
    "CourseItem",
    "CourseItemKind",
    "CourseModule",
    "CourseStatus",
    "ItemProgress",
    "ItemProgressStatus",
    "Lesson",
    "LessonAttachment",
    "LessonComment",
    "LessonFavorite",
    "MemberStatus",
    "Profile",
    "QuestionType",
    "QuizFeedbackMode",
    "QuizOption",
    "QuizQuestion",
    "QuizResponse",
    "Submission",
    "SubmissionStatus",
    "TutorContact",
    "TutorRelationshipType",
    "VideoProvider",
]
