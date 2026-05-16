"""Entry point do FastAPI — TeachFlow API."""

import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import get_settings
from app.database import engine
from app.routers import branches, courses, dashboard, health, lessons, me

logger = logging.getLogger(__name__)
settings = get_settings()
logging.basicConfig(level=settings.LOG_LEVEL)


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("API iniciando — env=%s", settings.ENV)
    yield
    logger.info("API desligando — fechando conexões do banco")
    await engine.dispose()


app = FastAPI(
    title="TeachFlow API",
    version="0.2.0",
    description="API do TeachFlow",
    lifespan=lifespan,
    docs_url="/docs" if settings.is_dev else None,
    redoc_url="/redoc" if settings.is_dev else None,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health.router)
app.include_router(me.router, prefix="/api/v1")
app.include_router(branches.router, prefix="/api/v1")
app.include_router(courses.router, prefix="/api/v1")
app.include_router(dashboard.router, prefix="/api/v1")
app.include_router(lessons.router, prefix="/api/v1")


@app.get("/", include_in_schema=False)
async def root() -> dict[str, str]:
    return {"name": "TeachFlow API", "docs": "/docs"}
