"use client";

import type {
  EnrolledCourseItem,
  FeedContinueItem,
  FeedResponse,
  StreakDay,
} from "@teachflow/database";
import {
  Card,
  Chip,
  EmptyState,
  Icon,
  PageHeader,
} from "@teachflow/ui";
import Link from "next/link";

const TONE_CYCLE = ["peach", "sage", "caramel", "butter", "blush", "lilac"] as const;

function greeting(name: string): string {
  const h = new Date().getHours();
  if (h < 12) return `Bom dia, ${name.split(" ")[0]}!`;
  if (h < 18) return `Boa tarde, ${name.split(" ")[0]}!`;
  return `Boa noite, ${name.split(" ")[0]}!`;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
  });
}

function daysUntil(iso: string) {
  const diff = Math.ceil(
    (new Date(iso).getTime() - Date.now()) / (1000 * 60 * 60 * 24),
  );
  if (diff === 0) return "Hoje";
  if (diff === 1) return "Amanhã";
  return `Em ${diff} dias`;
}

export function FeedClient({
  userName,
  feed,
  streak,
}: {
  userName: string;
  feed: FeedResponse | null;
  streak: StreakDay[];
}) {
  const streakDays = feed?.streak_days ?? 0;

  return (
    <div className="flex flex-col gap-8">
      {/* Hero */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <PageHeader title={greeting(userName)} />
          {streakDays > 0 && (
            <p className="mt-1 flex items-center gap-1.5 text-sm text-inkMuted">
              <Icon name="flame" size={14} className="text-caramel" />
              <span>
                <strong className="text-ink">{streakDays}</strong>{" "}
                {streakDays === 1 ? "dia em sequência" : "dias em sequência"}
              </span>
            </p>
          )}
        </div>
      </div>

      {/* Continue assistindo */}
      {feed?.continue_item && (
        <ContinueWatchingCard item={feed.continue_item} />
      )}

      <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
        <div className="flex flex-col gap-6">
          {/* Meus cursos */}
          <section>
            <h2 className="mb-4 text-base font-semibold text-ink">Meus cursos</h2>
            {!feed || feed.enrolled_courses.length === 0 ? (
              <EmptyState
                icon="course"
                title="Nenhum curso ainda"
                description="Quando você for matriculado em um curso ele aparecerá aqui."
              />
            ) : (
              <div className="grid gap-4 sm:grid-cols-2">
                {feed.enrolled_courses.map((course, i) => (
                  <CourseCard
                    key={course.course_id}
                    course={course}
                    tone={TONE_CYCLE[i % TONE_CYCLE.length]!}
                  />
                ))}
              </div>
            )}
          </section>

          {/* Heatmap */}
          <section>
            <h2 className="mb-4 text-base font-semibold text-ink">Atividade</h2>
            <StreakHeatmap days={streak} />
          </section>
        </div>

        {/* Deadlines */}
        <aside className="flex flex-col gap-4">
          <h2 className="text-base font-semibold text-ink">Próximos prazos</h2>
          {!feed || feed.upcoming_deadlines.length === 0 ? (
            <p className="text-sm text-inkMuted">Nenhum prazo próximo.</p>
          ) : (
            feed.upcoming_deadlines.map((d) => (
              <Card key={d.assignment_id} className="flex flex-col gap-1 py-3">
                <div className="flex items-start justify-between gap-2">
                  <span className="text-sm font-medium text-ink leading-snug">
                    {d.title}
                  </span>
                  <Chip
                    tone={
                      daysUntil(d.due_date) === "Hoje"
                        ? "blush"
                        : daysUntil(d.due_date) === "Amanhã"
                          ? "caramel"
                          : "sage"
                    }
                    size="sm"
                  >
                    {daysUntil(d.due_date)}
                  </Chip>
                </div>
                <p className="text-xs text-inkMuted">{d.course_title}</p>
                <p className="text-xs text-inkMuted">{formatDate(d.due_date)}</p>
              </Card>
            ))
          )}
        </aside>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Continue assistindo
// ---------------------------------------------------------------------------

function ContinueWatchingCard({ item }: { item: FeedContinueItem }) {
  const progressLabel = item.watch_seconds
    ? `${Math.floor(item.watch_seconds / 60)}min assistidos`
    : "Não iniciado";

  return (
    <Link
      href={`/courses/${item.course_id}/lessons/${item.lesson_id}`}
      className="group block"
    >
      <Card
        tone="lilac"
        className="flex items-center gap-4 transition-shadow group-hover:shadow-md"
      >
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-lilac/20">
          <Icon name="play" size={20} className="text-accent" />
        </div>
        <div className="flex flex-1 flex-col gap-0.5 min-w-0">
          <p className="text-xs font-medium uppercase tracking-wide text-inkMuted">
            Continuar assistindo
          </p>
          <p className="truncate font-semibold text-ink">{item.lesson_title}</p>
          <p className="text-xs text-inkMuted">{item.course_title}</p>
        </div>
        <div className="flex flex-col items-end gap-1 shrink-0">
          <span className="text-xs text-inkMuted">{progressLabel}</span>
          <Icon
            name="chevron-right"
            size={16}
            className="text-inkMuted group-hover:text-ink transition-colors"
          />
        </div>
      </Card>
    </Link>
  );
}

// ---------------------------------------------------------------------------
// Card de curso
// ---------------------------------------------------------------------------

function CourseCard({
  course,
  tone,
}: {
  course: EnrolledCourseItem;
  tone: (typeof TONE_CYCLE)[number];
}) {
  const pct =
    course.total_items > 0
      ? Math.round((course.completed_items / course.total_items) * 100)
      : 0;

  return (
    <Link
      href={`/courses/${course.course_id}`}
      className="group block"
    >
      <Card
        tone={tone}
        className="flex flex-col gap-3 transition-shadow group-hover:shadow-md"
      >
        <div className="flex items-start justify-between gap-2">
          <span className="font-semibold text-ink leading-snug line-clamp-2">
            {course.title}
          </span>
          {course.completed_at && (
            <Chip tone="sage" size="sm">Concluído</Chip>
          )}
        </div>

        {/* Barra de progresso */}
        <div className="flex flex-col gap-1">
          <div className="flex items-center justify-between text-xs text-inkMuted">
            <span>Progresso</span>
            <span>{pct}%</span>
          </div>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-border">
            <div
              className="h-full rounded-full bg-accent transition-all"
              style={{ width: `${pct}%` }}
            />
          </div>
          <span className="text-xs text-inkMuted">
            {course.completed_items}/{course.total_items} aulas concluídas
          </span>
        </div>
      </Card>
    </Link>
  );
}

// ---------------------------------------------------------------------------
// Streak heatmap (12 × 7)
// ---------------------------------------------------------------------------

function StreakHeatmap({ days }: { days: StreakDay[] }) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Mapeia date string → count
  const countMap = new Map<string, number>();
  for (const d of days) {
    countMap.set(d.date, d.count);
  }

  // Gera 84 dias regressivos (12 semanas × 7)
  const cells: { dateStr: string; count: number }[] = [];
  for (let i = 83; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const str = d.toISOString().slice(0, 10);
    cells.push({ dateStr: str, count: countMap.get(str) ?? 0 });
  }

  // Agrupa em semanas (colunas de 7)
  const weeks: { dateStr: string; count: number }[][] = [];
  for (let i = 0; i < cells.length; i += 7) {
    weeks.push(cells.slice(i, i + 7));
  }

  function tone(count: number): string {
    if (count === 0) return "bg-border";
    if (count === 1) return "bg-accent/30";
    if (count <= 3) return "bg-accent/60";
    return "bg-accent";
  }

  return (
    <div className="overflow-x-auto">
      <div className="flex gap-1">
        {weeks.map((week, wi) => (
          <div key={wi} className="flex flex-col gap-1">
            {week.map((cell) => (
              <div
                key={cell.dateStr}
                title={`${cell.dateStr}: ${cell.count} item(s)`}
                className={`h-3 w-3 rounded-sm ${tone(cell.count)}`}
              />
            ))}
          </div>
        ))}
      </div>
      <p className="mt-2 text-xs text-inkMuted">
        Últimas 12 semanas de atividade
      </p>
    </div>
  );
}
