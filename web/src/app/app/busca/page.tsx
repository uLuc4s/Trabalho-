// Busca no painel: procura clientes (nome ou telefone) e serviços (nome) de uma vez.
// A busca é feita no servidor com as consultas já existentes, e a RLS garante que só aparece o que é da empresa.

import Link from "next/link"; // links para cada resultado
import { getCurrentCompany } from "@/lib/company"; // sessão e empresa do usuário
import { getCustomers } from "@/services/clientes.service"; // clientes da empresa
import { getServices } from "@/services/servicos.service"; // serviços da empresa

// Entrada: termo digitado (?q=).
// Saída: lista de clientes e serviços que combinam com o termo.
export default async function BuscaPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q } = await searchParams;
  const term = (q ?? "").trim().toLowerCase();
  const { supabase } = await getCurrentCompany();

  const [{ data: customers }, { data: services }] = await Promise.all([getCustomers(supabase), getServices(supabase)]);

  const digits = term.replace(/\D/g, "");
  const matchedCustomers =
    term.length < 2 ? [] : (customers ?? []).filter((c) => c.name.toLowerCase().includes(term) || (digits.length >= 4 && c.phone.includes(digits)));
  const matchedServices = term.length < 2 ? [] : (services ?? []).filter((s) => s.name.toLowerCase().includes(term));

  return (
    <div className="flex flex-col gap-8">
      <header>
        <h1 className="font-display text-5xl tracking-tight">Busca</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {term.length < 2 ? "Digite pelo menos 2 letras ou 4 números." : `Resultados para "${q}"`}
        </p>
      </header>

      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-medium text-muted-foreground">Clientes · {matchedCustomers.length}</h2>
        {matchedCustomers.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhum cliente encontrado.</p>
        ) : (
          <ul className="divide-y divide-border overflow-hidden rounded-2xl border border-border bg-background">
            {matchedCustomers.map((c) => (
              <li key={c.id} className="flex items-center justify-between gap-4 p-5">
                <div className="min-w-0">
                  <p className="truncate font-medium">{c.name}</p>
                  <p className="text-sm text-muted-foreground">{c.phone}</p>
                </div>
                <Link href={`/app/clientes?q=${encodeURIComponent(c.name)}`} className="text-sm text-muted-foreground hover:text-foreground">
                  Abrir
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-medium text-muted-foreground">Serviços · {matchedServices.length}</h2>
        {matchedServices.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhum serviço encontrado.</p>
        ) : (
          <ul className="divide-y divide-border overflow-hidden rounded-2xl border border-border bg-background">
            {matchedServices.map((s) => (
              <li key={s.id} className="flex items-center justify-between gap-4 p-5">
                <p className="font-medium">{s.name}</p>
                <Link href="/app/servicos" className="text-sm text-muted-foreground hover:text-foreground">
                  Ver serviços
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
