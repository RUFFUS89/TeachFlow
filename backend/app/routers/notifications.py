"""Endpoints de notificações do usuário."""

from datetime import UTC, datetime
from uuid import UUID

from fastapi import APIRouter, status
from sqlalchemy import select

from app.auth.dependencies import CurrentProfile, DbSession
from app.models.grade import Notification
from app.schemas.feed import NotificationRead

router = APIRouter(prefix="/notifications", tags=["notifications"])


@router.get("/", response_model=list[NotificationRead])
async def list_notifications(
    profile: CurrentProfile,
    db: DbSession,
) -> list[NotificationRead]:
    """Lista as últimas 50 notificações do usuário logado."""
    q = await db.execute(
        select(Notification)
        .where(Notification.recipient_profile_id == profile.id)
        .order_by(Notification.created_at.desc())
        .limit(50)
    )
    notifs = list(q.scalars().all())
    return [
        NotificationRead(
            id=n.id,
            type=n.type,
            title=n.title,
            body=n.body,
            link=n.link,
            read_at=n.read_at,
            created_at=n.created_at,
        )
        for n in notifs
    ]


@router.post("/{notification_id}/read", status_code=status.HTTP_204_NO_CONTENT)
async def mark_read(
    notification_id: UUID,
    profile: CurrentProfile,
    db: DbSession,
) -> None:
    """Marca uma notificação como lida."""
    notif = await db.get(Notification, notification_id)
    if notif and notif.recipient_profile_id == profile.id and notif.read_at is None:
        notif.read_at = datetime.now(UTC)
        await db.commit()


@router.post("/read-all", status_code=status.HTTP_204_NO_CONTENT)
async def mark_all_read(
    profile: CurrentProfile,
    db: DbSession,
) -> None:
    """Marca todas as notificações não lidas como lidas."""
    q = await db.execute(
        select(Notification).where(
            Notification.recipient_profile_id == profile.id,
            Notification.read_at.is_(None),
        )
    )
    now = datetime.now(UTC)
    for notif in q.scalars().all():
        notif.read_at = now
    await db.commit()
