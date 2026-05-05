"""Schemas Pydantic — request/response de identity."""

from datetime import date, datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, EmailStr, Field

from app.models.identity import BranchRole, MemberStatus, TutorRelationshipType


# Profile ---------------------------------------------------------------------


class ProfileRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    full_name: str
    avatar_url: str | None = None
    phone: str | None = None
    birth_date: date | None = None
    created_at: datetime
    updated_at: datetime


class ProfileUpdate(BaseModel):
    full_name: str | None = Field(default=None, min_length=1, max_length=200)
    avatar_url: str | None = None
    phone: str | None = None
    birth_date: date | None = None


# Branch ----------------------------------------------------------------------


class BranchRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    name: str
    slug: str
    cnpj: str | None = None
    address_line: str | None = None
    city: str | None = None
    state: str | None = None
    postal_code: str | None = None
    logo_url: str | None = None
    status: str
    created_at: datetime
    updated_at: datetime


class BranchCreate(BaseModel):
    """Cria a filial e torna o solicitante owner dela."""

    name: str = Field(min_length=1, max_length=200)
    slug: str = Field(min_length=2, max_length=64, pattern=r"^[a-z0-9-]+$")
    cnpj: str | None = None
    address_line: str | None = None
    city: str | None = None
    state: str | None = Field(default=None, max_length=2)
    postal_code: str | None = None
    logo_url: str | None = None


class BranchUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=200)
    slug: str | None = Field(default=None, min_length=2, max_length=64, pattern=r"^[a-z0-9-]+$")
    cnpj: str | None = None
    address_line: str | None = None
    city: str | None = None
    state: str | None = Field(default=None, max_length=2)
    postal_code: str | None = None
    logo_url: str | None = None
    status: str | None = None


# BranchMember ----------------------------------------------------------------


class BranchMemberRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    branch_id: UUID
    profile_id: UUID
    role: BranchRole
    status: MemberStatus
    created_at: datetime


class BranchMemberCreate(BaseModel):
    profile_id: UUID
    role: BranchRole
    status: MemberStatus = MemberStatus.ACTIVE


class BranchMemberUpdate(BaseModel):
    role: BranchRole | None = None
    status: MemberStatus | None = None


# Tutor contact ---------------------------------------------------------------


class TutorContactRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    student_profile_id: UUID
    full_name: str
    relationship_type: TutorRelationshipType
    phone: str | None = None
    email: str | None = None
    is_primary: bool
    notes: str | None = None
    created_at: datetime
    updated_at: datetime


class TutorContactCreate(BaseModel):
    full_name: str = Field(min_length=1, max_length=200)
    relationship_type: TutorRelationshipType
    phone: str | None = None
    email: EmailStr | None = None
    is_primary: bool = False
    notes: str | None = None


class TutorContactUpdate(BaseModel):
    full_name: str | None = Field(default=None, min_length=1, max_length=200)
    relationship_type: TutorRelationshipType | None = None
    phone: str | None = None
    email: EmailStr | None = None
    is_primary: bool | None = None
    notes: str | None = None


# Me (vista combinada do usuário logado) --------------------------------------


class BranchMembership(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    branch_id: UUID
    role: BranchRole
    status: MemberStatus


class MeRead(BaseModel):
    profile: ProfileRead
    memberships: list[BranchMembership]
