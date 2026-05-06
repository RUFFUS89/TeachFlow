"""Configuração do Alembic — usa DATABASE_URL do .env e os modelos do app."""

from logging.config import fileConfig

from alembic import context
from sqlalchemy import engine_from_config, pool

from app.config import get_settings

# Importa todos os modelos pra que o autogenerate enxergue
from app.models import Base  # noqa: F401

config = context.config

# URL vem do .env, não do alembic.ini.
# Alembic usa driver síncrono — força "postgresql+psycopg" pra usar psycopg v3
# (o app tem psycopg[binary], não psycopg2; sem o prefixo, SQLAlchemy procura psycopg2).
settings = get_settings()
sync_url = settings.DATABASE_URL
if sync_url.startswith("postgresql://"):
    sync_url = sync_url.replace("postgresql://", "postgresql+psycopg://", 1)
config.set_main_option("sqlalchemy.url", sync_url)

if config.config_file_name is not None:
    fileConfig(config.config_file_name)

target_metadata = Base.metadata

# auth e storage do Supabase ficam fora do nosso controle — não inclua no autogenerate
EXCLUDED_SCHEMAS = {"auth", "storage", "graphql", "graphql_public", "extensions",
                    "net", "pgsodium", "pgsodium_masks", "realtime", "supabase_functions",
                    "vault"}


def include_object(object, name, type_, reflected, compare_to):
    if type_ == "table" and getattr(object, "schema", None) in EXCLUDED_SCHEMAS:
        return False
    return True


def run_migrations_offline() -> None:
    context.configure(
        url=config.get_main_option("sqlalchemy.url"),
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
        include_object=include_object,
        compare_type=True,
    )
    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online() -> None:
    connectable = engine_from_config(
        config.get_section(config.config_ini_section, {}),
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )

    with connectable.connect() as connection:
        context.configure(
            connection=connection,
            target_metadata=target_metadata,
            include_object=include_object,
            compare_type=True,
        )
        with context.begin_transaction():
            context.run_migrations()


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
