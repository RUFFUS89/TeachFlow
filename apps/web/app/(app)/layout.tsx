import type { ReactNode } from "react";

import { AppShellClient } from "./_components/app-shell-client";

/**
 * Layout do route group `(app)` — todas as telas autenticadas vivem aqui.
 *
 * Fase 0: usa dados mockados (role default OWNER) só pra validar o shell visualmente.
 * Fase 1: vai buscar `/api/v1/me` no server e passar role/profile reais.
 */
export default function AppGroupLayout({ children }: { children: ReactNode }) {
  return (
    <AppShellClient
      userName="Joser Rufino"
      userEmail="joserufinoneto25@gmail.com"
      role="owner"
    >
      {children}
    </AppShellClient>
  );
}
