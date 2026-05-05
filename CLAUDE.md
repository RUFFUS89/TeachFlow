# CLAUDE.md — TeachFlow

Este arquivo orienta agentes de IA (Claude Code, Cursor, Antigravity, etc.) a trabalhar no TeachFlow de forma consistente, evitando que cada sessão redescubra decisões que já foram tomadas.

> **Ao começar uma nova tarefa:** leia este arquivo até o fim antes de propor mudanças. Se uma decisão aqui parecer errada, **levante a discussão com o humano em vez de quebrá-la silenciosamente**.

---

## 1. Visão de produto

**TeachFlow** é um SaaS de gestão escolar focado em **cursinhos, preparatórios e aulas particulares** — não escola formal. A unidade central é o **curso** (sequência de aulas, quizzes e atividades), não a turma de bimestre.

Estética: tom **acolhedor**, paleta pastel (peach, sage, caramel, lilac, butter, blush). Voz da marca: "uma sala de aula acolhedora — do outro lado da tela." Evite UI corporativa fria.

### Atores e papéis

- **OWNER** — gestor/diretor da instituição. Pode ter múltiplas filiais (rede). Único papel que gerencia filiais.
- **ADMIN** — professores e funcionários. Escopados a uma filial.
- **USUARIO** — alunos. Escopados a uma filial.
- **TUTOR** — pai/mãe/responsável. **Não tem login próprio.** Entra usando as credenciais do aluno. Os dados do tutor ficam em `tutor_contacts` ligados ao perfil do aluno.

---

## 2. Estrutura do monorepo

```
TeachFlow/
├── backend/                 # FastAPI + SQLAlchemy + Supabase Postgres
├── apps/
│   └── web/                 # Next.js 15 (App Router)
├── packages/
│   ├── database/            # Tipos TypeScript do domínio
│   ├── api-client/          # Cliente HTTP tipado pro backend
│   └── config/              # tsconfig compartilhado
└── (apps/mobile/ entra depois — Expo + NativeWind)
```

**Regras:**

- Pacotes consumem uns aos outros via `workspace:*` no `package.json`.
- Tipos do domínio vivem em `packages/database/src/index.ts`. Apps **importam de lá**, não definem tipos próprios pra entidades centrais (Profile, Branch, Course, Lesson, etc.).
- Chamadas HTTP ao backend passam **sempre** pelo `@teachflow/api-client`. Apps não usam `fetch` direto pra `/api/v1/*`.
- Nada de definir tipos de domínio dentro de `apps/web/`. Se precisar, adiciona em `packages/database/`.

---

## 3. Stack e versões

| Camada | Tecnologia |
| --- | --- |
| Frontend web | Next.js 15 (App Router), React 19, TypeScript, Tailwind CSS |
| Backend | FastAPI, SQLAlchemy 2.0 async, psycopg 3, Pydantic v2 |
| Banco/Auth/Storage | Supabase (Postgres + Auth + Storage) |
| Mobile (futuro) | Expo + React Native + NativeWind |
| Gerenciador de pacotes | pnpm 9 (workspaces) + uv (Python) |
| Build/Pipeline | Turborepo |
| Deploy | Vercel (frontend) + Fly.io ou Railway (backend) |

**Não troque a stack sem discussão.** Não substitua Tailwind por styled-components, não troque pnpm por npm, não migre FastAPI pra Django.

---

## 4. Decisões arquiteturais (não revisitar sem discussão)

### 4.1. Autenticação — JWT do Supabase com ES256

O Supabase migrou pra emitir tokens ES256 (chaves ECC P-256). O backend valida via **JWKS** (`{SUPABASE_URL}/auth/v1/.well-known/jwks.json`), com cache de 1h. Aceita ES256, RS256 e HS256 pra cobrir rotação.

- Código de validação: `backend/app/auth/jwt.py`
- A variável `SUPABASE_JWT_SECRET` no `.env` ainda existe pra validar tokens legacy mas **não é mais necessária** pros tokens novos.

### 4.2. Permissões — onde elas vivem

O backend conecta no Postgres como o usuário `postgres`, que **bypassa RLS**. Por isso:

- **Primeira linha de defesa:** funções Python em `backend/app/core/permissions.py` (`require_branch_role`, `require_branch_staff`, `require_branch_owner`, `require_branch_member`). **Toda rota que toca dados de usuário precisa chamar uma destas.**
- **RLS no Postgres:** continua ativa como **rede de segurança**. Protege contra clientes que falam direto com o Supabase (supabase-js no browser, etc.).

Isso significa: **não delegue autorização à RLS no backend Python**. Sempre valide explicitamente em código.

### 4.3. Modelo de dados — curso, não turma

A unidade é o **curso** (`courses`), não a turma. Cursos têm `course_modules` opcionais, e a sequência ordenada vive em `course_items` (polimórfica entre `lesson` e `assignment`). Aluno se vincula via `course_enrollments`.

Não recrie `classes`, `class_subjects`, `enrollments`, `academic_years`, `assessment_periods` — esses conceitos foram **removidos** na v2 do schema porque não cabem no produto.

### 4.4. Tutor não é usuário

Tutor (responsável) **não tem login**. Tutor é registro em `tutor_contacts` (nome, telefone, email, parentesco) ligado ao perfil do aluno. Tutor entra no app usando as credenciais do aluno. **Não crie auth.users pra tutor.**

### 4.5. Storage — convenção de path

Toda primeira pasta dentro do bucket é o ID do "dono" do recurso. Isso simplifica RLS no Storage:

```
avatars/{user_id}/avatar.png
lesson-materials/{lesson_id}/<arquivo>
submission-files/{submission_id}/<arquivo>
course-covers/{course_id}/<arquivo>
branch-logos/{branch_id}/<arquivo>
```

### 4.6. Vídeo de aula — link externo, não upload

Aulas usam `video_url` + `video_provider` (`youtube`, `vimeo`, `mux`, `self_hosted`). **Não suba vídeo direto pro Storage do Supabase**, é caro e a experiência de playback é ruim. Anexos complementares (PDF, áudio curto, imagem) vão pro `lesson-materials`.

---

## 5. Convenções de código

### Frontend (TypeScript / React)

- **TypeScript estrito.** `noUncheckedIndexedAccess` ligado. Nunca use `any` exceto se realmente necessário (e aí adicione comentário explicando).
- **Server Components por padrão**, só `"use client"` quando precisa de hooks/eventos/estado.
- **Tailwind only.** Não adicione styled-components, emotion, CSS modules, etc.
- **Componentes em PascalCase**, hooks em `useNomeAlgo`, utilitários em `camelCase`.
- **Importações em ordem:** libs externas → packages do monorepo (`@teachflow/*`) → módulos locais (`@/`). Separadas por linha em branco.
- **Chame o api-client**, não fetch direto: `const api = useApiClient(); const me = await api.me.get();`

### Backend (Python)

- **Type hints em tudo** (`def x(y: int) -> str:`). Não comite código sem tipos.
- **Async em tudo que toca banco ou rede.** Use `AsyncSession` do SQLAlchemy.
- **Modelos em `app/models/`**, schemas Pydantic em `app/schemas/`, rotas em `app/routers/`. Não misture.
- **Toda rota que toca dados de usuário chama `require_branch_*`** antes de retornar/modificar.
- **Nunca confie em `service_role` no fluxo normal.** Ela é só pra operações administrativas raras (ex: criar primeira filial).
- **Lint/format:** `uv run ruff check --fix && uv run ruff format`.

### Git

- **Commits convencionais:** `feat:`, `fix:`, `chore:`, `refactor:`, `docs:`, `test:`. Mensagem em português ou inglês, mas consistente.
- **Branch principal:** `main`. Criar `feat/nome-da-feature` pra trabalho maior.
- **Nunca comitar segredos.** O `.gitignore` da raiz cobre `.env` e variantes — não desabilite.

---

## 6. Workflow ao adicionar uma feature nova

Exemplo: adicionar entidade `Course`.

1. **SQL primeiro.** Confirma que a tabela já existe no `01_schema_v2.sql` (ela existe). Se não existir, cria migração via Alembic.
2. **Modelo no backend.** `backend/app/models/course.py` (siga o padrão de `identity.py`).
3. **Importa em `app/models/__init__.py`** pra Alembic enxergar.
4. **Schemas Pydantic.** `backend/app/schemas/course.py` (CourseRead, CourseCreate, CourseUpdate).
5. **Router.** `backend/app/routers/courses.py`. Cada endpoint chama `require_branch_*` no começo.
6. **Inclui o router em `app/main.py`.**
7. **Tipos TypeScript.** Adiciona em `packages/database/src/index.ts`.
8. **Cliente HTTP.** Adiciona métodos em `packages/api-client/src/index.ts`.
9. **UI no `apps/web/`.** Cria as telas. Chama `api.courses.list()`, etc.
10. **Commit.** Mensagem descritiva.

Se uma etapa parecer redundante, é porque ainda não viu o valor — não pule.

---

## 7. Como rodar tudo localmente

```bash
# Backend (terminal 1)
cd backend
uv run fastapi dev app/main.py

# Frontend (terminal 2, na raiz)
pnpm dev
```

Backend: `http://localhost:8000` (docs em `/docs`).
Frontend: `http://localhost:3000`.

---

## 8. Coisas que NÃO fazer

- ❌ Adicionar campo `is_admin: boolean` em `profiles`. Use `branch_members.role`.
- ❌ Criar tabela `users` separada de `auth.users`. Profile já estende auth.users.
- ❌ Implementar autenticação custom. Sempre Supabase Auth.
- ❌ Usar `useEffect` pra fetch quando dá pra fazer no Server Component.
- ❌ Adicionar lib de estado global (Redux/Zustand/Jotai) sem discussão. Server Components + URL state cobrem 95% dos casos.
- ❌ Colocar lógica de negócio no frontend ("calcula a média aqui antes de salvar"). Lógica vive no backend.
- ❌ Renderizar `is_correct` de quiz_options no cliente do aluno. Use a view `quiz_options_for_students`.
- ❌ Tocar em arquivos do `backend/.venv/`, `node_modules/`, `.next/`, `.turbo/`.

---

## 9. Para perguntas/decisões fora do escopo aqui

Pare e pergunte ao humano. Decisões em zonas cinzentas têm impacto longo — é melhor 30 segundos de pergunta do que uma hora desfazendo refactor.

---

_Última atualização: 2026-05-04. Quando este arquivo ficar desatualizado, atualize-o no mesmo PR da mudança._
