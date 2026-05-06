# Design Reference — TeachFlow

Esta pasta contém os mockups visuais do TeachFlow em forma de componentes React **NÃO funcionais**. Eles servem como **blueprint visual** pra construir as telas reais em `apps/web/` e `apps/mobile/`.

## ⚠️ Importante

- **NÃO importe esses arquivos no código de produção.** Eles dependem de helpers (`useT`, `Icon`, `Avatar`, `TButton`, `Card`, `PaperBg`, `Blob`, etc.) que não estão definidos no projeto.
- **NÃO os edite achando que são código real.** Eles são só referência visual.
- **USE-OS** como guia de:
  - Estrutura de cada tela (que blocos, em que ordem)
  - Paleta de cores (peach, sage, caramel, etc. — já configurada em `apps/web/tailwind.config.ts`)
  - Tipografia (display serif + sans + mono)
  - Comportamento esperado (tabs, listas, formulários)
  - Tom de voz da copy ("Bom dia, Beatriz ✿", "Que bom ver você de novo.")

## O que está aqui

### web/

7 telas do produto web:

| Arquivo | Tela | Quem vê |
| --- | --- | --- |
| `screen-dashboard.jsx` | Dashboard do professor | ADMIN/OWNER |
| `screen-course.jsx` | Detalhe de curso (sequência de aulas/quizzes/atividades) | Todos |
| `screen-lesson.jsx` | Player de aula (vídeo + tabs) | Todos |
| `screen-quiz.jsx` | Editor de quiz (builder) | ADMIN/OWNER |
| `screen-activities.jsx` | Atividades / correção de entregas | ADMIN/OWNER |
| `screen-branches.jsx` | Filiais e alunos | OWNER apenas |
| `screen-extras.jsx` | Login + feed do aluno | Login: público; feed: USUARIO |

### mobile/

1 arquivo com várias telas mobile:

| Arquivo | Conteúdo |
| --- | --- |
| `screen-mobile.jsx` | Login mobile + home aluno + player aula + tarefas + quiz + home professor |

## Como usar com Claude Code

Quando pedir pra implementar uma tela, referencie o arquivo:

> "Implementa a tela de dashboard usando `design-reference/web/screen-dashboard.jsx` como referência visual. Use a paleta TeachFlow do `apps/web/tailwind.config.ts`. Conecte com o backend via `@teachflow/api-client`. Siga o `CLAUDE.md`."

O Claude Code vai ler o JSX, entender a estrutura visual, e construir a tela real com componentes próprios + chamadas reais ao backend.

## Origem

Mockups recebidos de Anthropic Claude (chat) durante a fase de design do produto. Servem como referência canônica de "como o TeachFlow deve parecer" até a v1.

A estética é deliberada: paleta pastel acolhedora, tipografia que mistura serif display + sans, decorações orgânicas (blobs). Voz: "uma sala de aula acolhedora — do outro lado da tela."
