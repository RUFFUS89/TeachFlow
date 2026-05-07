"""Modelos de curso — alinhado com 01_schema_v2.sql."""

from datetime import datetime
from enum import StrEnum
from uuid import UUID

from sqlalchemy import (
    CheckConstraint,
    DateTime,
    ForeignKey,
    Integer,
    String,
    Text,
    func,
)
from sqlalchemy import (
    Enum as SAEnum,
)
from sqlalchemy.dialects.postgresql import UUID as PgUUID  # noqa: N811
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, created_at, updated_at, uuid_pk


class CourseStatus(StrEnum):
    DRAFT = "draft"
    ACTIVE = "active"
    ARCHIVED = "archived"


class CourseItemKind(StrEnum):
    LESSON = "lesson"
    ASSIGNMENT = "assignment"


course_status_pg = SAEnum(
    CourseStatus,
    name="course_status",
    create_type=False,
    values_callable=lambda x: [m.value for m in x],
)

course_item_kind_pg = SAEnum(
    CourseItemKind,
    name="course_item_kind",
    create_type=False,
    values_callable=lambda x: [m.value for m in x],
)


class Course(Base):
    __tablename__ = "courses"

    id: Mapped[uuid_pk]
    branch_id: Mapped[UUID] = mapped_column(
        PgUUID(as_uuid=True), ForeignKey("branches.id", ondelete="CASCADE"), nullable=False
    )
    author_id: Mapped[UUID] = mapped_column(
        PgUUID(as_uuid=True), ForeignKey("profiles.id"), nullable=False
    )
    title: Mapped[str] = mapped_column(String, nullable=False)
    description: Mapped[str | None] = mapped_column(Text)
    cover_url: Mapped[str | None] = mapped_column(String)
    color_tone: Mapped[str | None] = mapped_column(String)
    status: Mapped[CourseStatus] = mapped_column(
        course_status_pg, nullable=False, server_default="draft"
    )
    created_at: Mapped[created_at]
    updated_at: Mapped[updated_at]

    modules: Mapped[list["CourseModule"]] = relationship(
        back_populates="course",
        cascade="all, delete-orphan",
        order_by="CourseModule.position",
    )
    items: Mapped[list["CourseItem"]] = relationship(
        back_populates="course",
        cascade="all, delete-orphan",
        order_by="CourseItem.position",
    )
    enrollments: Mapped[list["CourseEnrollment"]] = relationship(
        back_populates="course",
        cascade="all, delete-orphan",
    )


class CourseModule(Base):
    __tablename__ = "course_modules"

    id: Mapped[uuid_pk]
    course_id: Mapped[UUID] = mapped_column(
        PgUUID(as_uuid=True), ForeignKey("courses.id", ondelete="CASCADE"), nullable=False
    )
    name: Mapped[str] = mapped_column(String, nullable=False)
    position: Mapped[int] = mapped_column(Integer, nullable=False)
    created_at: Mapped[created_at]

    course: Mapped["Course"] = relationship(back_populates="modules")


class CourseItem(Base):
    """Item da sequência do curso (aula ou atividade).

    A constraint CHECK garante que lesson_id ou assignment_id esteja preenchido
    de acordo com o kind — espelhando a constraint do schema SQL.
    """

    __tablename__ = "course_items"
    __table_args__ = (
        CheckConstraint(
            "(kind = 'lesson' AND lesson_id IS NOT NULL AND assignment_id IS NULL)"
            " OR (kind = 'assignment' AND assignment_id IS NOT NULL AND lesson_id IS NULL)",
            name="course_item_kind_check",
        ),
    )

    id: Mapped[uuid_pk]
    course_id: Mapped[UUID] = mapped_column(
        PgUUID(as_uuid=True), ForeignKey("courses.id", ondelete="CASCADE"), nullable=False
    )
    module_id: Mapped[UUID | None] = mapped_column(
        PgUUID(as_uuid=True), ForeignKey("course_modules.id", ondelete="SET NULL")
    )
    position: Mapped[int] = mapped_column(Integer, nullable=False)
    kind: Mapped[CourseItemKind] = mapped_column(course_item_kind_pg, nullable=False)
    # FKs para lesson/assignment adicionadas em Fase 3/5 — por ora UUID simples
    lesson_id: Mapped[UUID | None] = mapped_column(PgUUID(as_uuid=True))
    assignment_id: Mapped[UUID | None] = mapped_column(PgUUID(as_uuid=True))
    created_at: Mapped[created_at]
    updated_at: Mapped[updated_at]

    course: Mapped["Course"] = relationship(back_populates="items")


class CourseEnrollment(Base):
    __tablename__ = "course_enrollments"

    id: Mapped[uuid_pk]
    course_id: Mapped[UUID] = mapped_column(
        PgUUID(as_uuid=True), ForeignKey("courses.id", ondelete="CASCADE"), nullable=False
    )
    student_profile_id: Mapped[UUID] = mapped_column(
        PgUUID(as_uuid=True), ForeignKey("profiles.id", ondelete="CASCADE"), nullable=False
    )
    enrolled_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    completed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))

    course: Mapped["Course"] = relationship(back_populates="enrollments")
