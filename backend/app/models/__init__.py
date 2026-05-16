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
from app.models.lesson import Lesson, VideoProvider

__all__ = [
    "Assignment",
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
    "Lesson",
    "MemberStatus",
    "Profile",
    "QuizFeedbackMode",
    "TutorContact",
    "TutorRelationshipType",
    "VideoProvider",
]
