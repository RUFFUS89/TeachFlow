"use client";

import { ApiError } from "@teachflow/api-client";
import type { Lesson } from "@teachflow/database";
import {
  Button,
  Card,
  Chip,
  Icon,
  Input,
  Label,
  PageHeader,
  Select,
  Textarea,
} from "@teachflow/ui";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { useApiClient } from "@/lib/api";

const PROVIDER_OPTIONS = [
  { value: "", label: "Nenhum (sem vídeo)" },
  { value: "youtube", label: "YouTube" },
  { value: "vimeo", label: "Vimeo" },
  { value: "mux", label: "Mux" },
  { value: "self_hosted", label: "Self-hosted" },
] as const;

export function LessonEditClient({
  lesson: initial,
  courseId,
}: {
  lesson: Lesson;
  courseId: string;
}) {
  const api = useApiClient();
  const router = useRouter();

  const [title, setTitle] = useState(initial.title);
  const [description, setDescription] = useState(initial.description ?? "");
  const [content, setContent] = useState(initial.content ?? "");
  const [videoUrl, setVideoUrl] = useState(initial.video_url ?? "");
  const [videoProvider, setVideoProvider] = useState<Lesson["video_provider"] | "">(
    initial.video_provider ?? "",
  );
  const [isEssential, setIsEssential] = useState(initial.is_essential);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    setLoading(true);
    setError(null);
    try {
      await api.lessons.update(initial.id, {
        title: title.trim(),
        description: description.trim() || null,
        content: content.trim() || null,
        video_url: videoUrl.trim() || null,
        video_provider: (videoProvider || null) as Lesson["video_provider"],
        is_essential: isEssential,
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (err) {
      setError(err instanceof ApiError ? err.detail : "Erro ao salvar");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-inkMuted">
        <Link href={`/courses/${courseId}`} className="hover:text-ink">
          Curso
        </Link>
        <Icon name="ChevronRight" size={14} />
        <Link
          href={`/courses/${courseId}/lessons/${initial.id}`}
          className="hover:text-ink"
        >
          {initial.title}
        </Link>
        <Icon name="ChevronRight" size={14} />
        <span className="text-ink">Editar</span>
      </div>

      <div className="flex items-center justify-between">
        <PageHeader title="Editar aula" />
        <Link href={`/courses/${courseId}/lessons/${initial.id}`}>
          <Button variant="ghost" size="sm">
            <Icon name="Eye" size={14} />
            Ver aula
          </Button>
        </Link>
      </div>

      <Card>
        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          {error && (
            <div className="rounded-card bg-blush px-4 py-3 text-sm text-blushInk">{error}</div>
          )}
          {saved && (
            <div className="rounded-card bg-sage px-4 py-3 text-sm text-sageInk">
              Aula salva com sucesso.
            </div>
          )}

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="lesson-title">Título *</Label>
            <Input
              id="lesson-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="lesson-desc">Descrição curta</Label>
            <Input
              id="lesson-desc"
              placeholder="Resumo em 1-2 frases (opcional)"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="video-provider">Plataforma de vídeo</Label>
              <Select
                id="video-provider"
                value={videoProvider}
                onChange={(e) =>
                  setVideoProvider(e.target.value as Lesson["video_provider"] | "")
                }
              >
                {PROVIDER_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </Select>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="video-url">URL do vídeo</Label>
              <Input
                id="video-url"
                placeholder="https://youtube.com/watch?v=..."
                value={videoUrl}
                onChange={(e) => setVideoUrl(e.target.value)}
                disabled={!videoProvider}
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="lesson-content">Conteúdo / Transcrição</Label>
            <Textarea
              id="lesson-content"
              rows={12}
              placeholder="Texto da aula, transcrição do vídeo, anotações…"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="font-mono text-sm"
            />
          </div>

          <div className="flex items-center gap-3">
            <input
              id="is-essential"
              type="checkbox"
              checked={isEssential}
              onChange={(e) => setIsEssential(e.target.checked)}
              className="size-4 rounded border-border accent-ink"
            />
            <label htmlFor="is-essential" className="text-sm">
              Aula essencial
              <span className="ml-1 text-xs text-inkMuted">
                (marcada como obrigatória para conclusão do curso)
              </span>
            </label>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => router.push(`/courses/${courseId}/lessons/${initial.id}`)}
            >
              Cancelar
            </Button>
            <Button type="submit" loading={loading} disabled={!title.trim()}>
              Salvar aula
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
