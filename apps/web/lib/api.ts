"use client";

import { createApiClient, type ApiClient } from "@teachflow/api-client";
import { useMemo } from "react";

import { createSupabaseBrowserClient } from "./supabase/client";

/**
 * Retorna um api-client tipado que injeta automaticamente o JWT
 * do usuário logado em cada request.
 *
 * Uso em Client Components:
 *   const api = useApiClient();
 *   const me = await api.me.get();
 */
export function useApiClient(): ApiClient {
  return useMemo(() => {
    const supabase = createSupabaseBrowserClient();
    return createApiClient({
      baseUrl: process.env.NEXT_PUBLIC_API_URL!,
      getToken: async () => {
        const { data } = await supabase.auth.getSession();
        return data.session?.access_token ?? null;
      },
    });
  }, []);
}
