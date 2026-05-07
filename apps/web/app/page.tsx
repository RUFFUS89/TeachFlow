import { Button } from "@teachflow/ui";
import Link from "next/link";
import { redirect } from "next/navigation";

import { getMeOrNull, routeFor } from "@/lib/me";

export default async function HomePage() {
  // Se já estiver autenticado, vai direto pro destino correto.
  const me = await getMeOrNull();
  if (me) redirect(routeFor(me));

  return (
    <main className="flex min-h-screen items-center justify-center px-6">
      <div className="max-w-2xl text-center">
        <p className="mb-4 font-mono text-xs uppercase tracking-widest text-inkMuted">TeachFlow</p>
        <h1 className="mb-6 font-display text-5xl leading-tight tracking-tight text-ink md:text-6xl">
          Uma sala de aula <em className="italic">acolhedora</em> — do outro lado da tela.
        </h1>
        <p className="mb-10 text-lg leading-relaxed text-inkSoft">
          Organize aulas, quizzes e entregas num espaço calmo e claro. Para professores que querem
          ensinar, não brigar com software.
        </p>
        <div className="flex items-center justify-center gap-3">
          <Link href="/login">
            <Button size="lg">Entrar</Button>
          </Link>
          <Link href="/signup">
            <Button size="lg" variant="ghost" iconRight="arrow-right">
              Criar conta
            </Button>
          </Link>
        </div>
      </div>
    </main>
  );
}
