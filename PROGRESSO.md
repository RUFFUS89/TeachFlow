# TeachFlow — Diário de Progresso

> Documento que registra o que já foi feito, decisões tomadas, e por quê. Mantido pra evitar redescobrir tudo a cada sessão de chat.

**Última atualização:** 2026-05-05 (sessão inicial de fundação)
**Estado atual:** Fundação técnica completa e validada. Pronto pra construir telas com Claude Code.

---

## 1. Visão do produto

**TeachFlow** é um SaaS de gestão escolar voltado pra **cursinhos, preparatórios e aulas particulares** — não escola formal de ensino fundamental/médio. A unidade central é o **curso** (sequência de aulas, quizzes e atividades), não a turma de bimestre.

**Estética:** acolhedora, paleta pastel (peach, sage, caramel, lilac, butter, blush). Tipografia: display serif + sans + mono. Voz: "uma sala de aula acolhedora — do outro lado da tela."

**Atores:**
- **OWNER** — gestor/diretor da instituição. Pode ter múltiplas filiais (rede). Único papel que gerencia filiais.
- **ADMIN** — professores e funcionários. Escopados a uma filial.
- **USUARIO** — alunos. Escopados a uma filial.
- **TUTOR** — pai/mãe/responsável. **Não tem login próprio.** Entra usando as credenciais do aluno. Os dados ficam em `tutor_contacts` ligados ao perfil do aluno.

**Modelo de negócio:** Cada filial é uma instituição com CNPJ próprio. OWNER pode possuir várias filiais (rede/franquia). ADMIN e USUARIO ficam escopados a uma filial só.

---

## 2. Decisões arquiteturais (não revisitar sem discussão)

### 2.1 Stack escolhida

| Camada | Tecnologia | Por quê |
| --- | --- | --- |
| Frontend web | Next.js 15 (App Router), React 19, TypeScript, Tailwind | Performance pra dashboards pesados, ecossistema gigante, Claude Code domina |
| Frontend mobile (futuro) | Expo + React Native + NativeWind | Reaproveita lógica do web, NativeWind = Tailwind no mobile |
| Backend | FastAPI, SQLAlchemy 2.0 async, psycopg 3, Pydantic v2 | Decisão do usuário (mais experiente em Python) |
| Banco/Auth/Storage | Supabase (Postgres + Auth + Storage) | Auth pronta com roles, RLS no Postgres, Storage pronto, tier gratuito generoso |
| Gerenciador de pacotes | pnpm 9 (workspaces) + uv (Python) | Performance e pnpm é padrão pra monorepo |
| Build/Pipeline | Turborepo | Padrão de mercado pra monorepo Next.js |
| Deploy | Vercel (frontend) + Fly.io ou Railway (backend) | Vercel não roda Python bem em produção (serverless + cold start + 10s limit) |

**Decisões importantes que vieram com a stack:**

- **Não migrar pra Django.** FastAPI escolhido por simplicidade.
- **Não usar Next.js API Routes** pro backend principal (só ficaria coisa simples). Lógica fica no FastAPI.
- **Mobile depois.** Primeiro fazer web funcionar com 3-4 telas, depois adicionar `apps/mobile/`. Mobile dá mais atrito (Expo Go, build nativo).

### 2.2 Autenticação — JWT do Supabase com ES256

O Supabase migrou pra emitir tokens **ES256** (chaves ECC P-256 assimétricas), não mais HS256.

- **Como validamos no backend:** JWKS público em `{SUPABASE_URL}/auth/v1/.well-known/jwks.json`. Cache de 1h via `PyJWKClient`.
- **Algoritmos aceitos:** ES256, RS256 e HS256 (cobre rotação).
- **Código:** `backend/app/auth/jwt.py`.
- **`SUPABASE_JWT_SECRET` (legacy):** ainda existe no `.env` mas não é usado pra tokens novos. Mantido pra cobrir transição.

**Decisão consciente:** **não** usar HS256 legacy mesmo sendo mais simples — o Supabase está depreciando.

### 2.3 Permissões — onde elas vivem

**Fato crítico:** o backend conecta no Postgres como o usuário `postgres`, que **bypassa RLS**.

Consequência:
- **Primeira linha de defesa:** funções Python em `backend/app/core/permissions.py` (`require_branch_role`, `require_branch_staff`, `require_branch_owner`, `require_branch_member`). **Toda rota que toca dados de usuário precisa chamar uma destas.**
- **RLS no Postgres:** continua ativa como **rede de segurança**. Protege apenas clientes que falam direto com o Supabase via SDK (browser, mobile).

**Não delegue autorização à RLS no backend Python.** Sempre valide explicitamente em código.

### 2.4 Modelo de dados — curso, não turma

Schema v2 (substituiu v1 que era de "escola tradicional"). A unidade é o **curso**, não a turma. Cursos têm `course_modules` opcionais, e a sequência ordenada vive em `course_items` (polimórfica entre `lesson` e `assignment`).

**Removidos do v1:** `classes`, `class_subjects`, `enrollments`, `academic_years`, `assessment_periods`, `attendance`. Não recriar — esses conceitos não cabem no produto.

**Novidades do v2:**
- `branches` (filiais com CNPJ)
- `branch_members` com roles `owner`/`admin`/`usuario`
- `tutor_contacts` (responsáveis sem login próprio)
- `courses`, `course_modules`, `course_items`, `course_enrollments`
- `lessons` com `video_url` + `video_provider` (YouTube/Vimeo/Mux)
- `lesson_comments`, `lesson_favorites`
- `assignments` (cobre task/quiz/exam/project) + `assignment_criteria` (rubrica ENEM)
- `submissions` com `score` denormalizado, `submission_criterion_scores`
- `item_progress`, `daily_activity` (pra streak)
- `notifications`

**Total:** 24 tabelas + 54 RLS policies.

### 2.5 Storage — convenção de path

Toda primeira pasta dentro do bucket é o ID do "dono" do recurso. Simplifica RLS no Storage:

```
avatars/{user_id}/avatar.png
lesson-materials/{lesson_id}/<arquivo>
submission-files/{submission_id}/<arquivo>
course-covers/{course_id}/<arquivo>
branch-logos/{branch_id}/<arquivo>
```

**5 buckets** configurados. Avatars/course-covers/branch-logos são públicos. Lesson-materials e submission-files são privados (use `createSignedUrl` no cliente).

**Vídeo de aula:** usa `video_url` + `video_provider`. **Não subir vídeo pro Storage do Supabase** — caro e playback ruim. Use Mux/Cloudflare Stream/YouTube.

### 2.6 Tutor não é usuário

Tutor (responsável) **não tem auth.users**. É apenas registro em `tutor_contacts` (nome, telefone, email, parentesco) ligado ao perfil do aluno. Tutor entra no app usando as credenciais do aluno.

### 2.7 Outras decisões

- **Repositório público no GitHub** (`RUFFUS89/TeachFlow`).
- **Deploy híbrido:** Vercel (frontend) + Fly.io ou Railway (backend). Decisão final entre os dois fica pra hora do deploy.
- **Migrações Alembic:** schema v2 foi aplicado via SQL puro (não Alembic). Quando começar a evoluir o schema, fazer baseline com `alembic stamp` e seguir com `alembic revision --autogenerate`.

---

## 3. O que foi feito (cronologia)

### 3.1 Modelagem do domínio

- **Schema v1** (descartado): modelo de escola tradicional com `schools`, `academic_years`, `classes`, `class_subjects`, `enrollments`, `attendance`, `guardian_relationships`. Foi feito antes de ver os mockups.
- **Mockups recebidos:** 7 telas web (`screen-dashboard`, `screen-course`, `screen-lesson`, `screen-quiz`, `screen-activities`, `screen-branches`, `screen-extras`) + 1 mobile. Revelaram que o produto é um LMS/SaaS de cursos, não escola formal.
- **Schema v2** (atual): reescrito com 24 tabelas focadas no modelo curso/filial.

### 3.2 Backend FastAPI

**Estrutura entregue:**

```
backend/
├── app/
│   ├── main.py
│   ├── config.py              # pydantic-settings
│   ├── database.py            # engine async + get_db
│   ├── auth/
│   │   ├── jwt.py             # validação ES256 via JWKS
│   │   └── dependencies.py    # CurrentProfile, CurrentUserId, DbSession
│   ├── core/
│   │   ├── exceptions.py
│   │   └── permissions.py     # has_branch_role, require_branch_*
│   ├── models/
│   │   ├── base.py
│   │   └── identity.py        # Profile, Branch, BranchMember, TutorContact
│   ├── schemas/
│   │   └── identity.py
│   └── routers/
│       ├── health.py
│       ├── me.py
│       └── branches.py
├── alembic/                   # configurado, baseline pendente
├── pyproject.toml             # uv
└── .env.example
```

**Endpoints implementados (v0.2):**

| Método | Rota | Descrição |
| --- | --- | --- |
| GET | `/health` | Healthcheck |
| GET | `/health/db` | Confirma conexão com Postgres |
| GET | `/api/v1/me/` | Perfil + filiais do usuário |
| PATCH | `/api/v1/me/` | Atualiza próprio perfil |
| GET | `/api/v1/branches/` | Lista filiais do usuário |
| POST | `/api/v1/branches/` | Cria filial (criador vira OWNER) |
| GET | `/api/v1/branches/{id}` | Detalhes de uma filial |
| PATCH | `/api/v1/branches/{id}` | Edita filial (só OWNER) |

**Pendentes (serão criados conforme as telas precisarem):** courses, course_items, lessons, assignments, quiz, submissions, grades, item_progress, daily_activity, notifications.

### 3.3 Setup do Supabase

- ✅ Projeto criado (region South America - São Paulo)
- ✅ Schema v2 aplicado (`01_schema_v2.sql`)
- ✅ Storage buckets aplicados (`02_storage_buckets_v2.sql`)
- ✅ Senha do banco configurada (sem caracteres especiais pra evitar URL-encoding)
- ✅ Usuário de teste criado: `teste@teachflow.com` / `Teste12345`
- ✅ Auto Confirm ativo no usuário de teste

### 3.4 Frontend — esqueleto monorepo

**Estrutura entregue:**

```
TeachFlow/
├── backend/                   # já existia
├── apps/
│   └── web/
│       ├── app/
│       │   ├── page.tsx       # home pública
│       │   ├── login/         # tela de login com form
│       │   └── dashboard/     # tela validadora end-to-end
│       ├── lib/
│       │   ├── supabase/      # clients (browser + server)
│       │   └── api.ts         # hook useApiClient
│       ├── middleware.ts      # auth guard + redirect
│       ├── tailwind.config.ts # paleta TeachFlow
│       └── .env.local.example
├── packages/
│   ├── database/              # tipos TS do domínio
│   ├── api-client/            # cliente HTTP tipado
│   └── config/                # tsconfig compartilhado
├── pnpm-workspace.yaml
├── turbo.json
├── package.json               # raiz
├── CLAUDE.md                  # regras pro Claude Code
└── README.md
```

**Telas implementadas (apenas protótipos técnicos, não as finais dos mockups):**

- `/` — home pública com botão "Entrar"
- `/login` — form com email + senha, autentica via Supabase
- `/dashboard` — chama `/api/v1/me/` e mostra card verde "Stack funcionando ponta a ponta" + perfil

**Estas 3 telas servem só pra validar a integração técnica.** As telas finais (com base nos mockups) serão construídas pelo Claude Code.

### 3.5 Validação ponta a ponta

Validado em 2026-05-05:
- ✅ Backend conecta no Postgres do Supabase
- ✅ Frontend autentica via Supabase Auth (browser SDK)
- ✅ Cookie de sessão persiste entre páginas
- ✅ Middleware protege rotas privadas
- ✅ Cliente HTTP tipado envia JWT pro backend
- ✅ Backend valida JWT ES256 via JWKS
- ✅ Trigger `handle_new_user` cria profile automaticamente

### 3.6 Git/GitHub

- ✅ Git configurado: nome `Rufino`, email `joserufinoneto25@gmail.com`
- ✅ Chave SSH gerada (`ed25519`) e cadastrada no GitHub
- ✅ Repositório público em `github.com/RUFFUS89/TeachFlow` (branch `main`)
- ✅ `.gitignore` raiz cobrindo Python, Node, IDE, OS, secrets
- ✅ `.env` files protegidos (apenas `.env.example` versionados)

### 3.7 Quality of Life

- ✅ Atalhos no `package.json` raiz: `pnpm dev:all`, `pnpm dev:backend`, `pnpm dev:frontend` (via concurrently)
- ✅ Quando rodar backend no PowerShell, definir `$env:PYTHONIOENCODING="utf-8"` e `$env:PYTHONUTF8="1"` antes (banner do FastAPI tem emoji que quebra com cp1252) — já incluído nos atalhos.

---

## 4. Como rodar tudo localmente

### Pré-requisitos
- Node.js 20+
- pnpm 9+
- Python 3.12+
- uv (gerenciador de pacotes Python)
- Git

### Setup inicial (uma vez)

**Backend:**
```powershell
cd C:\Users\Joser\Downloads\Projetos\TeachFlow\backend
Copy-Item .env.example .env
# Editar .env preenchendo: DATABASE_URL, SUPABASE_URL, SUPABASE_ANON_KEY,
# SUPABASE_SERVICE_ROLE_KEY, SUPABASE_JWT_SECRET
uv sync
```

**Frontend:**
```powershell
cd C:\Users\Joser\Downloads\Projetos\TeachFlow
Copy-Item apps\web\.env.local.example apps\web\.env.local
# Editar com NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY,
# NEXT_PUBLIC_API_URL=http://localhost:8000
pnpm install
```

### Rodar (dia a dia)

```powershell
cd C:\Users\Joser\Downloads\Projetos\TeachFlow
pnpm dev:all
```

Backend em `http://localhost:8000` (docs em `/docs`), frontend em `http://localhost:3000`.

Para rodar apenas um:
```powershell
pnpm dev:backend     # só backend
pnpm dev:frontend    # só frontend
```

---

## 5. Lista de credenciais e onde elas estão (referência)

⚠️ **Nunca commitar segredos no Git.**

| Credencial | Onde fica | Onde pegar |
| --- | --- | --- |
| Senha do banco Supabase | `backend/.env` (`DATABASE_URL`) | Supabase → Settings → Database → Reset password |
| Anon/Publishable key | `backend/.env` + `apps/web/.env.local` | Supabase → Settings → API → "Publishable" |
| Service role key | `backend/.env` apenas (NUNCA no frontend) | Supabase → Settings → API → "Secret" |
| JWT secret (legacy) | `backend/.env` (uso opcional) | Supabase → Settings → JWT Keys → "Legacy JWT Secret" |
| Project URL | `backend/.env` + `apps/web/.env.local` | Supabase → Settings → API → "Project URL" |
| Chave SSH | `C:\Users\Joser\.ssh\id_ed25519` (privada) e `id_ed25519.pub` (pública) | Já gerada e cadastrada no GitHub |

---

## 6. Próximos passos

### Imediato
1. Commit + push das mudanças pendentes (todo frontend + atalhos do package.json) para o GitHub.

### Curto prazo (sessões com Claude Code)
1. Reproduzir telas dos mockups, uma por vez, partindo dos arquivos de design (`screen-*.jsx`):
   - Dashboard (cards de stats + grade de cursos)
   - Course detail (sequência de aulas/quizzes/atividades)
   - Lesson player (vídeo + tabs)
   - Quiz builder
   - Activities (entregas e correção)
   - Branches (filiais e alunos) — só para OWNER
2. Conforme cada tela for sendo construída, adicionar endpoints correspondentes no backend (courses, lessons, assignments, etc.) seguindo o padrão dos endpoints já existentes.
3. Gerar tipos TS automaticamente do Supabase: `supabase gen types typescript --linked > packages/database/src/database.types.ts` (substitui os tipos manuais atuais).

### Médio prazo
1. Adicionar `apps/mobile/` (Expo + NativeWind).
2. Configurar Storage uploads no frontend (avatares, anexos, capas).
3. Implementar streak (`daily_activity`) + notificações.
4. Sistema de pagamento/billing pra owner ter limites de filiais.

### Antes de produção
1. Deploy do frontend na Vercel.
2. Deploy do backend no Fly.io ou Railway (decisão final).
3. Configurar `ALLOWED_ORIGINS` no backend pro domínio de produção.
4. Configurar Mux/Cloudflare Stream pra vídeo de aulas longas.
5. Migrar JWT validation pra ES256 puro (remover suporte HS256 legacy quando Supabase deprecar).
6. Configurar email de transactional (Resend) pra recuperação de senha, comunicados.
7. Auditoria de segurança das RLS policies.

---

## 7. Coisas a evitar / armadilhas conhecidas

- ❌ Adicionar campo `is_admin` em `profiles`. Use `branch_members.role`.
- ❌ Criar tabela `users` separada de `auth.users`. Profile já estende auth.users via FK + trigger `handle_new_user`.
- ❌ Implementar autenticação custom. Sempre Supabase Auth.
- ❌ Renderizar `is_correct` de quiz_options no cliente do aluno. Use a view `quiz_options_for_students`.
- ❌ Subir vídeo pro Storage do Supabase. Use Mux/Cloudflare Stream/YouTube.
- ❌ Confiar na RLS no backend Python. RLS é só rede de segurança, autorização real fica em `app/core/permissions.py`.
- ❌ Comitar arquivos `.env` (qualquer um, exceto `.env.example`).
- ❌ Senhas com caracteres especiais (`@`, `#`, `:`, `/`, `?`, `&`, `%`, `+`) na `DATABASE_URL` sem URL-encoding. Mais fácil usar senha sem símbolos.
- ❌ Rodar `uv run fastapi dev` no PowerShell sem definir `PYTHONIOENCODING=utf-8` (banner com emoji 🚀 quebra com `cp1252`).
- ❌ Direct connection do Supabase (porta 5432 direto). Use **Session pooler** (também 5432, mas IPv4 proxy).
- ❌ Mexer em `node_modules/`, `.venv/`, `.next/`, `.turbo/`, `__pycache__/` manualmente.
- ❌ Pôr `service_role_key` no `.env.local` do frontend. Frontend só vê `NEXT_PUBLIC_*`.
- ❌ Pular `require_branch_*` em rotas que tocam dados de usuário.

---

## 8. Arquivos de referência importantes

| Arquivo | Pra que serve |
| --- | --- |
| `01_schema_v2.sql` | Schema completo do banco (24 tabelas + 54 RLS). Aplicado no Supabase. |
| `02_storage_buckets_v2.sql` | 5 buckets de Storage com RLS. Aplicado no Supabase. |
| `CLAUDE.md` (raiz) | Regras pro Claude Code não redescobrir decisões a cada sessão. |
| `backend/README.md` | Setup específico do backend (Python). |
| `README.md` (raiz) | Setup geral do monorepo. |
| `screen-*.jsx` (recebidos do usuário) | Mockups visuais de referência das telas. Não são código de produção, mas servem como blueprint. |

---

## 9. Estado oficial em 2026-05-05

✅ Fundação técnica completa e validada.
⏭️ Próxima fase: construção das telas de produto, peça por peça, com Claude Code orientado pelo `CLAUDE.md` e usando os `screen-*.jsx` como referência visual.

---

## 10. Construção das telas — Fase 0 concluída em 2026-05-06

Plano completo das 8 fases v1 web está em `~/.claude/plans/modo-plano-vou-construir-temporal-kitten.md`.

### Fase 0 — Preparação compartilhada (✅ concluída)

- **Schema versionado:** `backend/db/schema.sql` (122KB) gerado via `pg_dump 17.9` contra o Supabase (24 tabelas + 7 storage + 130 outros objetos: types, views, indexes, RLS policies, triggers, functions). PostgreSQL 17 client tools instalados via winget. README com instruções de regeneração em `backend/db/README.md`.
- **Alembic baseline:** revision vazia em `backend/alembic/versions/2026_05_06_1357-baseline_baseline.py` + `alembic stamp baseline` aplicado. Daqui pra frente, mudanças via `alembic revision --autogenerate -m "..."`.
- **Driver fix:** `backend/alembic/env.py` força `postgresql+psycopg` (Alembic é sync; o projeto usa `psycopg` v3, não `psycopg2`).
- **`packages/utils` (novo):** `formatDate`, `formatRelativeTime`, `formatMinutes/Seconds`, `formatScore`, `pluralize`, `slugify`, `initialsOf`, `clamp`. Locale pt-BR via `date-fns`.
- **`packages/ui` (novo):** `cn` helper, `Tone` tokens, `Icon` (mapa de 50 strings → lucide-react), `Button`/`Card`/`Chip`/`Avatar`/`Input`/`Textarea`/`Select`/`Checkbox`/`Label`, `Badge`/`Skeleton`/`Spinner`/`EmptyState`, `AppShell`/`Sidebar`/`TopBar`/`PageHeader`/`TabPills`/`Modal`, `Ring`/`ProgressBar`/`Stat`, `Blob`/`PaperBg`, hooks `useDisclosure`/`useMediaQuery`.
- **Deps adicionadas em apps/web:** `lucide-react`, `date-fns`, `clsx`, `tailwind-merge`, `sonner`. Tailwind config estendido pra varrer `packages/ui/src/**`.
- **AppShell montado:** route group `app/(app)/` com `layout.tsx` + `_components/app-shell-client.tsx` (sidebar colapsável persistida em `localStorage` + topbar com avatar/sair; itens variam por role). Role mockado por enquanto — Fase 1 conecta com `/api/v1/me`.
- **`/dashboard` migrado** pra dentro de `(app)/` (continua sendo validador end-to-end; reescrito de verdade na Fase 2).
- **`/playground`** em `app/(app)/playground/page.tsx` — vitrine de todas as primitives. **Apagar antes da Fase 1.**
- **Validação:** `pnpm -r type-check` verde nos 5 packages + apps/web. `next build` produz bundle válido (5 rotas: `/`, `/login`, `/dashboard`, `/playground`, `/_not-found`).

### Decisões macro confirmadas (input do humano em 2026-05-06)
- **Rotas separadas:** `/dashboard` (owner+admin) × `/feed` (usuario). Middleware redireciona por role.
- **Rubrica configurável** por assignment com seed automático "Redação ENEM" (5 competências × 200 pts) quando `type='exam'`. Seed como constante Python.
- **Convite por código manual** (sem SMTP): tabela `invite_codes` + rota pública `/redeem/[code]`.

### Achados durante execução (já corrigidos no plano)

Confronto entre o plano original e o schema real:

| Plano | Schema real | Onde |
|---|---|---|
| `submission_answers` | **`quiz_responses`** | Fase 5 |
| `lesson_materials` | **`lesson_attachments`** | Fase 4 |
| `Course.owner_profile_id`, `slug`, `started_at`, `ends_at` | `Course.author_id`, sem slug nem datas; tem **`color_tone`** | Fase 2 |
| `CourseModule.title` | `course_modules.name` | Fase 3 |
| `CourseEnrollment.profile_id`, `status` | `student_profile_id`, sem coluna status (controle por `completed_at`) | Fases 2/3 |
| `Lesson.summary`, `body_md`, `transcript_md`, `position` | `description`, `content`, sem transcript dedicado, posição vem de `course_items.position`. Tem extras: **`is_essential`**, **`published_at`**, **`video_duration_seconds`**, `author_id` | Fase 4 |
| `LessonComment` flat | Schema **suporta replies** via `parent_id`. Decisão: render flat no v1 | Fase 4 |
| `ItemProgress.position_seconds` | `watch_seconds` + `student_profile_id` | Fase 4 |
| `Assignment.instructions_md`, `due_at`, `allow_late` | `instructions`, `due_date`, `allow_late_submission`. Tem extras: **`weight`**, **`feedback_mode`** [`immediate`/`on_submit`/`manual_release`], **`pass_threshold_percent`**, **`shuffle_questions`**, **`available_from`**, **`published_at`**, `author_id` | Fase 5 |
| `QuizQuestion.prompt_md` | `prompt` (text). Tem `hint` opcional | Fase 5 |
| `QuizOption.label` | `content` | Fase 5 |
| `Submission.feedback_md`, `attempt_no`, `started_at`, `returned_at` | Sem feedback na submission; `attempt`; `content`; status enum cobre `returned` | Fase 5/6 |
| Plano não tinha `grades` separado | **`grades`** é entidade dedicada (id, assignment_id, student_profile_id, submission_id?, score, feedback, **graded_by**, graded_at, **released_at**). `submissions.score` é cache denormalizado | Fase 6 |
| Plano não tinha `submission_attachments` | Existe — pra anexos da entrega (PDF de redação etc.) | Fase 6 |
| `AssignmentCriterion.label` | `name` | Fase 6 |
| `Notification` campos | `recipient_profile_id`, `body`, `link`, **`metadata jsonb`** | Fase 8 |
| `DailyActivity` complexo | Simples: `(profile_id, date, count)` PK composta | Fase 8 |
| Plano não previa `quiz_feedback_mode` enum | Existe no schema; expor em `packages/database` | Fase 5 |

### Fase 1 — Auth / Onboarding (✅ concluída em 2026-05-06)

- **`/login`** refinado: layout split (brand+blob esquerda × form direita) usando `@teachflow/ui` (Input, Button, Card, Blob). Link pra `/signup` e dica sobre `/redeem/[code]`.
- **`/signup`** (novo): cadastro de OWNER novo via Supabase `signUp` (com `data.full_name` no metadata). Após signup, redireciona pra `/onboarding`.
- **`/onboarding`** (novo): server component checa `/api/v1/me/`; se já tem membership ativa, redireciona conforme role. Se não, renderiza form (nome, slug auto-gerado via `slugify`, cidade, UF, CNPJ opcional) que chama `POST /api/v1/branches/`. Backend já cria `BranchMember` com role `owner` na mesma transação.
- **`middleware.ts`** simplificado: cuida só de auth (não autenticado em rota privada → `/login`; autenticado em `/login`/`/signup` → `/`). Cross-role e onboarding redirect ficam nas páginas.
- **`app/(app)/layout.tsx`** virou server component: busca `/me`, redireciona pra `/login` (sem sessão) ou `/onboarding` (sem membership), e passa profile + role reais pro `AppShellClient`.
- **`app/page.tsx`** (home): redireciona autenticado pra destino correto via `routeFor(me)`. Não-autenticado vê landing com botões Entrar/Criar conta.
- **`lib/api-server.ts`** (novo): factory `createServerApiClient()` que pega JWT do cookie Supabase via `createSupabaseServerClient` e injeta no api-client.
- **`lib/me.ts`** (novo): `getMeOrNull()` (trata 401/404 como anônimo), `highestRole(me)` (decide entre owner/admin/usuario), `routeFor(me)` (`/onboarding` | `/dashboard` | `/feed`).
- **`/dashboard/page.tsx`**: defesa em profundidade — aluno chegando aqui é mandado pra `/feed`.
- `/playground` deletado.
- `pnpm -r type-check` verde, `next build` OK (6 rotas: `/`, `/login`, `/signup`, `/onboarding`, `/dashboard`, `/_not-found`).

### Próximas fases
1. **Fase 2** (2 sessões): Dashboard professor (Course CRUD + stats agregados).
3. **Fase 3** (3 sessões): Course detail (modules, items, sequence, activity feed).
4. **Fase 4** (2 sessões): Lesson player (video embed + comments + progress).
5. **Fase 5** (2 sessões): Quiz builder (assignments + questions + options).
6. **Fase 6** (3 sessões): Activities (correção com critérios ENEM).
7. **Fase 7** (3 sessões): Branches (OWNER) + convites por código.
8. **Fase 8** (2 sessões): Student feed (`/feed`).
