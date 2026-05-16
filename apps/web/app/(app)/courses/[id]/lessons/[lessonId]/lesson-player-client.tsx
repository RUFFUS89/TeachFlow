"use client";

import { ApiError } from "@teachflow/api-client";
import type { CourseDetail, Lesson, LessonAttachment, LessonComment } from "@teachflow/database";
import {
  Avatar,
  Button,
  Card,
  Chip,
  EmptyState,
  Icon,
  PageHeader,
  Textarea,
} from "@teachflow/ui";
import Link from "next/link";
import { useEffect, useState } from "react";

import { useApiClient } from "@/lib/api";

// =============================================================================
// Root
// =============================================================================

export function LessonPlayerClient({
  lesson: initialLesson,
  course,
  isStaff,
  profileId,
}: {
  lesson: Lesson;
  course: CourseDetail;
  isStaff: boolean;
  profileId: string;
}) {
  const api = useApiClient();
  const [lesson, setLesson] = useState(initialLesson);
  const [progress, setProgress] = useState<"not_started" | "in_progress" | "completed">(
    "not_started",
  );
  const [favorited, setFavorited] = useState(false);
  const [tab, setTab] = useState<"content" | "comments" | "materials">("content");

  async function handleMarkCompleted() {
    try {
      const p = await api.lessons.updateProgress(lesson.id, { status: "completed" });
      setProgress(p.status);
    } catch {
      // ignore
    }
  }

  async function handleToggleFavorite() {
    try {
      const { favorited: f } = await api.lessons.favorite(lesson.id);
      setFavorited(f);
    } catch {
      // ignore
    }
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-inkMuted">
        <Link href={`/courses/${course.id}`} className="hover:text-ink">
          {course.title}
        </Link>
        <Icon name="chevron-right" size={14} />
        <span className="text-ink">{lesson.title}</span>
      </div>

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex flex-col gap-1">
          <PageHeader title={lesson.title} />
          {lesson.description && (
            <p className="text-sm text-inkMuted">{lesson.description}</p>
          )}
        </div>
        <div className="flex shrink-0 gap-2">
          {isStaff && (
            <Link href={`/courses/${course.id}/lessons/${lesson.id}/edit`}>
              <Button variant="ghost" size="sm">
                <Icon name="edit" size={14} />
                Editar
              </Button>
            </Link>
          )}
          <button
            type="button"
            onClick={handleToggleFavorite}
            className={[
              "rounded-card border p-2 transition-colors",
              favorited
                ? "border-blushInk bg-blush text-blushInk"
                : "border-border text-inkMuted hover:text-ink",
            ].join(" ")}
            title={favorited ? "Remover dos favoritos" : "Adicionar aos favoritos"}
          >
            <Icon name="heart" size={16} />
          </button>
        </div>
      </div>

      {/* Video */}
      {lesson.video_url && (
        <VideoPlayer url={lesson.video_url} provider={lesson.video_provider} />
      )}

      {/* Mark as completed */}
      {!isStaff && (
        <div className="flex justify-end">
          {progress === "completed" ? (
            <Chip tone="sage">
              <Icon name="check-circle" size={14} />
              Concluída
            </Chip>
          ) : (
            <Button size="sm" onClick={handleMarkCompleted}>
              <Icon name="check-circle" size={14} />
              Marcar como concluída
            </Button>
          )}
        </div>
      )}

      {/* Tab pills */}
      <div className="flex gap-1 border-b border-border pb-0">
        {(["content", "comments", "materials"] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={[
              "px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px",
              tab === t
                ? "border-ink text-ink"
                : "border-transparent text-inkMuted hover:text-ink",
            ].join(" ")}
          >
            {t === "content" ? "Conteúdo" : t === "comments" ? "Comentários" : "Materiais"}
          </button>
        ))}
      </div>

      {tab === "content" && <ContentTab lesson={lesson} />}
      {tab === "comments" && (
        <CommentsTab lessonId={lesson.id} profileId={profileId} />
      )}
      {tab === "materials" && (
        <MaterialsTab lessonId={lesson.id} isStaff={isStaff} />
      )}
    </div>
  );
}

// =============================================================================
// Video player
// =============================================================================

function VideoPlayer({
  url,
  provider,
}: {
  url: string;
  provider: Lesson["video_provider"];
}) {
  function getEmbedUrl(): string | null {
    if (!provider || provider === "self_hosted") return null;
    if (provider === "youtube") {
      const match = url.match(
        /(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([A-Za-z0-9_-]{11})/,
      );
      return match ? `https://www.youtube.com/embed/${match[1]}?rel=0` : null;
    }
    if (provider === "vimeo") {
      const match = url.match(/vimeo\.com\/(\d+)/);
      return match ? `https://player.vimeo.com/video/${match[1]}` : null;
    }
    if (provider === "mux") {
      return url; // Mux provides embed-ready URLs
    }
    return null;
  }

  const embedUrl = getEmbedUrl();

  if (provider === "self_hosted") {
    return (
      <div className="overflow-hidden rounded-card bg-black">
        <video src={url} controls className="w-full max-h-[480px]" />
      </div>
    );
  }

  if (embedUrl) {
    return (
      <div className="relative overflow-hidden rounded-card bg-black" style={{ paddingTop: "56.25%" }}>
        <iframe
          src={embedUrl}
          className="absolute inset-0 h-full w-full"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          title="Video da aula"
        />
      </div>
    );
  }

  return (
    <Card>
      <div className="flex items-center gap-2 text-sm text-inkMuted">
        <Icon name="external" size={14} />
        <a href={url} target="_blank" rel="noopener noreferrer" className="underline hover:text-ink">
          Abrir vídeo externo
        </a>
      </div>
    </Card>
  );
}

// =============================================================================
// Content tab
// =============================================================================

function ContentTab({ lesson }: { lesson: Lesson }) {
  if (!lesson.content) {
    return (
      <EmptyState
        icon="book"
        title="Sem conteúdo adicional"
        description="O professor não adicionou conteúdo textual a esta aula."
      />
    );
  }

  return (
    <Card>
      <div className="prose prose-sm max-w-none whitespace-pre-wrap text-sm leading-relaxed">
        {lesson.content}
      </div>
    </Card>
  );
}

// =============================================================================
// Comments tab
// =============================================================================

function CommentsTab({
  lessonId,
  profileId,
}: {
  lessonId: string;
  profileId: string;
}) {
  const api = useApiClient();
  const [comments, setComments] = useState<LessonComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [text, setText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.lessons.comments
      .list(lessonId)
      .then(setComments)
      .finally(() => setLoading(false));
  }, [lessonId]); // eslint-disable-line react-hooks/exhaustive-deps

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!text.trim()) return;
    setSubmitting(true);
    setError(null);
    try {
      const comment = await api.lessons.comments.create(lessonId, { content: text.trim() });
      setComments((prev) => [...prev, comment]);
      setText("");
    } catch (err) {
      setError(err instanceof ApiError ? err.detail : "Erro ao enviar comentário");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(commentId: string) {
    if (!confirm("Remover comentário?")) return;
    await api.lessons.comments.delete(commentId);
    setComments((prev) => prev.filter((c) => c.id !== commentId));
  }

  if (loading) {
    return (
      <div className="flex flex-col gap-3">
        {[1, 2].map((i) => (
          <div key={i} className="h-16 animate-pulse rounded-card bg-surface2" />
        ))}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Input */}
      <form onSubmit={handleSubmit} className="flex flex-col gap-2">
        {error && (
          <div className="rounded-card bg-blush px-4 py-2 text-sm text-blushInk">{error}</div>
        )}
        <Textarea
          placeholder="Adicione um comentário…"
          rows={3}
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
        <div className="flex justify-end">
          <Button type="submit" size="sm" loading={submitting} disabled={!text.trim()}>
            Comentar
          </Button>
        </div>
      </form>

      {comments.length === 0 ? (
        <EmptyState
          icon="comment"
          title="Nenhum comentário ainda"
          description="Seja o primeiro a comentar nesta aula."
        />
      ) : (
        <div className="flex flex-col gap-3">
          {comments.map((comment) => (
            <div key={comment.id} className="flex gap-3">
              <Avatar
                src={comment.author_avatar_url ?? undefined}
                name={comment.author_name}
                size="sm"
              />
              <div className="flex flex-1 flex-col gap-1 rounded-card border border-border bg-surface p-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-medium">{comment.author_name}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-inkMuted">
                      {new Date(comment.created_at).toLocaleDateString("pt-BR")}
                    </span>
                    {comment.author_id === profileId && (
                      <button
                        type="button"
                        onClick={() => handleDelete(comment.id)}
                        className="text-inkMuted hover:text-blushInk"
                        title="Remover"
                      >
                        <Icon name="trash" size={12} />
                      </button>
                    )}
                  </div>
                </div>
                <p className="text-sm">{comment.content}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// =============================================================================
// Materials tab
// =============================================================================

function MaterialsTab({
  lessonId,
  isStaff,
}: {
  lessonId: string;
  isStaff: boolean;
}) {
  const api = useApiClient();
  const [attachments, setAttachments] = useState<LessonAttachment[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchingUrl, setFetchingUrl] = useState<string | null>(null);

  useEffect(() => {
    api.lessons.attachments
      .list(lessonId)
      .then(setAttachments)
      .finally(() => setLoading(false));
  }, [lessonId]); // eslint-disable-line react-hooks/exhaustive-deps

  async function handleDownload(attachment: LessonAttachment) {
    setFetchingUrl(attachment.id);
    try {
      const { url } = await api.lessons.attachments.signedUrl(lessonId, attachment.id);
      window.open(url, "_blank");
    } catch {
      // ignore
    } finally {
      setFetchingUrl(null);
    }
  }

  if (loading) {
    return <div className="h-16 animate-pulse rounded-card bg-surface2" />;
  }

  if (attachments.length === 0) {
    return (
      <EmptyState
        icon="paperclip"
        title="Nenhum material"
        description={
          isStaff
            ? "Adicione materiais complementares via editor da aula."
            : "O professor não adicionou materiais a esta aula."
        }
      />
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {attachments.map((a) => (
        <div
          key={a.id}
          className="flex items-center gap-3 rounded-card border border-border bg-surface px-4 py-3"
        >
          <Icon name="paperclip" size={16} className="shrink-0 text-inkMuted" />
          <div className="flex-1 min-w-0">
            <p className="truncate text-sm font-medium">{a.name}</p>
            {a.size_bytes && (
              <p className="text-xs text-inkMuted">
                {(a.size_bytes / 1024).toFixed(0)} KB
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={() => handleDownload(a)}
            disabled={fetchingUrl === a.id}
            className="shrink-0 rounded p-1 text-inkMuted hover:text-ink disabled:opacity-50"
            title="download"
          >
            <Icon name={fetchingUrl === a.id ? "clock" : "download"} size={16} />
          </button>
        </div>
      ))}
    </div>
  );
}
