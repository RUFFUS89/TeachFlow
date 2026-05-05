"""Modelos de identidade — alinhado com 01_schema_v2.sql.

Inclui:
  - Profile           (extends auth.users)
  - Branch            (filial / instituição com CNPJ)
  - BranchMember      (vínculo profile × branch × role)
  - TutorContact      (responsável do aluno — sem login próprio)
"""

from datetime import date
from enum import Enum
from uuid import UUID

from sqlalchemy import (
    Boolean,
    CheckConstraint,
    Date,
    Enum as SAEnum,
    ForeignKey,
    String,
    UniqueConstraint,
)
from sqlalchemy.dialects.postgresql import UUID as PgUUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, created_at, updated_at, uuid_pk


# Enums (refletem os tipos do Postgres) ----------------------------------------


class BranchRole(str, Enum):
    OWNER = "owner"
    ADMIN = "admin"
    USUARIO = "usuario"


class MemberStatus(str, Enum):
    ACTIVE = "active"
    INACTIVE = "inactive"
    PENDING = "pending"


class TutorRelationshipType(str, Enum):
    MOTHER = "mother"
    FATHER = "father"
    STEPPARENT = "stepparent"
    GRANDPARENT = "grandparent"
    SIBLING = "sibling"
    LEGAL_GUARDIAN = "legal_guardian"
    OTHER = "other"


# create_type=False: o tipo já existe no banco, não tente recriar
branch_role_pg = SAEnum(
    BranchRole,
    name="branch_role",
    create_type=False,
    values_callable=lambda x: [m.value for m in x],
)
member_status_pg = SAEnum(
    MemberStatus,
    name="member_status",
    create_type=False,
    values_callable=lambda x: [m.value for m in x],
)
tutor_rel_pg = SAEnum(
    TutorRelationshipType,
    name="tutor_relationship_type",
    create_type=False,
    values_callable=lambda x: [m.value for m in x],
)


# Tabelas ---------------------------------------------------------------------


class Profile(Base):
    __tablename__ = "profiles"

    id: Mapped[UUID] = mapped_column(PgUUID(as_uuid=True), primary_key=True)
    full_name: Mapped[str] = mapped_column(String, nullable=False)
    avatar_url: Mapped[str | None] = mapped_column(String)
    phone: Mapped[str | None] = mapped_column(String)
    birth_date: Mapped[date | None] = mapped_column(Date)
    created_at: Mapped[created_at]
    updated_at: Mapped[updated_at]

    branch_memberships: Mapped[list["BranchMember"]] = relationship(
        back_populates="profile", cascade="all, delete-orphan"
    )
    tutor_contacts: Mapped[list["TutorContact"]] = relationship(
        back_populates="student", cascade="all, delete-orphan"
    )


class Branch(Base):
    __tablename__ = "branches"
    __table_args__ = (
        CheckConstraint(
            "cnpj is null or length(regexp_replace(cnpj, '\\D', '', 'g')) = 14",
            name="cnpj_length",
        ),
    )

    id: Mapped[uuid_pk]
    name: Mapped[str] = mapped_column(String, nullable=False)
    slug: Mapped[str] = mapped_column(String, unique=True, nullable=False)
    cnpj: Mapped[str | None] = mapped_column(String, unique=True)
    address_line: Mapped[str | None] = mapped_column(String)
    city: Mapped[str | None] = mapped_column(String)
    state: Mapped[str | None] = mapped_column(String)
    postal_code: Mapped[str | None] = mapped_column(String)
    logo_url: Mapped[str | None] = mapped_column(String)
    status: Mapped[str] = mapped_column(String, nullable=False, server_default="active")
    created_at: Mapped[created_at]
    updated_at: Mapped[updated_at]

    members: Mapped[list["BranchMember"]] = relationship(
        back_populates="branch", cascade="all, delete-orphan"
    )


class BranchMember(Base):
    __tablename__ = "branch_members"
    __table_args__ = (
        UniqueConstraint("branch_id", "profile_id", "role", name="uq_branch_members_role"),
    )

    id: Mapped[uuid_pk]
    branch_id: Mapped[UUID] = mapped_column(
        PgUUID(as_uuid=True), ForeignKey("branches.id", ondelete="CASCADE"), nullable=False
    )
    profile_id: Mapped[UUID] = mapped_column(
        PgUUID(as_uuid=True), ForeignKey("profiles.id", ondelete="CASCADE"), nullable=False
    )
    role: Mapped[BranchRole] = mapped_column(branch_role_pg, nullable=False)
    status: Mapped[MemberStatus] = mapped_column(
        member_status_pg, nullable=False, server_default="active"
    )
    created_at: Mapped[created_at]

    branch: Mapped["Branch"] = relationship(back_populates="members")
    profile: Mapped["Profile"] = relationship(back_populates="branch_memberships")


class TutorContact(Base):
    """Contato do responsável pelo aluno.

    O tutor NÃO tem login próprio — entra usando as credenciais do aluno.
    Esta tabela existe só pra registrar contatos de pais/responsáveis
    no perfil do aluno (nome, telefone, email, parentesco).
    """

    __tablename__ = "tutor_contacts"

    id: Mapped[uuid_pk]
    student_profile_id: Mapped[UUID] = mapped_column(
        PgUUID(as_uuid=True), ForeignKey("profiles.id", ondelete="CASCADE"), nullable=False
    )
    full_name: Mapped[str] = mapped_column(String, nullable=False)
    relationship_type: Mapped[TutorRelationshipType] = mapped_column(
        "relationship", tutor_rel_pg, nullable=False
    )
    phone: Mapped[str | None] = mapped_column(String)
    email: Mapped[str | None] = mapped_column(String)
    is_primary: Mapped[bool] = mapped_column(Boolean, nullable=False, server_default="false")
    notes: Mapped[str | None] = mapped_column(String)
    created_at: Mapped[created_at]
    updated_at: Mapped[updated_at]

    student: Mapped["Profile"] = relationship(back_populates="tutor_contacts")
