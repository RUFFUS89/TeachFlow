"""Reúne todos os modelos para o Alembic descobrir.

Conforme adicionar novos arquivos em app/models/, importe-os aqui.
"""

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

__all__ = [
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
    "MemberStatus",
    "Profile",
    "TutorContact",
    "TutorRelationshipType",
]
