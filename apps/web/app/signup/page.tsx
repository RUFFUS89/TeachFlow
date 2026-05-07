import { Blob } from "@teachflow/ui";
import Link from "next/link";

import { SignupForm } from "./signup-form";

export default function SignupPage() {
  return (
    <main className="flex min-h-screen">
      <div className="relative hidden flex-1 flex-col overflow-hidden bg-sage p-12 md:flex">
        <Blob color="#CFE0CB" size={420} className="absolute -left-24 -top-24" opacity={0.55} />
        <Blob color="#F5E5A8" size={360} className="absolute -bottom-24 -right-16" opacity={0.5} />

        <div className="relative z-10 flex items-center gap-3">
          <span className="flex size-9 items-center justify-center rounded-card bg-sageInk font-display font-bold text-sage">
            T
          </span>
          <span className="font-display text-xl text-sageInk">TeachFlow</span>
        </div>

        <div className="relative z-10 flex flex-1 items-center">
          <div className="max-w-lg">
            <h1 className="font-display text-5xl leading-tight tracking-tight text-sageInk">
              Comece com a sua <em className="italic">primeira filial</em>.
            </h1>
            <p className="mt-5 max-w-md text-base leading-relaxed text-sageInk opacity-80">
              Você cria a conta como gestor (OWNER). Convida professores e alunos depois, com um
              código simples.
            </p>
          </div>
        </div>

        <div className="relative z-10 text-xs text-sageInk opacity-60">© 2026 TeachFlow</div>
      </div>

      <div className="flex flex-1 flex-col justify-center bg-surface p-8 md:w-[460px] md:flex-none md:p-12">
        <p className="mb-2 font-mono text-xs font-semibold uppercase tracking-widest text-inkMuted">
          Criar conta
        </p>
        <h2 className="mb-2 font-display text-3xl text-ink">Boas-vindas.</h2>
        <p className="mb-8 text-sm text-inkMuted">
          Esse cadastro é pra quem vai gerir a instituição. Aluno ou professor entra via convite.
        </p>

        <SignupForm />

        <p className="mt-8 text-sm text-inkMuted">
          Já tem conta?{" "}
          <Link href="/login" className="font-medium text-ink underline-offset-4 hover:underline">
            Entrar
          </Link>
        </p>
      </div>
    </main>
  );
}
