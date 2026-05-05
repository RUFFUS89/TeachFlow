"use client";

import { createBrowserClient } from "@supabase/ssr";

/**
 * Cliente Supabase pra usar em Client Components.
 *
 * Lê variáveis NEXT_PUBLIC_* — todas seguras pra expor no browser:
 * a chave é a "publishable" (anon), protegida por RLS.
 */
export function createSupabaseBrowserClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
