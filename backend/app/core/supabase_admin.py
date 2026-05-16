"""Cliente Supabase com service_role — uso restrito a operações administrativas."""

from functools import lru_cache
from typing import Any

import httpx
from supabase import Client, create_client

from app.config import get_settings


@lru_cache
def get_supabase_admin() -> Client:
    settings = get_settings()
    return create_client(settings.SUPABASE_URL, settings.SUPABASE_SERVICE_ROLE_KEY)


async def create_auth_user(email: str, password: str, full_name: str) -> str:
    """Cria um usuário em auth.users via Admin API e retorna o user_id.

    Raises:
        httpx.HTTPStatusError: se a API retornar 4xx/5xx.
    """
    settings = get_settings()
    url = f"{settings.SUPABASE_URL}/auth/v1/admin/users"
    headers = {
        "Authorization": f"Bearer {settings.SUPABASE_SERVICE_ROLE_KEY}",
        "apikey": settings.SUPABASE_SERVICE_ROLE_KEY,
        "Content-Type": "application/json",
    }
    payload: dict[str, Any] = {
        "email": email,
        "password": password,
        "email_confirm": True,
        "user_metadata": {"full_name": full_name},
    }

    async with httpx.AsyncClient(timeout=15.0) as client:
        response = await client.post(url, json=payload, headers=headers)
        response.raise_for_status()
        data: dict[str, Any] = response.json()
        return str(data["id"])
