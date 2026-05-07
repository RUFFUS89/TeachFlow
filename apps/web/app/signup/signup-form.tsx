"use client";

import { Button, Card, Input } from "@teachflow/ui";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export function SignupForm() {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setLoading(true);

    const supabase = createSupabaseBrowserClient();
    const { error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName },
      },
    });

    if (signUpError) {
      setError(signUpError.message);
      setLoading(false);
      return;
    }

    // Auto-confirm está ativo no projeto Supabase de dev — usuário já vem
    // logado na sessão. Em produção (auto-confirm off), aqui iria pra
    // tela "verifique seu email".
    router.push("/onboarding");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <Input
        label="Nome completo"
        id="full_name"
        autoComplete="name"
        required
        value={fullName}
        onChange={(event) => setFullName(event.target.value)}
        placeholder="Joser Rufino"
      />
      <Input
        label="E-mail"
        id="email"
        type="email"
        autoComplete="email"
        required
        value={email}
        onChange={(event) => setEmail(event.target.value)}
        placeholder="voce@instituicao.com"
      />
      <Input
        label="Senha"
        id="password"
        type="password"
        autoComplete="new-password"
        required
        minLength={8}
        value={password}
        onChange={(event) => setPassword(event.target.value)}
        helper="Mínimo 8 caracteres."
      />

      {error && (
        <Card tone="blush" padding="sm">
          <p className="text-sm">{error}</p>
        </Card>
      )}

      <Button type="submit" size="lg" full loading={loading} iconRight="arrow-right">
        Criar conta e seguir
      </Button>
    </form>
  );
}
