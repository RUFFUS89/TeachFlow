"use client";

import { ApiError } from "@teachflow/api-client";
import type {
  Branch,
  BranchInsights,
  BranchMemberWithProfile,
  BranchRole,
  InviteCode,
} from "@teachflow/database";
import {
  Avatar,
  Button,
  Card,
  Chip,
  EmptyState,
  Icon,
  Modal,
  PageHeader,
  Stat,
  TabPills,
} from "@teachflow/ui";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { useApiClient } from "@/lib/api";

const TABS = [
  { value: "members", label: "Membros" },
  { value: "invites", label: "Convites" },
  { value: "insights", label: "Insights" },
];

const ROLE_LABEL: Record<BranchRole, string> = {
  owner: "OWNER",
  admin: "Admin",
  usuario: "Aluno",
};

const ROLE_TONE: Record<BranchRole, "lilac" | "caramel" | "sage"> = {
  owner: "lilac",
  admin: "caramel",
  usuario: "sage",
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" });
}

export function BranchDetailClient({
  branch,
  initialTab,
}: {
  branch: Branch;
  initialTab: string;
}) {
  const api = useApiClient();
  const router = useRouter();
  const [tab, setTab] = useState(initialTab);

  function changeTab(value: string) {
    setTab(value);
    router.replace(`/branches/${branch.id}?tab=${value}`, { scroll: false });
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-inkMuted">
        <Link href="/branches" className="hover:text-ink">
          Filiais
        </Link>
        <Icon name="chevron-right" size={14} />
        <span className="text-ink">{branch.name}</span>
      </div>

      <div className="flex items-center justify-between gap-4 flex-wrap">
        <PageHeader title={branch.name} />
        <div className="flex items-center gap-2 text-sm text-inkMuted">
          {branch.city && <span>{branch.city}</span>}
          {branch.state && <span>{branch.state}</span>}
          <Chip tone={branch.status === "active" ? "sage" : "blush"} size="sm">
            {branch.status === "active" ? "Ativa" : "Inativa"}
          </Chip>
        </div>
      </div>

      <TabPills items={TABS} value={tab} onChange={changeTab} />

      {tab === "members" && <MembersTab branchId={branch.id} api={api} />}
      {tab === "invites" && <InvitesTab branchId={branch.id} api={api} />}
      {tab === "insights" && <InsightsTab branchId={branch.id} api={api} />}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Tab: Membros
// ---------------------------------------------------------------------------

function MembersTab({ branchId, api }: { branchId: string; api: ReturnType<typeof useApiClient> }) {
  const [members, setMembers] = useState<BranchMemberWithProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [removing, setRemoving] = useState<string | null>(null);

  useEffect(() => {
    api.branches.members.list(branchId).then(setMembers).finally(() => setLoading(false));
  }, [branchId, api]);

  const filtered = q
    ? members.filter((m) => m.full_name.toLowerCase().includes(q.toLowerCase()))
    : members;

  async function handleRemove(memberId: string) {
    if (!confirm("Remover este membro da filial?")) return;
    setRemoving(memberId);
    try {
      await api.branches.members.remove(branchId, memberId);
      setMembers((prev) => prev.filter((m) => m.id !== memberId));
    } finally {
      setRemoving(null);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-sm text-inkMuted">
        <Icon name="refresh" size={14} className="animate-spin" />
        Carregando…
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <div className="relative flex-1 max-w-sm">
          <Icon name="search" size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-inkMuted" />
          <input
            className="w-full rounded-card border border-border bg-surface py-2 pl-9 pr-3 text-sm text-ink outline-none focus:ring-2 focus:ring-accent"
            placeholder="Buscar por nome…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon="people" title="Nenhum membro encontrado" />
      ) : (
        <Card className="overflow-hidden p-0">
          <table className="w-full text-sm">
            <thead className="border-b border-border bg-surface2">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-inkMuted">Membro</th>
                <th className="px-4 py-3 text-left font-medium text-inkMuted">Papel</th>
                <th className="px-4 py-3 text-left font-medium text-inkMuted">Status</th>
                <th className="px-4 py-3 text-left font-medium text-inkMuted">Desde</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map((m) => (
                <tr key={m.id} className="hover:bg-surface2/50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <Avatar name={m.full_name} src={m.avatar_url ?? undefined} size="sm" />
                      <span className="font-medium text-ink">{m.full_name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <Chip tone={ROLE_TONE[m.role]} size="sm">
                      {ROLE_LABEL[m.role]}
                    </Chip>
                  </td>
                  <td className="px-4 py-3">
                    <Chip tone={m.status === "active" ? "sage" : "blush"} size="sm">
                      {m.status === "active" ? "Ativo" : "Inativo"}
                    </Chip>
                  </td>
                  <td className="px-4 py-3 text-inkMuted">{formatDate(m.created_at)}</td>
                  <td className="px-4 py-3 text-right">
                    {m.role !== "owner" && (
                      <Button
                        variant="ghost"
                        size="sm"
                        loading={removing === m.id}
                        onClick={() => handleRemove(m.id)}
                        aria-label="Remover membro"
                      >
                        <Icon name="trash" size={14} />
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Tab: Convites
// ---------------------------------------------------------------------------

function InvitesTab({ branchId, api }: { branchId: string; api: ReturnType<typeof useApiClient> }) {
  const [invites, setInvites] = useState<InviteCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState<{ role: BranchRole; max_uses: number; days_valid: number }>({
    role: "usuario",
    max_uses: 1,
    days_valid: 7,
  });
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  useEffect(() => {
    api.branches.invites.list(branchId).then(setInvites).finally(() => setLoading(false));
  }, [branchId, api]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setCreating(true);
    setCreateError(null);
    try {
      const inv = await api.branches.invites.create(branchId, form);
      setInvites((prev) => [inv, ...prev]);
      setShowCreate(false);
    } catch (err) {
      setCreateError(err instanceof ApiError ? err.detail : "Erro ao gerar convite");
    } finally {
      setCreating(false);
    }
  }

  async function handleRevoke(inviteId: string) {
    if (!confirm("Revogar este convite?")) return;
    await api.branches.invites.revoke(branchId, inviteId);
    setInvites((prev) =>
      prev.map((inv) =>
        inv.id === inviteId ? { ...inv, revoked_at: new Date().toISOString(), is_active: false } : inv,
      ),
    );
  }

  async function copyCode(code: string) {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(code);
      setTimeout(() => setCopied(null), 2000);
    } catch {
      // fallback: noop
    }
  }

  const redeemUrl = (code: string) =>
    typeof window !== "undefined"
      ? `${window.location.origin}/redeem/${code}`
      : `/redeem/${code}`;

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-sm text-inkMuted">
        <Icon name="refresh" size={14} className="animate-spin" />
        Carregando…
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-end">
        <Button size="sm" onClick={() => setShowCreate(true)}>
          <Icon name="plus" size={14} />
          Gerar convite
        </Button>
      </div>

      <Modal
        open={showCreate}
        onClose={() => setShowCreate(false)}
        title="Gerar código de convite"
        description="O convidado usa o link para criar a conta e entrar na filial com o papel selecionado."
        footer={
          <>
            <Button variant="ghost" onClick={() => setShowCreate(false)}>
              Cancelar
            </Button>
            <Button form="invite-form" type="submit" loading={creating}>
              Gerar
            </Button>
          </>
        }
      >
        <form id="invite-form" onSubmit={handleCreate} className="flex flex-col gap-4">
          {createError && (
            <div className="rounded-card bg-blush px-3 py-2 text-sm text-blushInk">{createError}</div>
          )}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-ink">Papel do convidado</label>
            <select
              className="rounded-card border border-border bg-surface px-3 py-2 text-sm text-ink outline-none focus:ring-2 focus:ring-accent"
              value={form.role}
              onChange={(e) => setForm((f) => ({ ...f, role: e.target.value as BranchRole }))}
            >
              <option value="usuario">Aluno (usuario)</option>
              <option value="admin">Professor (admin)</option>
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-ink">Máx. de usos</label>
              <input
                type="number"
                min={1}
                max={100}
                className="rounded-card border border-border bg-surface px-3 py-2 text-sm text-ink outline-none focus:ring-2 focus:ring-accent"
                value={form.max_uses}
                onChange={(e) => setForm((f) => ({ ...f, max_uses: Number(e.target.value) }))}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-ink">Válido por (dias)</label>
              <input
                type="number"
                min={1}
                max={90}
                className="rounded-card border border-border bg-surface px-3 py-2 text-sm text-ink outline-none focus:ring-2 focus:ring-accent"
                value={form.days_valid}
                onChange={(e) => setForm((f) => ({ ...f, days_valid: Number(e.target.value) }))}
              />
            </div>
          </div>
        </form>
      </Modal>

      {invites.length === 0 ? (
        <EmptyState
          icon="people"
          title="Nenhum convite ainda"
          description="Gere um código para convidar alunos ou professores para esta filial."
        />
      ) : (
        <div className="flex flex-col gap-2">
          {invites.map((inv) => (
            <Card key={inv.id} className="flex items-center gap-4 py-3">
              <div className="flex flex-1 flex-col gap-0.5">
                <div className="flex items-center gap-2">
                  <code className="font-mono text-sm font-semibold tracking-wider text-ink">
                    {inv.code}
                  </code>
                  {inv.is_active ? (
                    <Chip tone="sage" size="sm">Ativo</Chip>
                  ) : inv.revoked_at ? (
                    <Chip tone="blush" size="sm">Revogado</Chip>
                  ) : (
                    <Chip tone="caramel" size="sm">Expirado</Chip>
                  )}
                  <Chip tone={ROLE_TONE[inv.role]} size="sm">
                    {ROLE_LABEL[inv.role]}
                  </Chip>
                </div>
                <span className="text-xs text-inkMuted">
                  {inv.used_count}/{inv.max_uses} usos · expira {formatDate(inv.expires_at)}
                </span>
              </div>
              {inv.is_active && (
                <div className="flex items-center gap-1.5">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyCode(redeemUrl(inv.code))}
                    aria-label="Copiar link"
                  >
                    <Icon name={copied === redeemUrl(inv.code) ? "check" : "external"} size={14} />
                    {copied === redeemUrl(inv.code) ? "Copiado!" : "Copiar link"}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRevoke(inv.id)}
                    aria-label="Revogar"
                  >
                    <Icon name="x" size={14} />
                  </Button>
                </div>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Tab: Insights
// ---------------------------------------------------------------------------

function InsightsTab({
  branchId,
  api,
}: {
  branchId: string;
  api: ReturnType<typeof useApiClient>;
}) {
  const [insights, setInsights] = useState<BranchInsights | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.branches.insights(branchId).then(setInsights).finally(() => setLoading(false));
  }, [branchId, api]);

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-sm text-inkMuted">
        <Icon name="refresh" size={14} className="animate-spin" />
        Carregando…
      </div>
    );
  }

  if (!insights) return null;

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <Stat label="Total de membros" value={insights.total_members} icon="people" tone="lilac" />
      <Stat label="Alunos ativos" value={insights.active_students} icon="course" tone="sage" />
      <Stat label="Cursos ativos" value={insights.active_courses} icon="book" tone="caramel" />
      <Stat label="Entregas pendentes" value={insights.pending_submissions} icon="clip" tone="blush" />
      <Stat
        label="Taxa de conclusão"
        value={`${insights.completion_rate_percent.toFixed(1)}%`}
        icon="chart"
        tone="butter"
      />
    </div>
  );
}
