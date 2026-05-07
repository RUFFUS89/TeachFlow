"use client";

import { ApiError } from "@teachflow/api-client";
import { Button, Card, Input, Label, PageHeader, Textarea, type Tone } from "@teachflow/ui";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { useApiClient } from "@/lib/api";

const TONE_OPTIONS: { value: string; label: string; tone: Tone }[] = [
  { value: "peach", label: "Pêssego", tone: "peach" },
  { value: "sage", label: "Sálvia", tone: "sage" },
  { value: "caramel", label: "Caramelo", tone: "caramel" },
  { value: "butter", label: "Manteiga", tone: "butter" },
  { value: "blush", label: "Rosa", tone: "blush" },
  { value: "lilac", label: "Lilás", tone: "lilac" },
  { value: "accent", label: "Azul", tone: "accent" },
];

const TONE_BG_CLASS: Record<string, string> = {
  peach: "bg-peach",
  sage: "bg-sage",
  caramel: "bg-caramel",
  butter: "bg-butter",
  blush: "bg-blush",
  lilac: "bg-lilac",
  accent: "bg-accent",
};

export function NewCourseClient({ branchId }: { branchId: string }) {
  const api = useApiClient();
  const router = useRouter();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [colorTone, setColorTone] = useState<string>("sage");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;

    setLoading(true);
    setError(null);
    try {
      const course = await api.courses.create({
        branch_id: branchId,
        title: title.trim(),
        description: description.trim() || null,
        color_tone: colorTone,
      });
      router.push(`/dashboard`);
      router.refresh();
      void course;
    } catch (err) {
      setError(err instanceof ApiError ? err.detail : "Erro ao criar curso");
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6">
      <PageHeader
        eyebrow="Cursos"
        title="Novo curso"
        description="Preencha os dados básicos. Você pode adicionar aulas e atividades depois."
      />

      <Card>
        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          {error && (
            <div className="rounded-card bg-blush px-4 py-3 text-sm text-blushInk">{error}</div>
          )}

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="title">Nome do curso *</Label>
            <Input
              id="title"
              placeholder="Ex: Redação para o ENEM"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              autoFocus
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="description">Descrição</Label>
            <Textarea
              id="description"
              placeholder="Descreva brevemente o curso (opcional)"
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label>Tom de cor</Label>
            <div className="flex flex-wrap gap-2">
              {TONE_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setColorTone(opt.value)}
                  title={opt.label}
                  className={[
                    "size-8 rounded-full border-2 transition-transform hover:scale-110",
                    TONE_BG_CLASS[opt.value],
                    colorTone === opt.value
                      ? "border-ink scale-110"
                      : "border-transparent",
                  ].join(" ")}
                  aria-pressed={colorTone === opt.value}
                />
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => router.back()}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button type="submit" loading={loading} disabled={!title.trim()}>
              Criar curso
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
