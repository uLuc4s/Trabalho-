// Cliente do Supabase para o servidor (Server Components, Server Actions e rotas).
// Lê e grava os cookies da sessão do usuário, então as consultas rodam como ele e a RLS vale.

import { createServerClient } from "@supabase/ssr"; // biblioteca que conecta o Supabase aos cookies do Next
import { cookies } from "next/headers"; // acesso aos cookies da requisição atual
import { connection } from "next/server"; // marca a página como dinâmica (não pré-renderizada)

// Cria o cliente do Supabase com a sessão do usuário que fez a requisição.
// Saída: cliente pronto para consultar o banco como esse usuário.
export async function createClient() {
  // Avisa o Next que esta leitura depende da requisição. Sem isso a página seria gerada uma vez só.
  await connection();
  const cookieStore = await cookies(); // pega o armazenamento de cookies desta requisição

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!, // endereço do projeto Supabase (vem do .env.local)
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!, // chave pública (publishable); não é segredo
    {
      cookies: {
        // Devolve todos os cookies da requisição para a biblioteca ler a sessão.
        getAll() {
          return cookieStore.getAll();
        },
        // Grava cookies novos ou renovados (ex.: token atualizado).
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // Em Server Component o Next não deixa gravar cookie. Não é erro: a proxy renova a sessão.
          }
        },
      },
    },
  );
}
