"use client";

import { ApiError } from "@teachflow/api-client";
import type { CourseListItem, DashboardStats } from "@teachflow/database";
import {
  Button,
  Card,
  Chip,
  EmptyState,
  Icon,
  PageHeader,
  Skeleton,
  Stat,
  type Tone,
} from "@teachflow/ui";
import Link from "next/link";
import { useEffect, useState } from "react";

import { useApiClient } from "@/lib/api";

const STATUS_LABEL: Record<CourseListItem["status"], string> = {
  draft: "Rascunho",
  active: "Ativo",
  archived: "Arquivado",
};

const STATUS_TONE: Record<CourseListItem["status"], Tone> = {
  draft: "caramel",
  active: "sage",
  archived: "neutral",
};

export function DashboardClient({ branchId }: { branchId: string }) {
  const api = useApiClient();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [courses, setCourses] = useState<CourseListItem[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [statsData, coursesData] = await Promise.all([
          api.dashboard.stats(branchId),
          api.courses.list({ branch_id: branchId }),
        ]);
        if (!cancelled) {
          setStats(statsData);
          setCourses(coursesData);
          setLoading(false);
        }
      } catch (e) {
        if (cancelled) return;
        setError(e instanceof ApiError ? `[${e.status}] ${e.detail}` : "Erro ao carregar");
        setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [api, branchId]);

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title="Dashboard"
        description="Visão geral da sua filial"
        actions={
          <Link href={`/courses/new?branch_id=${branchId}`}>
            <Button icon="plus">Novo curso</Button>
          </Link>
        }
      />

      {error && (
        <Card tone="blush">
          <p className="font-medium">Erro ao carregar</p>
          <p className="mt-1 font-mono text-sm">{error}</p>
        </Card>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-card" />)
        ) : (
          <>
            <Stat
              label="Cursos ativos"
              value={stats?.active_courses ?? 0}
              icon="course"
              tone="sage"
            />
            <Stat
              label="Alunos ativos"
              value={stats?.active_students ?? 0}
              icon="people"
              tone="peach"
            />
            <Stat
              label="Aguardando correção"
              value={stats?.pending_submissions ?? 0}
              icon="clip"
              tone="caramel"
            />
            <Stat
              label="Atividade semanal"
              value={stats?.weekly_activity_count ?? 0}
              icon="chart"
              tone="lilac"
            />
          </>
        )}
      </div>

      {/* Cursos */}
      <section className="flex flex-col gap-4">
        <h2 className="font-display text-lg text-ink">Cursos</h2>

        {loading ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-40 rounded-card" />
            ))}
          </div>
        ) : courses?.length === 0 ? (
          <EmptyState
            icon="course"
            title="Nenhum curso ainda"
            description="Crie seu primeiro curso para começar a ensinar."
            action={
              <Link href={`/courses/new?branch_id=${branchId}`}>
                <Button icon="plus">Criar curso</Button>
              </Link>
            }
          />
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {courses?.map((course) => (
              <CourseCard key={course.id} course={course} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function CourseCard({ course }: { course: CourseListItem }) {
  return (
    <Card className="flex flex-col gap-4 transition-shadow hover:shadow-md">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <p className="truncate font-display text-base font-medium text-ink">{course.title}</p>
          {course.description && (
            <p className="mt-1 line-clamp-2 text-sm text-inkSoft">{course.description}</p>
          )}
        </div>
        <Chip tone={STATUS_TONE[course.status]} size="sm">
          {STATUS_LABEL[course.status]}
        </Chip>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3 text-sm text-inkMuted">
          <span className="flex items-center gap-1">
            <Icon name="people" size={14} />
            {course.students_count}
          </span>
          <span className="flex items-center gap-1">
            <Icon name="lesson" size={14} />
            {course.items_count}
          </span>
        </div>
        <Link href={`/courses/${course.id}`}>
          <Button variant="ghost" size="sm" iconRight="arrow-right">
            Ver curso
          </Button>
        </Link>
      </div>
    </Card>
  );
}
