"use client";

import { ApiError } from "@teachflow/api-client";
import type { Me } from "@teachflow/database";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { useApiClient } from "@/lib/api";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export function DashboardClient() {
  const router = useRouter();
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

  async function handleSignOut() {
    const supabase = createSupabaseBrowserClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <div className="max-w-3xl mx-auto">
      <header className="flex items-baseline justify-between mb-10">
        <div>
          <p className="font-mono text-xs tracking-widest uppercase text-inkMuted">
            TeachFlow
          </p>
          <h1 className="font-display text-3xl text-ink">Dashboard</h1>
        </div>
        <button
          onClick={handleSignOut}
          className="text-sm text-inkSoft hover:text-ink transition"
        >
          Sair
        </button>
      </header>

      {loading && (
        <div className="bg-surface border border-border rounded-card p-6 text-inkMuted">
          Carregando perfil…
        </div>
      )}

      {error && (
        <div className="bg-blush/30 border border-blushInk/20 rounded-card p-6">
          <p className="font-medium text-blushInk mb-2">Erro ao carregar perfil</p>
          <p className="text-sm text-blushInk/90 font-mono">{error}</p>
          <p className="text-sm text-inkSoft mt-3">
            Verifique se o backend FastAPI está rodando em{" "}
            <code className="font-mono bg-surface2 px-1 rounded">
              {process.env.NEXT_PUBLIC_API_URL}
            </code>{" "}
            e se o <code className="font-mono">.env.local</code> tem as chaves do Supabase.
          </p>
        </div>
      )}

      {me && (
        <div className="space-y-6">
          <div className="bg-sage rounded-card p-6">
            <p className="font-mono text-xs tracking-widest uppercase text-sageInk/70 mb-2">
              ✓ Stack funcionando ponta a ponta
            </p>
            <h2 className="font-display text-2xl text-sageInk leading-tight">
              Olá, {me.profile.full_name}
            </h2>
            <p className="text-sageInk/80 text-sm mt-1">
              Frontend → Supabase Auth → Backend FastAPI → Postgres. Tudo conversa.
            </p>
          </div>

          <section className="bg-surface border border-border rounded-card p-6">
            <h3 className="font-display text-lg text-ink mb-4">Seu perfil</h3>
            <dl className="grid grid-cols-[140px_1fr] gap-y-2 text-sm">
              <dt className="text-inkMuted">ID</dt>
              <dd className="font-mono text-xs text-inkSoft break-all">{me.profile.id}</dd>
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
          </section>
        </div>
      )}
    </div>
  );
}
