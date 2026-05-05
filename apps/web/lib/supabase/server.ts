import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

/**
 * Cliente Supabase pra Server Components, Route Handlers e Server Actions.
 *
 * Mantém a sessão do usuário sincronizada via cookies httpOnly.
 */
export async function createSupabaseServerClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet: { name: string; value: string; options?: Record<string, unknown> }[]) {
          try {
            for (const { name, value, options } of cookiesToSet) {
              cookieStore.set(name, value, options);
            }
          } catch {
            // O `setAll` foi chamado de um Server Component sem
            // middleware. Pode ser ignorado se houver middleware
            // refrescando sessões.
          }
        },
      },
    },
  );
}
