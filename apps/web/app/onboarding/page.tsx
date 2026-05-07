import { ApiError } from "@teachflow/api-client";
import { Blob } from "@teachflow/ui";
import { redirect } from "next/navigation";

import { createServerApiClient } from "@/lib/api-server";

import { OnboardingForm } from "./onboarding-form";

export default async function OnboardingPage() {
  // Se o usuário já tem alguma membership, não devolve pra cá.
  // Defesa em profundidade — o middleware também deveria barrar.
  try {
    const api = await createServerApiClient();
    const me = await api.me.get();
    if (me.memberships.length > 0) {
      const isStudentOnly = me.memberships.every((m) => m.role === "usuario");
      redirect(isStudentOnly ? "/feed" : "/dashboard");
    }
  } catch (error) {
    // 401 → middleware já mandou pra /login. Se backend offline, deixa o
    // form renderizar — usuário vê erro ao submeter, sem ficar preso aqui.
    if (error instanceof ApiError && error.status !== 401 && error.status !== 404) {
      throw error;
    }
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-bg p-8 md:p-16">
      <Blob color="#F4D6BC" size={420} className="absolute -left-32 -top-32" opacity={0.35} />
      <Blob color="#CFE0CB" size={360} className="absolute -bottom-24 -right-24" opacity={0.3} />

      <div className="relative z-10 mx-auto flex max-w-2xl flex-col gap-8">
        <header className="flex flex-col gap-2">
          <p className="font-mono text-xs font-semibold uppercase tracking-widest text-inkMuted">
            Primeiro passo
          </p>
          <h1 className="font-display text-4xl leading-tight text-ink">
            Vamos criar a sua primeira filial.
          </h1>
          <p className="text-sm text-inkMuted">
            Cada filial é uma instituição (ou unidade de uma rede). Você pode criar mais depois e
            convidar membros por código.
          </p>
        </header>

        <OnboardingForm />
      </div>
    </main>
  );
}
