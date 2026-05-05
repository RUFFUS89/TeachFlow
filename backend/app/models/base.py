"""Base do SQLAlchemy + tipos compartilhados."""

from datetime import datetime
from typing import Annotated
from uuid import UUID

from sqlalchemy import DateTime, MetaData, func
from sqlalchemy.dialects.postgresql import UUID as PgUUID
from sqlalchemy.orm import DeclarativeBase, mapped_column

# Naming convention pro Alembic gerar nomes determinísticos de constraint
NAMING_CONVENTION = {
    "ix": "ix_%(column_0_label)s",
    "uq": "uq_%(table_name)s_%(column_0_name)s",
    "ck": "ck_%(table_name)s_%(constraint_name)s",
    "fk": "fk_%(table_name)s_%(column_0_name)s_%(referred_table_name)s",
    "pk": "pk_%(table_name)s",
}


class Base(DeclarativeBase):
    metadata = MetaData(naming_convention=NAMING_CONVENTION)


# Tipos reutilizáveis ----------------------------------------------------------

uuid_pk = Annotated[
    UUID,
    mapped_column(PgUUID(as_uuid=True), primary_key=True, server_default=func.gen_random_uuid()),
]

uuid_fk = Annotated[UUID, mapped_column(PgUUID(as_uuid=True))]

created_at = Annotated[
    datetime,
    mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False),
]

updated_at = Annotated[
    datetime,
    mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    ),
]
