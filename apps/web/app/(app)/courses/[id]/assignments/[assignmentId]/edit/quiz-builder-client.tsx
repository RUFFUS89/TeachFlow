"use client";

import { ApiError } from "@teachflow/api-client";
import type { Assignment, QuizOption, QuizQuestion } from "@teachflow/database";
import {
  Button,
  Card,
  Chip,
  Icon,
  Input,
  Label,
  Modal,
  PageHeader,
  Select,
  Textarea,
} from "@teachflow/ui";
import Link from "next/link";
import { useEffect, useState } from "react";

import { useApiClient } from "@/lib/api";

const QUESTION_TYPES = [
  { value: "multiple_choice", label: "Múltipla escolha" },
  { value: "true_false", label: "Verdadeiro/Falso" },
  { value: "short_text", label: "Resposta curta" },
  { value: "long_text", label: "Resposta longa" },
] as const;

export function QuizBuilderClient({
  assignment,
  initialQuestions,
  courseId,
}: {
  assignment: Assignment;
  initialQuestions: QuizQuestion[];
  courseId: string;
}) {
  const api = useApiClient();
  const [questions, setQuestions] = useState<QuizQuestion[]>(initialQuestions);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [addingQuestion, setAddingQuestion] = useState(false);

  async function refresh() {
    const qs = await api.assignments.questions.list(assignment.id);
    setQuestions(qs);
  }

  async function handleAddQuestion() {
    setAddingQuestion(true);
    try {
      const q = await api.assignments.questions.create(assignment.id, {
        prompt: "Nova questão",
        type: "multiple_choice",
        points: 1,
      });
      setQuestions((prev) => [...prev, q]);
      setExpandedId(q.id);
    } finally {
      setAddingQuestion(false);
    }
  }

  async function handleDeleteQuestion(questionId: string) {
    if (!confirm("Remover questão?")) return;
    await api.assignments.questions.delete(assignment.id, questionId);
    setQuestions((prev) => prev.filter((q) => q.id !== questionId));
    if (expandedId === questionId) setExpandedId(null);
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-inkMuted">
        <Link href={`/courses/${courseId}`} className="hover:text-ink">
          Curso
        </Link>
        <Icon name="chevron-right" size={14} />
        <span className="text-ink">{assignment.title}</span>
        <Icon name="chevron-right" size={14} />
        <span className="text-ink">Editor</span>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <PageHeader title={assignment.title} />
          <Chip tone="caramel" size="sm">{assignment.type}</Chip>
        </div>
        <Link href={`/courses/${courseId}/assignments/${assignment.id}/play`}>
          <Button variant="ghost" size="sm">
            <Icon name="eye" size={14} />
            Prévia
          </Button>
        </Link>
      </div>

      {/* Questions list */}
      <div className="flex flex-col gap-3">
        {questions.length === 0 ? (
          <Card>
            <div className="flex flex-col items-center gap-3 py-8 text-center">
              <Icon name="quiz" size={32} className="text-inkMuted" />
              <p className="text-sm text-inkMuted">Nenhuma questão ainda. Adicione a primeira.</p>
            </div>
          </Card>
        ) : (
          questions.map((q, index) => (
            <QuestionEditor
              key={q.id}
              question={q}
              index={index}
              assignmentId={assignment.id}
              expanded={expandedId === q.id}
              onToggle={() => setExpandedId(expandedId === q.id ? null : q.id)}
              onDelete={() => handleDeleteQuestion(q.id)}
              onUpdated={(updated) =>
                setQuestions((prev) => prev.map((x) => (x.id === updated.id ? updated : x)))
              }
            />
          ))
        )}
      </div>

      <div className="flex justify-center">
        <Button onClick={handleAddQuestion} loading={addingQuestion} variant="ghost">
          <Icon name="plus" size={14} />
          Adicionar questão
        </Button>
      </div>
    </div>
  );
}

// =============================================================================
// Question editor card
// =============================================================================

function QuestionEditor({
  question,
  index,
  assignmentId,
  expanded,
  onToggle,
  onDelete,
  onUpdated,
}: {
  question: QuizQuestion;
  index: number;
  assignmentId: string;
  expanded: boolean;
  onToggle: () => void;
  onDelete: () => void;
  onUpdated: (q: QuizQuestion) => void;
}) {
  const api = useApiClient();
  const [prompt, setPrompt] = useState(question.prompt);
  const [type, setType] = useState(question.type);
  const [points, setPoints] = useState(String(question.points));
  const [hint, setHint] = useState(question.hint ?? "");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setPrompt(question.prompt);
    setType(question.type);
    setPoints(String(question.points));
    setHint(question.hint ?? "");
  }, [question]);

  async function handleSave() {
    setSaving(true);
    try {
      const updated = await api.assignments.questions.update(assignmentId, question.id, {
        prompt,
        type,
        points: parseFloat(points) || 1,
        hint: hint.trim() || null,
      });
      onUpdated(updated);
    } finally {
      setSaving(false);
    }
  }

  const needsOptions = type === "multiple_choice" || type === "true_false";

  return (
    <Card padding="none">
      {/* Header */}
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-surface2 transition-colors rounded-t-card"
      >
        <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-surface2 text-xs font-bold">
          {index + 1}
        </span>
        <span className="flex-1 truncate text-sm font-medium">{question.prompt}</span>
        <Chip tone="caramel" size="sm">{type}</Chip>
        <span className="text-xs text-inkMuted">{question.points}pt</span>
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onDelete(); }}
          className="shrink-0 rounded p-1 text-inkMuted hover:text-blushInk"
        >
          <Icon name="trash" size={14} />
        </button>
        <Icon name={expanded ? "chevron-down" : "chevron-right"} size={14} className="shrink-0 text-inkMuted" />
      </button>

      {/* Body */}
      {expanded && (
        <div className="flex flex-col gap-4 border-t border-border p-4">
          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2 flex flex-col gap-1.5">
              <Label htmlFor={`prompt-${question.id}`}>Enunciado *</Label>
              <Textarea
                id={`prompt-${question.id}`}
                rows={2}
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor={`type-${question.id}`}>Tipo</Label>
              <Select
                id={`type-${question.id}`}
                value={type}
                onChange={(e) => setType(e.target.value as QuizQuestion["type"])}
              >
                {QUESTION_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor={`hint-${question.id}`}>Dica (opcional)</Label>
              <Input
                id={`hint-${question.id}`}
                placeholder="Dica para o aluno"
                value={hint}
                onChange={(e) => setHint(e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor={`pts-${question.id}`}>Pontos</Label>
              <Input
                id={`pts-${question.id}`}
                type="number"
                min="0"
                step="0.5"
                value={points}
                onChange={(e) => setPoints(e.target.value)}
              />
            </div>
          </div>

          {needsOptions && (
            <OptionsEditor
              question={question}
              assignmentId={assignmentId}
              isTrueFalse={type === "true_false"}
            />
          )}

          <div className="flex justify-end">
            <Button size="sm" loading={saving} onClick={handleSave} disabled={!prompt.trim()}>
              Salvar questão
            </Button>
          </div>
        </div>
      )}
    </Card>
  );
}

// =============================================================================
// Options editor (multiple_choice / true_false)
// =============================================================================

function OptionsEditor({
  question,
  assignmentId,
  isTrueFalse,
}: {
  question: QuizQuestion;
  assignmentId: string;
  isTrueFalse: boolean;
}) {
  const api = useApiClient();
  const [options, setOptions] = useState<QuizOption[]>(question.options);
  const [newContent, setNewContent] = useState("");
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    setOptions(question.options);
  }, [question.options]);

  async function handleAddOption() {
    if (!newContent.trim()) return;
    setAdding(true);
    try {
      const opt = await api.assignments.questions.options.create(
        assignmentId,
        question.id,
        { content: newContent.trim(), is_correct: false },
      );
      setOptions((prev) => [...prev, opt]);
      setNewContent("");
    } finally {
      setAdding(false);
    }
  }

  async function handleToggleCorrect(option: QuizOption) {
    const updated = await api.assignments.questions.options.update(
      assignmentId,
      question.id,
      option.id,
      { is_correct: !option.is_correct },
    );
    setOptions((prev) => prev.map((o) => (o.id === updated.id ? updated : o)));
  }

  async function handleDeleteOption(optionId: string) {
    await api.assignments.questions.options.delete(assignmentId, question.id, optionId);
    setOptions((prev) => prev.filter((o) => o.id !== optionId));
  }

  const effectiveOptions = isTrueFalse
    ? options.filter((o) => ["Verdadeiro", "Falso", "True", "False"].includes(o.content))
    : options;

  return (
    <div className="flex flex-col gap-2">
      <Label>Opções</Label>
      {effectiveOptions.map((opt) => (
        <div
          key={opt.id}
          className="flex items-center gap-2 rounded-card border border-border bg-surface px-3 py-2"
        >
          <button
            type="button"
            onClick={() => handleToggleCorrect(opt)}
            className={[
              "flex size-5 shrink-0 items-center justify-center rounded-full border-2 transition-colors",
              opt.is_correct
                ? "border-sageInk bg-sage text-sageInk"
                : "border-border",
            ].join(" ")}
            title={opt.is_correct ? "Correta" : "Marcar como correta"}
          >
            {opt.is_correct && <Icon name="check" size={10} />}
          </button>
          <span className="flex-1 text-sm">{opt.content}</span>
          {!isTrueFalse && (
            <button
              type="button"
              onClick={() => handleDeleteOption(opt.id)}
              className="shrink-0 text-inkMuted hover:text-blushInk"
            >
              <Icon name="trash" size={12} />
            </button>
          )}
        </div>
      ))}

      {!isTrueFalse && (
        <div className="flex gap-2">
          <Input
            placeholder="Nova opção…"
            value={newContent}
            onChange={(e) => setNewContent(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleAddOption(); }}}
          />
          <Button size="sm" variant="ghost" onClick={handleAddOption} loading={adding} disabled={!newContent.trim()}>
            <Icon name="plus" size={14} />
          </Button>
        </div>
      )}
    </div>
  );
}
