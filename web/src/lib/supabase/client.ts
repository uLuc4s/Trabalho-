// Cliente do Supabase para o navegador (componentes com "use client").
// Usa a sessão guardada no navegador. As consultas também passam pela RLS.

import { createBrowserClient } from "@supabase/ssr"; // biblioteca do Supabase para o navegador

// Cria o cliente do navegador.
// Saída: cliente pronto para ler e gravar, sempre como o usuário logado.
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!, // endereço do projeto (vem do .env.local, é público)
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!, // chave pública; a segurança fica na RLS, não na chave
  );
}
