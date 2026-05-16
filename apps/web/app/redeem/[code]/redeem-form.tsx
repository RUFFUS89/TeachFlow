"use client";

import { createApiClient } from "@teachflow/api-client";
import { Button, Icon, Input, Label } from "@teachflow/ui";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export function RedeemForm({ code }: { code: string }) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // 1. Resgata o convite (cria conta no backend via Admin API)
      const api = createApiClient({
        baseUrl: process.env.NEXT_PUBLIC_API_URL!,
        getToken: () => null,
      });

      const { role } = await api.invites.redeem({
        code,
        email: email.trim(),
        password,
        full_name: name.trim(),
      });

      // 2. Faz login com as credenciais recém-criadas
      const supabase = createSupabaseBrowserClient();
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });
      if (signInError) throw new Error(signInError.message);

      // 3. Redireciona por papel
      router.push(role === "usuario" ? "/feed" : "/dashboard");
      router.refresh();
    } catch (err: unknown) {
      const msg =
        err instanceof Error
          ? err.message
          : "Erro ao ativar convite. Verifique se o código ainda é válido.";
      setError(msg);
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      {error && (
        <div className="rounded-card bg-blush px-4 py-3 text-sm text-blushInk">{error}</div>
      )}

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="redeem-name">Nome completo *</Label>
        <Input
          id="redeem-name"
          placeholder="Seu nome"
          value={name}
          onChange={(e) => setName(e.target.value)}
          autoComplete="name"
          required
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="redeem-email">E-mail *</Label>
        <Input
          id="redeem-email"
          type="email"
          placeholder="voce@email.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoComplete="email"
          required
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="redeem-password">Senha *</Label>
        <div className="relative">
          <Input
            id="redeem-password"
            type={showPassword ? "text" : "password"}
            placeholder="Mínimo 6 caracteres"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="new-password"
            minLength={6}
            required
            className="pr-10"
          />
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-inkMuted hover:text-ink"
            aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
          >
            <Icon name={showPassword ? "eye-off" : "eye"} size={16} />
          </button>
        </div>
      </div>

      <Button type="submit" loading={loading} disabled={!name.trim() || !email.trim() || password.length < 6}>
        Criar conta e entrar
      </Button>
    </form>
  );
}
