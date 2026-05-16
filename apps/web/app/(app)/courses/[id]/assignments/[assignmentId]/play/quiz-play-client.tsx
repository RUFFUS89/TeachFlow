"use client";

import { ApiError } from "@teachflow/api-client";
import type { AssignmentPlayResponse, QuizQuestionStudent } from "@teachflow/database";
import {
  Button,
  Card,
  Chip,
  EmptyState,
  Icon,
  PageHeader,
  Textarea,
} from "@teachflow/ui";
import Link from "next/link";
import { useState } from "react";

import { useApiClient } from "@/lib/api";

type Answer = {
  question_id: string;
  selected_option_id: string | null;
  text_answer: string | null;
};

export function QuizPlayClient({
  playData,
  courseId,
  profileId,
}: {
  playData: AssignmentPlayResponse;
  courseId: string;
  profileId: string;
}) {
  const api = useApiClient();
  const { assignment, questions, submission: existingSubmission } = playData;

  const [answers, setAnswers] = useState<Record<string, Answer>>(() => {
    const init: Record<string, Answer> = {};
    for (const q of questions) {
      init[q.id] = { question_id: q.id, selected_option_id: null, text_answer: null };
    }
    return init;
  });

  const [submissionId, setSubmissionId] = useState<string | null>(
    existingSubmission?.status === "draft" ? existingSubmission.id : null,
  );
  const [submitted, setSubmitted] = useState(
    existingSubmission?.status === "submitted" || existingSubmission?.status === "graded",
  );
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isAlreadyDone = submitted;

  function setAnswer(questionId: string, partial: Partial<Answer>) {
    setAnswers((prev) => ({ ...prev, [questionId]: { ...prev[questionId]!, ...partial } }));
  }

  async function ensureSubmission(): Promise<string> {
    if (submissionId) return submissionId;
    const sub = await api.assignments.submissions.start(assignment.id);
    setSubmissionId(sub.id);
    return sub.id;
  }

  async function handleSubmit() {
    setSubmitting(true);
    setError(null);
    try {
      const subId = await ensureSubmission();
      await api.submissions.submitAnswers(subId, {
        answers: Object.values(answers),
        finalize: true,
      });
      setSubmitted(true);
    } catch (err) {
      setError(err instanceof ApiError ? err.detail : "Erro ao enviar respostas");
    } finally {
      setSubmitting(false);
    }
  }

  const answeredCount = Object.values(answers).filter(
    (a) => a.selected_option_id !== null || (a.text_answer?.trim() ?? ""),
  ).length;

  if (questions.length === 0) {
    return (
      <EmptyState
        icon="quiz"
        title="Nenhuma questão"
        description="Este quiz ainda não tem questões."
        action={
          <Link href={`/courses/${courseId}`}>
            <Button variant="ghost" size="sm">Voltar ao curso</Button>
          </Link>
        }
      />
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2 text-sm text-inkMuted">
            <Link href={`/courses/${courseId}`} className="hover:text-ink">Curso</Link>
            <Icon name="chevron-right" size={14} />
            <span className="text-ink">{assignment.title}</span>
          </div>
          <PageHeader title={assignment.title} />
          {assignment.instructions && (
            <p className="text-sm text-inkMuted">{assignment.instructions}</p>
          )}
        </div>
        <div className="flex flex-col items-end gap-1 shrink-0">
          <Chip tone={isAlreadyDone ? "sage" : "caramel"}>
            {isAlreadyDone ? "Entregue" : `${answeredCount}/${questions.length} respondidas`}
          </Chip>
          {assignment.time_limit_minutes && (
            <span className="flex items-center gap-1 text-xs text-inkMuted">
              <Icon name="clock" size={12} />
              {assignment.time_limit_minutes} min
            </span>
          )}
        </div>
      </div>

      {isAlreadyDone ? (
        <Card tone="sage">
          <div className="flex items-center gap-3">
            <Icon name="check-circle" size={20} className="text-sageInk" />
            <div>
              <p className="font-medium text-sageInk">Quiz entregue</p>
              <p className="text-sm text-sageInk opacity-80">
                Suas respostas foram registradas. O professor irá corrigir em breve.
              </p>
            </div>
          </div>
        </Card>
      ) : (
        <>
          {error && (
            <div className="rounded-card bg-blush px-4 py-3 text-sm text-blushInk">{error}</div>
          )}

          <div className="flex flex-col gap-4">
            {questions.map((q, i) => (
              <QuestionView
                key={q.id}
                question={q}
                index={i}
                answer={answers[q.id]!}
                onChange={(partial) => setAnswer(q.id, partial)}
                disabled={submitting}
              />
            ))}
          </div>

          <div className="flex items-center justify-between pt-2">
            <p className="text-sm text-inkMuted">
              {answeredCount}/{questions.length} respondidas
            </p>
            <Button
              onClick={handleSubmit}
              loading={submitting}
              disabled={answeredCount === 0}
            >
              <Icon name="check-circle" size={14} />
              Entregar quiz
            </Button>
          </div>
        </>
      )}
    </div>
  );
}

// =============================================================================
// Individual question view
// =============================================================================

function QuestionView({
  question,
  index,
  answer,
  onChange,
  disabled,
}: {
  question: QuizQuestionStudent;
  index: number;
  answer: Answer;
  onChange: (partial: Partial<Answer>) => void;
  disabled: boolean;
}) {
  return (
    <Card>
      <div className="flex flex-col gap-3">
        <div className="flex items-start gap-3">
          <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-surface2 text-xs font-bold mt-0.5">
            {index + 1}
          </span>
          <div className="flex flex-1 flex-col gap-1">
            <p className="text-sm font-medium leading-relaxed">{question.prompt}</p>
            {question.hint && (
              <p className="text-xs text-inkMuted italic">Dica: {question.hint}</p>
            )}
          </div>
          <span className="shrink-0 text-xs text-inkMuted">{question.points}pt</span>
        </div>

        {(question.type === "multiple_choice" || question.type === "true_false") &&
          question.options.map((opt) => (
            <label
              key={opt.id}
              className={[
                "flex cursor-pointer items-center gap-3 rounded-card border-2 px-4 py-3 transition-colors",
                answer.selected_option_id === opt.id
                  ? "border-ink bg-surface2"
                  : "border-border hover:bg-surface2",
                disabled ? "cursor-default opacity-60" : "",
              ].join(" ")}
            >
              <input
                type="radio"
                name={`q-${question.id}`}
                value={opt.id}
                checked={answer.selected_option_id === opt.id}
                onChange={() => onChange({ selected_option_id: opt.id })}
                disabled={disabled}
                className="sr-only"
              />
              <span
                className={[
                  "flex size-4 shrink-0 items-center justify-center rounded-full border-2",
                  answer.selected_option_id === opt.id
                    ? "border-ink bg-ink"
                    : "border-border",
                ].join(" ")}
              >
                {answer.selected_option_id === opt.id && (
                  <span className="size-1.5 rounded-full bg-bg" />
                )}
              </span>
              <span className="text-sm">{opt.content}</span>
            </label>
          ))}

        {(question.type === "short_text" || question.type === "long_text") && (
          <Textarea
            rows={question.type === "short_text" ? 2 : 5}
            placeholder="Sua resposta…"
            value={answer.text_answer ?? ""}
            onChange={(e) => onChange({ text_answer: e.target.value || null })}
            disabled={disabled}
          />
        )}
      </div>
    </Card>
  );
}
