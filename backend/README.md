# TeachFlow — Backend

API em FastAPI que conversa com o Supabase (Postgres + Auth + Storage).

## Stack

- **FastAPI** — framework web
- **SQLAlchemy 2.0 (async)** + **psycopg 3** — ORM e driver
- **Alembic** — migrations
- **Pydantic v2** — validação
- **PyJWT** — verificação de tokens do Supabase Auth
- **uv** — gerenciador de pacotes

## Setup

### 1. Aplique o schema SQL no Supabase

Antes de rodar a API, aplique no SQL Editor do Supabase (ou via `supabase db push`):

1. `01_schema_v2.sql` — todas as tabelas + RLS
2. `02_storage_buckets_v2.sql` — buckets de Storage

### 2. Configure o ambiente

```bash
# Instala uv (uma vez)
curl -LsSf https://astral.sh/uv/install.sh | sh

# Cria o virtualenv e instala deps
uv sync

# Copia e edita .env com suas chaves do Supabase
cp .env.example .env
```

Pegue as chaves no painel do Supabase:
- `DATABASE_URL` — Project Settings → Database → Connection string (use **Session pooler**)
- `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` — Project Settings → API
- `SUPABASE_JWT_SECRET` — Project Settings → API → JWT Settings

### 3. Marque o estado atual no Alembic

```bash
uv run alembic revision -m "baseline" --rev-id baseline
# Edite o arquivo gerado deixando upgrade()/downgrade() vazias (pass)
uv run alembic stamp baseline
```

### 4. Rode

```bash
uv run fastapi dev app/main.py
```

API sobe em `http://localhost:8000`. Docs interativo em `/docs`.

## Endpoints (v0.2)

| Método | Rota | Descrição |
|---|---|---|
| GET | `/health` | Healthcheck simples |
| GET | `/health/db` | Confirma que o banco responde |
| GET | `/api/v1/me/` | Perfil + filiais do usuário logado |
| PATCH | `/api/v1/me/` | Atualiza o próprio perfil |
| GET | `/api/v1/branches/` | Filiais do usuário |
| POST | `/api/v1/branches/` | Cria filial (criador vira OWNER) |
| GET | `/api/v1/branches/{id}` | Detalhes de uma filial |
| PATCH | `/api/v1/branches/{id}` | Edita filial (só OWNER) |

Mais endpoints (cursos, aulas, atividades, entregas, notas) virão em fatias verticais conforme o frontend for sendo construído.

## Estrutura

```
app/
├── main.py
├── config.py              # Settings via pydantic-settings
├── database.py            # Engine async + dependency get_db
├── auth/
│   ├── jwt.py             # Decode + valida JWT do Supabase
│   └── dependencies.py    # CurrentProfile, CurrentUserId, DbSession
├── core/
│   ├── exceptions.py
│   └── permissions.py     # has_branch_role, is_branch_staff, require_*
├── models/
│   ├── base.py
│   └── identity.py        # Profile, Branch, BranchMember, TutorContact
├── schemas/
│   └── identity.py
└── routers/
    ├── health.py
    ├── me.py
    └── branches.py
```

## Permissões

**Importante:** o backend conecta no Postgres como o usuário `postgres`, que **bypassa RLS**. Ou seja: a primeira linha de defesa é o código Python (`app/core/permissions.py`), não a RLS. A RLS continua ativa no banco como rede de segurança contra clientes que falam direto com o Supabase via SDK.

Toda rota que lida com dados de usuários DEVE chamar `require_branch_*` antes de retornar/modificar coisas.

Helpers disponíveis:

- `require_branch_member` — qualquer papel ativo (owner, admin, usuario)
- `require_branch_staff` — apenas owner ou admin
- `require_branch_owner` — apenas owner

## Como adicionar novos recursos

Para "cursos", por exemplo:

1. Crie `app/models/course.py` seguindo o padrão de `identity.py`
2. Importe os novos modelos em `app/models/__init__.py`
3. Crie `app/schemas/course.py`
4. Crie `app/routers/courses.py` chamando `require_branch_*` nas mutações
5. Inclua em `app/main.py`: `app.include_router(courses.router, prefix="/api/v1")`
6. Se mudou o schema do banco: `uv run alembic revision --autogenerate -m "add courses"`

## Lint e format

```bash
uv run ruff check --fix
uv run ruff format
uv run mypy app
```
