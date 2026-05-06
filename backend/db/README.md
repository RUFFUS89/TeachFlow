# backend/db — Snapshots do schema Supabase

Esta pasta versiona o estado do schema vivo no Supabase pra que qualquer dev/agente consiga reproduzir o ambiente sem depender do Studio.

## Arquivos

- `schema.sql` — dump schema-only dos schemas `public` e `storage`. Inclui types, tabelas, views, indexes, RLS policies, triggers, funções, FKs.

## Quando atualizar

A regra é: **mudanças de schema sempre via Alembic** (`alembic revision --autogenerate -m "..."`). O dump aqui é foto periódica pra (a) revisão de código vendo o estado atual e (b) bootstrap em ambiente novo.

Atualize após:
- Cada migration aplicada (commit no mesmo PR).
- Mudança feita "manualmente" no Supabase Studio (e a gente quer espelhar — evitar, mas acontece).

## Como regenerar o snapshot

Pré-requisito: PostgreSQL 17 client tools instalados (`pg_dump`).

No Windows (PowerShell):

```powershell
$pgBin = "C:\Program Files\PostgreSQL\17\bin"
$env:PGPASSWORD = "<senha do banco>"
$dburl = "postgresql://postgres.<ref>@aws-1-sa-east-1.pooler.supabase.com:5432/postgres?sslmode=require"
& "$pgBin\pg_dump.exe" --schema-only --no-owner --no-privileges `
  --schema=public --schema=storage `
  --file="backend\db\schema.sql" $dburl
```

Substituindo `<ref>` pelo project ref do Supabase e `<senha>` pela senha do Session pooler. A senha não vai pra connection string — vai por env var `PGPASSWORD` pra evitar URL-encoding.

## Por que não usar `supabase db dump`?

A CLI do Supabase (`pnpm dlx supabase db dump`) requer Docker em execução porque faz pg_dump de dentro de um container. Em máquinas sem Docker, pg_dump nativo é mais simples.
