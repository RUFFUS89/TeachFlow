"use client";

import type { BranchWithStats } from "@teachflow/database";
import { Button, Card, Chip, EmptyState, Icon, PageHeader } from "@teachflow/ui";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { useApiClient } from "@/lib/api";

const TONE_CYCLE = ["peach", "sage", "caramel", "butter", "blush", "lilac"] as const;

export function BranchesClient({ branches: initial }: { branches: BranchWithStats[] }) {
  const api = useApiClient();
  const router = useRouter();
  const [branches, setBranches] = useState(initial);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ name: "", slug: "", city: "", state: "" });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await api.branches.create({
        name: form.name.trim(),
        slug: form.slug.trim(),
        city: form.city.trim() || null,
        state: form.state.trim() || null,
      });
      router.refresh();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Erro ao criar filial";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  function autoSlug(name: string) {
    return name
      .toLowerCase()
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <PageHeader title="Filiais" />
        <Button size="sm" onClick={() => setCreating(true)}>
          <Icon name="plus" size={14} />
          Nova filial
        </Button>
      </div>

      {creating && (
        <Card>
          <form onSubmit={handleCreate} className="flex flex-col gap-4">
            <p className="font-medium">Nova filial</p>
            {error && (
              <div className="rounded-card bg-blush px-3 py-2 text-sm text-blushInk">{error}</div>
            )}
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1">
                <label className="text-xs text-inkMuted">Nome *</label>
                <input
                  className="rounded-card border border-border bg-surface px-3 py-2 text-sm text-ink outline-none focus:ring-2 focus:ring-accent"
                  value={form.name}
                  onChange={(e) => {
                    const name = e.target.value;
                    setForm((f) => ({ ...f, name, slug: autoSlug(name) }));
                  }}
                  required
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs text-inkMuted">Slug *</label>
                <input
                  className="rounded-card border border-border bg-surface px-3 py-2 font-mono text-sm text-ink outline-none focus:ring-2 focus:ring-accent"
                  value={form.slug}
                  onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))}
                  pattern="^[a-z0-9-]+$"
                  required
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs text-inkMuted">Cidade</label>
                <input
                  className="rounded-card border border-border bg-surface px-3 py-2 text-sm text-ink outline-none focus:ring-2 focus:ring-accent"
                  value={form.city}
                  onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))}
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs text-inkMuted">UF</label>
                <input
                  className="rounded-card border border-border bg-surface px-3 py-2 text-sm uppercase text-ink outline-none focus:ring-2 focus:ring-accent"
                  value={form.state}
                  maxLength={2}
                  onChange={(e) => setForm((f) => ({ ...f, state: e.target.value.toUpperCase() }))}
                />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="ghost" onClick={() => setCreating(false)}>
                Cancelar
              </Button>
              <Button type="submit" loading={loading}>
                Criar filial
              </Button>
            </div>
          </form>
        </Card>
      )}

      {branches.length === 0 ? (
        <EmptyState
          icon="branch"
          title="Nenhuma filial ainda"
          description="Crie sua primeira filial para começar a gerenciar cursos e alunos."
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {branches.map((branch, i) => (
            <BranchCard key={branch.id} branch={branch} tone={TONE_CYCLE[i % TONE_CYCLE.length]!} />
          ))}
        </div>
      )}
    </div>
  );
}

function BranchCard({
  branch,
  tone,
}: {
  branch: BranchWithStats;
  tone: (typeof TONE_CYCLE)[number];
}) {
  return (
    <Link href={`/branches/${branch.id}`} className="group block">
      <Card tone={tone} className="flex flex-col gap-4 transition-shadow group-hover:shadow-md">
        <div className="flex items-start justify-between gap-2">
          <div className="flex flex-col gap-0.5">
            <span className="font-semibold text-ink">{branch.name}</span>
            {(branch.city || branch.state) && (
              <span className="text-xs text-inkMuted">
                {[branch.city, branch.state].filter(Boolean).join(" · ")}
              </span>
            )}
          </div>
          <Chip tone={branch.status === "active" ? "sage" : "blush"} size="sm">
            {branch.status === "active" ? "Ativa" : "Inativa"}
          </Chip>
        </div>

        <div className="grid grid-cols-3 gap-2 text-center">
          {[
            { label: "Membros", value: branch.members_count },
            { label: "Alunos", value: branch.students_count },
            { label: "Cursos", value: branch.active_courses_count },
          ].map((s) => (
            <div key={s.label} className="flex flex-col gap-0.5">
              <span className="text-lg font-semibold text-ink">{s.value}</span>
              <span className="text-xs text-inkMuted">{s.label}</span>
            </div>
          ))}
        </div>
      </Card>
    </Link>
  );
}
