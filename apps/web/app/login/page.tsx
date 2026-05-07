import { Blob } from "@teachflow/ui";
import Link from "next/link";

import { LoginForm } from "./login-form";

export default function LoginPage() {
  return (
    <main className="flex min-h-screen">
      {/* Brand — esquerda */}
      <div className="relative hidden flex-1 flex-col overflow-hidden bg-accent p-12 md:flex">
        <Blob color="#F4D6BC" size={420} className="absolute -left-24 -top-24" opacity={0.5} />
        <Blob color="#CFE0CB" size={360} className="absolute -bottom-24 -right-16" opacity={0.45} />

        <div className="relative z-10 flex items-center gap-3">
          <span className="flex size-9 items-center justify-center rounded-card bg-accentInk font-display font-bold text-accent">
            T
          </span>
          <span className="font-display text-xl text-accentInk">TeachFlow</span>
        </div>

        <div className="relative z-10 flex flex-1 items-center">
          <div className="max-w-lg">
            <h1 className="font-display text-5xl leading-tight tracking-tight text-accentInk">
              Uma sala de aula <em className="italic">acolhedora</em> — do outro lado da tela.
            </h1>
            <p className="mt-5 max-w-md text-base leading-relaxed text-accentInk opacity-80">
              Organize aulas, quizzes e entregas num espaço calmo e claro.
            </p>
          </div>
        </div>

        <div className="relative z-10 text-xs text-accentInk opacity-60">© 2026 TeachFlow</div>
      </div>

      {/* Form — direita */}
      <div className="flex flex-1 flex-col justify-center bg-surface p-8 md:w-[460px] md:flex-none md:p-12">
        <p className="mb-2 font-mono text-xs font-semibold uppercase tracking-widest text-inkMuted">
          Entrar no painel
        </p>
        <h2 className="mb-2 font-display text-3xl text-ink">Que bom ver você de novo.</h2>
        <p className="mb-8 text-sm text-inkMuted">Entre com seu e-mail e senha.</p>

        <LoginForm />

        <p className="mt-8 text-sm text-inkMuted">
          Primeiro acesso?{" "}
          <Link href="/signup" className="font-medium text-ink underline-offset-4 hover:underline">
            Criar conta
          </Link>
        </p>
        <p className="mt-2 text-xs text-inkMuted">
          Convidado por uma instituição? Use o link recebido (formato{" "}
          <code className="font-mono">/redeem/TF-XXXX-XXXX</code>).
        </p>
      </div>
    </main>
  );
}
