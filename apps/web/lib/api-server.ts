import "server-only";

import { createApiClient, type ApiClient } from "@teachflow/api-client";

import { createSupabaseServerClient } from "./supabase/server";

/**
 * Cliente HTTP tipado pra Server Components, Server Actions e Route Handlers.
 *
 * Pega o JWT do cookie Supabase (via SSR client) e injeta no header
 * Authorization de cada request pro backend FastAPI.
 *
 * Uso:
 *   const api = await createServerApiClient();
 *   const me = await api.me.get();
 */
export async function createServerApiClient(): Promise<ApiClient> {
  const supabase = await createSupabaseServerClient();
  return createApiClient({
    baseUrl: process.env.NEXT_PUBLIC_API_URL!,
    getToken: async () => {
      const { data } = await supabase.auth.getSession();
      return data.session?.access_token ?? null;
    },
  });
}
