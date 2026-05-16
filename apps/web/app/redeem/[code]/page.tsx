import { Blob } from "@teachflow/ui";

import { RedeemForm } from "./redeem-form";

export default async function RedeemPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;

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
              Você foi convidado para fazer parte de uma turma.
            </h1>
            <p className="mt-5 max-w-md text-base leading-relaxed text-accentInk opacity-80">
              Crie sua conta gratuita e comece agora.
            </p>
          </div>
        </div>

        <div className="relative z-10 text-xs text-accentInk opacity-60">© 2026 TeachFlow</div>
      </div>

      {/* Form — direita */}
      <div className="flex flex-1 flex-col justify-center bg-surface p-8 md:w-[460px] md:flex-none md:p-12">
        <p className="mb-2 font-mono text-xs font-semibold uppercase tracking-widest text-inkMuted">
          Convite · {code}
        </p>
        <h2 className="mb-2 font-display text-3xl text-ink">Criar sua conta.</h2>
        <p className="mb-8 text-sm text-inkMuted">
          Preencha os dados abaixo para ativar seu acesso.
        </p>

        <RedeemForm code={code} />
      </div>
    </main>
  );
}
