import { DashboardClient } from "./dashboard-client";

export default function DashboardPage() {
  // Esta página é simples por design — sua função é PROVAR que a stack
  // toda funciona ponta a ponta:
  //   1. Middleware do Next reconhece sessão Supabase via cookies.
  //   2. Browser pega JWT pelo SDK Supabase.
  //   3. Cliente HTTP envia JWT pro backend FastAPI.
  //   4. Backend valida ES256 via JWKS e retorna /me.
  //
  // Quando estiver tudo ok, evolua daqui pra dashboard real.
  return (
    <main className="min-h-screen p-8">
      <DashboardClient />
    </main>
  );
}
