# TeachFlow — Monorepo

Sistema de gestão escolar (cursos, aulas, atividades). Estrutura monorepo com Turborepo + pnpm workspaces.

## Estrutura

```
TeachFlow/
├── backend/                 # API FastAPI (Python) — autenticação, regras, dados
├── apps/
│   └── web/                 # Next.js 15 + Tailwind
├── packages/
│   ├── database/            # Tipos TypeScript do domínio
│   ├── api-client/          # Cliente HTTP tipado pro backend
│   └── config/              # tsconfig compartilhado
├── pnpm-workspace.yaml
├── turbo.json
└── package.json
```

## Stack

- **Frontend web**: Next.js 15 (App Router), React 19, Tailwind CSS, TypeScript
- **Backend**: FastAPI, SQLAlchemy 2.0 async, psycopg 3
- **Banco/Auth/Storage**: Supabase
- **Ferramentas**: pnpm, Turborepo, Prettier

Mobile (Expo + React Native) entra como `apps/mobile/` numa próxima fase.

## Setup inicial

### Pré-requisitos

- Node.js 20+ e pnpm 9+ (`pnpm -v` deve mostrar 9 ou superior)
- Backend já rodando localmente — veja [`backend/README.md`](./backend/README.md)

### Instalação

Na raiz do monorepo:

```bash
pnpm install
```

Isso instala dependências de **todos** os apps e packages num só comando.

### Variáveis de ambiente do web

```bash
cp apps/web/.env.local.example apps/web/.env.local
```

Edite `apps/web/.env.local` com suas chaves do Supabase:

- `NEXT_PUBLIC_SUPABASE_URL` — Project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` — chave **publishable** (segura no browser)
- `NEXT_PUBLIC_API_URL` — URL do backend (default: `http://localhost:8000`)

### Rodar

Recomendado — sobe backend e frontend juntos, no mesmo terminal, com prefixos coloridos. Ctrl+C derruba os dois:

```bash
pnpm dev:all
```

Se preferir rodar separados:

```bash
pnpm dev:backend     # só FastAPI em http://localhost:8000
pnpm dev:frontend    # só Next.js em http://localhost:3000
```

Web abre em `http://localhost:3000` e backend em `http://localhost:8000` (docs em `/docs`).

## Validar a integração

1. Vai em `http://localhost:3000` → **Entrar**
2. Use as credenciais do usuário que você criou no Supabase Auth
3. Após login, deve cair em `/dashboard` mostrando seus dados (vindos do `/api/v1/me/` do backend)

Se aparecer "Stack funcionando ponta a ponta" no dashboard, todo o fluxo está OK:
**Browser → Supabase Auth → Cookie httpOnly → Middleware Next → JWT → Backend FastAPI → Postgres**

## Comandos úteis

```bash
pnpm dev:all        # backend + frontend juntos (recomendado pra dev)
pnpm dev:backend    # só FastAPI (porta 8000, com PYTHONIOENCODING/UTF-8)
pnpm dev:frontend   # só Next.js (porta 3000)
pnpm dev            # apps Node via turbo (sem o backend Python)
pnpm build          # build de produção de todos os apps/packages
pnpm lint           # ESLint em todos os pacotes
pnpm type-check     # verificação de tipos em todos os pacotes
pnpm format         # Prettier em todo o repo
```

Pra rodar comando em um pacote específico:

```bash
pnpm --filter @teachflow/web dev
pnpm --filter @teachflow/database type-check
```

## Próximos passos

- Adicionar `apps/mobile/` (Expo + NativeWind)
- Implementar telas de cursos, aulas, atividades, quiz
- Gerar tipos TypeScript do Supabase: `pnpm --filter @teachflow/database generate-types`

Veja [`CLAUDE.md`](./CLAUDE.md) pras regras do projeto e convenções.
