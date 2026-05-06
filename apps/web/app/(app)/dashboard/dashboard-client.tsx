"use client";

import { ApiError } from "@teachflow/api-client";
import type { Me } from "@teachflow/database";
import { Card, PageHeader, Skeleton } from "@teachflow/ui";
import { useEffect, useState } from "react";

import { useApiClient } from "@/lib/api";

export function DashboardClient() {
  const api = useApiClient();
  const [me, setMe] = useState<Me | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await api.me.get();
        if (!cancelled) {
          setMe(data);
          setLoading(false);
        }
      } catch (e) {
        if (cancelled) return;
        if (e instanceof ApiError) {
          setError(`[${e.status}] ${e.detail}`);
        } else {
          setError(e instanceof Error ? e.message : "Erro desconhecido");
        }
        setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [api]);

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6">
      <PageHeader
        eyebrow="TeachFlow"
        title="Dashboard"
        description="Validação técnica end-to-end (Supabase Auth → FastAPI → Postgres). Refeito de verdade na Fase 2."
      />

      {loading && <Skeleton className="h-32" />}

      {error && (
        <Card tone="blush">
          <p className="font-medium">Erro ao carregar perfil</p>
          <p className="mt-2 font-mono text-sm">{error}</p>
          <p className="mt-3 text-sm">
            Verifique se o backend FastAPI está rodando em{" "}
            <code className="rounded bg-surface2 px-1 font-mono">
              {process.env.NEXT_PUBLIC_API_URL}
            </code>{" "}
            e se o <code className="font-mono">.env.local</code> tem as chaves do Supabase.
          </p>
        </Card>
      )}

      {me && (
        <>
          <Card tone="sage">
            <p className="font-mono text-xs uppercase tracking-widest opacity-70">
              Stack funcionando ponta a ponta
            </p>
            <h2 className="mt-2 font-display text-2xl leading-tight">
              Olá, {me.profile.full_name}
            </h2>
            <p className="mt-1 text-sm opacity-80">
              Frontend → Supabase Auth → Backend FastAPI → Postgres. Tudo conversa.
            </p>
          </Card>

          <Card>
            <h3 className="mb-4 font-display text-lg text-ink">Seu perfil</h3>
            <dl className="grid grid-cols-[140px_1fr] gap-y-2 text-sm">
              <dt className="text-inkMuted">ID</dt>
              <dd className="break-all font-mono text-xs text-inkSoft">{me.profile.id}</dd>
              <dt className="text-inkMuted">Nome</dt>
              <dd className="text-ink">{me.profile.full_name}</dd>
              <dt className="text-inkMuted">Filiais</dt>
              <dd className="text-ink">
                {me.memberships.length === 0 ? (
                  <span className="text-inkMuted">
                    Nenhuma — você ainda não pertence a nenhuma filial.
                  </span>
                ) : (
                  <ul className="space-y-1">
                    {me.memberships.map((m) => (
                      <li key={m.branch_id}>
                        <span className="font-mono text-xs">{m.branch_id}</span>{" "}
                        <span className="text-inkMuted">·</span>{" "}
                        <span className="capitalize">{m.role}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </dd>
            </dl>
          </Card>
        </>
      )}
    </div>
  );
}
