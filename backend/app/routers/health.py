"""Healthcheck — útil pro load balancer e pra debug."""

from typing import Annotated

from fastapi import APIRouter, Depends
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db

router = APIRouter(tags=["health"])


@router.get("/health")
async def health() -> dict[str, str]:
    return {"status": "ok"}


@router.get("/health/db")
async def health_db(db: Annotated[AsyncSession, Depends(get_db)]) -> dict[str, str]:
    """Confirma que o banco responde."""
    await db.execute(text("select 1"))
    return {"status": "ok", "db": "ok"}
