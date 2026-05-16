"""Modelo de convites por código — Fase 7."""

from datetime import datetime
from uuid import UUID

from sqlalchemy import DateTime, ForeignKey, Integer, String
from sqlalchemy.dialects.postgresql import UUID as PgUUID  # noqa: N811
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base, created_at, uuid_pk
from app.models.identity import BranchRole, branch_role_pg


class InviteCode(Base):
    """Código de convite gerado por OWNER para adicionar membros à filial.

    Formato do código: "TF-XXXX-XXXX" (8 chars alfanuméricos sem ambiguidade).
    Ativo enquanto: not revoked_at AND expires_at > now() AND used_count < max_uses.
    """

    __tablename__ = "invite_codes"

    id: Mapped[uuid_pk]
    branch_id: Mapped[UUID] = mapped_column(
        PgUUID(as_uuid=True),
        ForeignKey("branches.id", ondelete="CASCADE"),
        nullable=False,
    )
    role: Mapped[BranchRole] = mapped_column(branch_role_pg, nullable=False)
    code: Mapped[str] = mapped_column(String(20), unique=True, nullable=False)
    created_by: Mapped[UUID] = mapped_column(
        PgUUID(as_uuid=True),
        ForeignKey("profiles.id", ondelete="SET NULL"),
        nullable=False,
    )
    expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    max_uses: Mapped[int] = mapped_column(Integer, nullable=False, server_default="1")
    used_count: Mapped[int] = mapped_column(Integer, nullable=False, server_default="0")
    revoked_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    created_at: Mapped[created_at]
