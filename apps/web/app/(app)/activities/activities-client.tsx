"use client";

import { ApiError } from "@teachflow/api-client";
import type {
  AssignmentType,
  CriterionScore,
  GradeInput,
  SaveCriteriaPayload,
  SubmissionDetail,
  SubmissionListItem,
  SubmissionStatus,
  SubmissionsSummary,
} from "@teachflow/database";
import {
  Button,
  Card,
  Chip,
  EmptyState,
  Icon,
  Input,
  PageHeader,
  Skeleton,
  Stat,
  Textarea,
  type Tone,
} from "@teachflow/ui";
import { useEffect, useRef, useState } from "react";

import { useApiClient } from "@/lib/api";

// =============================================================================
// Helpers de exibição
// =============================================================================

const STATUS_LABEL: Record<SubmissionStatus, string> = {
  draft: "Rascunho",
  submitted: "Aguardando",
  late: "Atrasada",
  returned: "Devolvida",
  graded: "Corrigida",
};

const STATUS_TONE: Record<SubmissionStatus, Tone> = {
  draft: "neutral",
  submitted: "caramel",
  late: "blush",
  returned: "lilac",
  graded: "sage",
};

const TYPE_LABEL: Record<AssignmentType, string> = {
  task: "Tarefa",
  quiz: "Quiz",
  exam: "Redação",
  project: "Projeto",
};

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
}

// =============================================================================
// Page root
// =============================================================================

export function ActivitiesClient({ branchId }: { branchId: string }) {
  const api = useApiClient();

  const [summary, setSummary] = useState<SubmissionsSummary | null>(null);
  const [submissions, setSubmissions] = useState<SubmissionListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<SubmissionStatus | "">("");
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    try {
      const [s, list] = await Promise.all([
        api.submissions.summary(branchId),
        api.submissions.list({
          branch_id: branchId,
          status: statusFilter || undefined,
          q: search || undefined,
        }),
      ]);
      setSummary(s);
      setSubmissions(list);
    } catch {
      // silencioso — erros individuais aparecem nos componentes
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [branchId, statusFilter, search]);

  function handleSearchSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSearch(searchInput);
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Atividades" />

      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {summary ? (
          <>
            <Stat label="Total" value={summary.total} icon="clip" tone="neutral" />
            <Stat label="Aguardando" value={summary.pending} icon="clock" tone="caramel" />
            <Stat label="Corrigidas" value={summary.graded} icon="check-circle" tone="sage" />
            <Stat label="Atrasadas" value={summary.late} icon="warning" tone="blush" />
          </>
        ) : (
          Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-card" />
          ))
        )}
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap items-center gap-3">
        <form onSubmit={handleSearchSubmit} className="flex items-center gap-2">
          <Input
            placeholder="Buscar aluno ou atividade…"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="w-64"
          />
          <Button type="submit" variant="ghost" size="sm">
            <Icon name="search" size={14} />
          </Button>
        </form>

        <div className="flex flex-wrap gap-1">
          {(["", "submitted", "late", "graded", "returned"] as const).map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={[
                "rounded-full border px-3 py-1 text-xs transition-colors",
                statusFilter === s
                  ? "border-ink bg-ink text-bg"
                  : "border-border text-inkMuted hover:bg-surface2",
              ].join(" ")}
            >
              {s === "" ? "Todos" : STATUS_LABEL[s]}
            </button>
          ))}
        </div>

        <button
          onClick={() => void load()}
          className="ml-auto rounded-full border border-border p-1.5 text-inkMuted hover:bg-surface2"
          title="Recarregar"
        >
          <Icon name="refresh" size={14} />
        </button>
      </div>

      {/* Tabela */}
      {loading ? (
        <div className="flex flex-col gap-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-14 rounded-card" />
          ))}
        </div>
      ) : submissions.length === 0 ? (
        <EmptyState
          icon="clip"
          title="Nenhuma entrega"
          description="Ainda não há entregas para os filtros selecionados."
        />
      ) : (
        <SubmissionsTable
          rows={submissions}
          onSelect={setSelectedId}
          selectedId={selectedId}
        />
      )}

      {/* Drawer de correção */}
      {selectedId && (
        <GradingDrawer
          submissionId={selectedId}
          onClose={() => setSelectedId(null)}
          onGraded={() => {
            setSelectedId(null);
            void load();
          }}
        />
      )}
    </div>
  );
}

// =============================================================================
// SubmissionsTable
// =============================================================================

function SubmissionsTable({
  rows,
  onSelect,
  selectedId,
}: {
  rows: SubmissionListItem[];
  onSelect: (id: string) => void;
  selectedId: string | null;
}) {
  return (
    <div className="overflow-x-auto rounded-card border border-border">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border bg-surface2 text-left text-xs font-semibold text-inkMuted">
            <th className="px-4 py-3">Aluno</th>
            <th className="px-4 py-3">Atividade</th>
            <th className="px-4 py-3">Tipo</th>
            <th className="px-4 py-3">Entregue em</th>
            <th className="px-4 py-3">Status</th>
            <th className="px-4 py-3">Nota</th>
            <th className="px-4 py-3" />
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr
              key={row.id}
              className={[
                "border-b border-border transition-colors last:border-0",
                selectedId === row.id ? "bg-surface2" : "hover:bg-surface2/50",
              ].join(" ")}
            >
              <td className="px-4 py-3 font-medium">{row.student_name || "—"}</td>
              <td className="max-w-[180px] truncate px-4 py-3 text-inkMuted">
                {row.assignment_title}
              </td>
              <td className="px-4 py-3 text-inkMuted">
                {TYPE_LABEL[row.assignment_type as AssignmentType] ?? row.assignment_type}
              </td>
              <td className="px-4 py-3 text-inkMuted">
                {row.is_late ? (
                  <span className="text-blushInk">
                    {formatDate(row.submitted_at)} <span className="text-xs">(atrasada)</span>
                  </span>
                ) : (
                  formatDate(row.submitted_at)
                )}
              </td>
              <td className="px-4 py-3">
                <Chip tone={STATUS_TONE[row.status]}>{STATUS_LABEL[row.status]}</Chip>
              </td>
              <td className="px-4 py-3 font-mono">
                {row.score !== null ? String(row.score) : "—"}
              </td>
              <td className="px-4 py-3">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onSelect(row.id)}
                >
                  Corrigir
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// =============================================================================
// GradingDrawer
// =============================================================================

function GradingDrawer({
  submissionId,
  onClose,
  onGraded,
}: {
  submissionId: string;
  onClose: () => void;
  onGraded: () => void;
}) {
  const api = useApiClient();

  const [detail, setDetail] = useState<SubmissionDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [score, setScore] = useState("");
  const [feedback, setFeedback] = useState("");
  const [criteriaScores, setCriteriaScores] = useState<Record<string, { score: string; feedback: string }>>({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const drawerRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    drawerRef.current?.showModal();

    api.submissions.get(submissionId).then((d) => {
      setDetail(d);
      setScore(d.score !== null ? String(d.score) : "");
      setFeedback(d.grade?.feedback ?? "");

      const init: Record<string, { score: string; feedback: string }> = {};
      for (const cs of d.criterion_scores) {
        init[cs.criterion_id] = { score: String(cs.score), feedback: cs.feedback ?? "" };
      }
      setCriteriaScores(init);
    }).catch(() => setError("Erro ao carregar submissão")).finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [submissionId]);

  function setCriterionField(criterionId: string, field: "score" | "feedback", value: string) {
    setCriteriaScores((prev) => ({
      ...prev,
      [criterionId]: { ...prev[criterionId] ?? { score: "0", feedback: "" }, [field]: value },
    }));
  }

  async function handleGrade(release: boolean) {
    setSaving(true);
    setError(null);
    try {
      // Salva critérios se houver
      if (detail && detail.criterion_scores.length > 0) {
        const payload: SaveCriteriaPayload = {
          scores: detail.criterion_scores.map((cs) => ({
            criterion_id: cs.criterion_id,
            score: Number(criteriaScores[cs.criterion_id]?.score ?? 0),
            feedback: criteriaScores[cs.criterion_id]?.feedback || null,
          })),
        };
        await api.submissions.saveCriteria(submissionId, payload);
      }

      const gradePayload: GradeInput = {
        score: Number(score),
        feedback: feedback || null,
        release,
      };
      await api.submissions.grade(submissionId, gradePayload);
      onGraded();
    } catch (err) {
      setError(err instanceof ApiError ? err.detail : "Erro ao lançar nota");
    } finally {
      setSaving(false);
    }
  }

  async function handleReturn() {
    setSaving(true);
    setError(null);
    try {
      await api.submissions.returnForRework(submissionId);
      onGraded();
    } catch (err) {
      setError(err instanceof ApiError ? err.detail : "Erro ao devolver");
    } finally {
      setSaving(false);
    }
  }

  return (
    <dialog
      ref={drawerRef}
      onClose={onClose}
      className="fixed inset-0 m-0 flex h-screen w-full max-w-none items-stretch bg-transparent p-0 backdrop:bg-ink/30"
    >
      <div className="ml-auto flex h-full w-full max-w-xl flex-col overflow-y-auto bg-bg shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <h2 className="text-base font-semibold">Corrigir entrega</h2>
          <button
            onClick={onClose}
            className="rounded p-1 text-inkMuted hover:bg-surface2"
            aria-label="Fechar"
          >
            <Icon name="x" size={16} />
          </button>
        </div>

        {loading ? (
          <div className="flex flex-col gap-4 p-6">
            {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-12 rounded-card" />)}
          </div>
        ) : !detail ? (
          <div className="p-6 text-sm text-blushInk">{error ?? "Erro ao carregar."}</div>
        ) : (
          <div className="flex flex-1 flex-col gap-6 overflow-y-auto p-6">
            {/* Meta */}
            <div className="flex flex-col gap-1">
              <p className="text-xs text-inkMuted">Aluno</p>
              <p className="font-medium">{detail.student_name}</p>
              <p className="text-xs text-inkMuted">{detail.assignment_title} — {detail.course_title}</p>
              <div className="mt-1 flex items-center gap-2">
                <Chip tone={STATUS_TONE[detail.status]}>{STATUS_LABEL[detail.status]}</Chip>
                {detail.is_late && <Chip tone="blush">Atrasada</Chip>}
              </div>
            </div>

            {/* Conteúdo da entrega */}
            {detail.content && (
              <div className="flex flex-col gap-2">
                <p className="text-xs font-semibold uppercase tracking-wide text-inkMuted">Resposta</p>
                <Card>
                  <p className="whitespace-pre-wrap text-sm leading-relaxed">{detail.content}</p>
                </Card>
              </div>
            )}

            {/* Critérios de rubrica (ENEM / personalizados) */}
            {detail.criterion_scores.length > 0 && (
              <CriteriaRubric
                criterionScores={detail.criterion_scores}
                values={criteriaScores}
                onChange={setCriterionField}
                disabled={saving}
              />
            )}

            {/* Nota geral */}
            <div className="flex flex-col gap-2">
              <label className="text-xs font-semibold uppercase tracking-wide text-inkMuted">
                Nota
              </label>
              <Input
                type="number"
                step="0.01"
                placeholder="0"
                value={score}
                onChange={(e) => setScore(e.target.value)}
                disabled={saving}
              />
            </div>

            {/* Feedback */}
            <div className="flex flex-col gap-2">
              <label className="text-xs font-semibold uppercase tracking-wide text-inkMuted">
                Feedback
              </label>
              <Textarea
                rows={4}
                placeholder="Comentários para o aluno…"
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                disabled={saving}
              />
            </div>

            {error && (
              <p className="rounded-card bg-blush px-4 py-3 text-sm text-blushInk">{error}</p>
            )}

            {/* Ações */}
            <div className="flex flex-wrap items-center gap-3">
              <Button
                onClick={() => void handleGrade(true)}
                loading={saving}
                disabled={!score}
              >
                <Icon name="check-circle" size={14} />
                Lançar nota
              </Button>
              <Button
                variant="soft"
                onClick={() => void handleGrade(false)}
                loading={saving}
                disabled={!score}
              >
                Salvar rascunho
              </Button>
              <Button
                variant="ghost"
                onClick={() => void handleReturn()}
                loading={saving}
              >
                Devolver
              </Button>
            </div>
          </div>
        )}
      </div>
    </dialog>
  );
}

// =============================================================================
// CriteriaRubric
// =============================================================================

function CriteriaRubric({
  criterionScores,
  values,
  onChange,
  disabled,
}: {
  criterionScores: CriterionScore[];
  values: Record<string, { score: string; feedback: string }>;
  onChange: (criterionId: string, field: "score" | "feedback", value: string) => void;
  disabled: boolean;
}) {
  return (
    <div className="flex flex-col gap-3">
      <p className="text-xs font-semibold uppercase tracking-wide text-inkMuted">Critérios</p>
      {criterionScores.map((cs) => {
        const current = values[cs.criterion_id] ?? { score: "0", feedback: "" };
        return (
          <Card key={cs.criterion_id}>
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium">{cs.criterion_name}</p>
                <span className="text-xs text-inkMuted">máx. {cs.max_score}</span>
              </div>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  step="0.01"
                  min={0}
                  max={Number(cs.max_score)}
                  value={current.score}
                  onChange={(e) => onChange(cs.criterion_id, "score", e.target.value)}
                  disabled={disabled}
                  className="w-24"
                />
                <Input
                  placeholder="Comentário…"
                  value={current.feedback}
                  onChange={(e) => onChange(cs.criterion_id, "feedback", e.target.value)}
                  disabled={disabled}
                  className="flex-1"
                />
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );
}
