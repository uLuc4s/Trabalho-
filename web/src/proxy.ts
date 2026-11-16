// Proxy do Next (roda antes de cada página do caminho configurado).
// Função: manter a sessão do usuário viva e bloquear páginas sem login.
// Regras: quem não está logado não entra em /app e /onboarding; quem já está logado não vê /login e /cadastro.

import { createServerClient } from "@supabase/ssr"; // cliente do Supabase que lê e grava cookies
import { NextResponse, type NextRequest } from "next/server"; // resposta e requisição do Next

const PROTECTED = ["/app", "/onboarding"]; // caminhos que exigem login
const AUTH_ONLY = ["/login", "/cadastro"]; // caminhos só para quem não está logado

// Função principal, chamada pelo Next em cada requisição que passa pelo matcher.
// Entrada: a requisição.
// Saída: a resposta (página normal com cookies renovados) ou um redirecionamento.
export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request }); // resposta padrão: deixa a requisição seguir

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        // Lê os cookies que vieram na requisição.
        getAll() {
          return request.cookies.getAll();
        },
        // Quando a sessão é renovada, grava os cookies novos na requisição e na resposta.
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request }); // recria a resposta já com os cookies novos
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  // Pergunta ao Supabase quem está logado. Também renova o token se estiver perto de vencer.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const path = request.nextUrl.pathname; // caminho acessado, ex.: /app/agenda
  // Protegido: é exatamente o caminho ou começa com ele seguido de barra (ex.: /app e /app/agenda).
  const isProtected = PROTECTED.some((p) => path === p || path.startsWith(`${p}/`));
  const isAuthOnly = AUTH_ONLY.includes(path);

  // Sem login tentando entrar em área protegida: manda para o login.
  if (!user && isProtected) {
    return NextResponse.redirect(new URL("/login", request.url));
  }
  // Com login tentando ver a tela de login ou cadastro: manda para o painel.
  if (user && isAuthOnly) {
    return NextResponse.redirect(new URL("/app", request.url));
  }

  return response; // caso normal: a página segue com a resposta preparada
}

// Quais caminhos esta proxy analisa. Outros caminhos (landing, página pública) não passam por aqui.
export const config = {
  matcher: ["/app/:path*", "/onboarding", "/login", "/cadastro"],
};
