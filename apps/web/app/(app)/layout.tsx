import { redirect } from "next/navigation";
import type { ReactNode } from "react";

import { getMeOrNull, highestRole } from "@/lib/me";

import { AppShellClient } from "./_components/app-shell-client";

/**
 * Layout do route group `(app)` — todas as telas autenticadas vivem aqui.
 *
 * Server component que:
 *  - Busca `/api/v1/me` via JWT do cookie Supabase.
 *  - Sem sessão → /login.
 *  - Sem membership → /onboarding.
 *  - Renderiza o AppShell com profile + role reais.
 *
 * O cross-role redirect (aluno tentando /dashboard, staff tentando /feed)
 * acontece nas páginas individuais — Layout não tem acesso ao pathname
 * sem injeção via middleware. Defesa em profundidade está em cada page.
 */
export default async function AppGroupLayout({ children }: { children: ReactNode }) {
  const me = await getMeOrNull();
  if (!me) redirect("/login");

  const role = highestRole(me);
  if (!role) redirect("/onboarding");

  return (
    <AppShellClient
      userName={me.profile.full_name}
      avatarUrl={me.profile.avatar_url}
      role={role}
    >
      {children}
    </AppShellClient>
  );
}
