import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Refresca a sessão Supabase e força auth básica.
 *
 * O role-based redirect (aluno → /feed, staff → /dashboard, sem membership →
 * /onboarding) acontece no server component `app/(app)/layout.tsx`, que
 * consulta `/api/v1/me` no backend. Aqui só cuidamos de:
 *   - mandar usuário não autenticado pra /login;
 *   - tirar usuário autenticado de páginas de auth (/login, /signup);
 *   - manter `/redeem/...` público (Fase 7).
 */

const PUBLIC_ROUTES = new Set(["/", "/login", "/signup"]);

function isPublic(pathname: string): boolean {
  if (PUBLIC_ROUTES.has(pathname)) return true;
  return pathname.startsWith("/redeem/") || pathname.startsWith("/auth/");
}

function isAuthRoute(pathname: string): boolean {
  return pathname === "/login" || pathname === "/signup" || pathname.startsWith("/auth/");
}

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: { headers: request.headers },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: { name: string; value: string; options?: Record<string, unknown> }[]) {
          for (const { name, value } of cookiesToSet) {
            request.cookies.set(name, value);
          }
          response = NextResponse.next({
            request: { headers: request.headers },
          });
          for (const { name, value, options } of cookiesToSet) {
            response.cookies.set(name, value, options);
          }
        },
      },
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;

  // Não autenticado → manda pro login (exceto rotas públicas).
  if (!user && !isPublic(pathname)) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  // Autenticado tentando entrar em /login ou /signup → manda pra raiz,
  // que o (app)/layout decide por role.
  if (user && isAuthRoute(pathname)) {
    const url = request.nextUrl.clone();
    url.pathname = "/";
    return NextResponse.redirect(url);
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Aplica em todas as rotas exceto:
     * - _next/static (assets)
     * - _next/image (otimização de imagens)
     * - favicon, sitemap, robots
     * - extensões comuns de imagem
     */
    "/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
