import "server-only";

import { ApiError } from "@teachflow/api-client";
import type { BranchRole, Me } from "@teachflow/database";

import { createServerApiClient } from "./api-server";

/**
 * Tenta obter o perfil + memberships do usuário logado a partir do backend.
 * - Retorna `null` se 401 (sem sessão) ou 404 (perfil ainda não existe).
 * - Lança qualquer outro erro (backend offline, 500, etc.).
 */
export async function getMeOrNull(): Promise<Me | null> {
  try {
    const api = await createServerApiClient();
    return await api.me.get();
  } catch (error) {
    if (error instanceof ApiError && (error.status === 401 || error.status === 404)) {
      return null;
    }
    throw error;
  }
}

const ROLE_RANK: Record<BranchRole, number> = {
  owner: 3,
  admin: 2,
  usuario: 1,
};

/** Maior papel entre as memberships ativas. */
export function highestRole(me: Me): BranchRole | null {
  let best: BranchRole | null = null;
  let bestRank = 0;
  for (const m of me.memberships) {
    if (m.status !== "active") continue;
    const rank = ROLE_RANK[m.role];
    if (rank > bestRank) {
      best = m.role;
      bestRank = rank;
    }
  }
  return best;
}

export type RouteDestination = "/onboarding" | "/dashboard" | "/feed";

/**
 * Decide a rota correta pra um `Me`:
 * - Sem membership ativa → /onboarding (vira OWNER ao criar 1ª filial).
 * - Maior papel = owner ou admin → /dashboard.
 * - Apenas usuario → /feed.
 */
export function routeFor(me: Me): RouteDestination {
  const role = highestRole(me);
  if (!role) return "/onboarding";
  if (role === "usuario") return "/feed";
  return "/dashboard";
}
