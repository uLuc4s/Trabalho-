import Link from "next/link";
import { Search } from "lucide-react";
import { formatDateTime, getCurrentCompany } from "@/lib/company";

export default async function ClientesPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q } = await searchParams;
  const term = (q ?? "").trim().toLowerCase();
  const { supabase } = await getCurrentCompany();

  const [{ data: customers }, { data: appointments }] = await Promise.all([
    supabase.from("customers").select("id, name, phone, email").order("name"),
    supabase.from("appointments").select("customer_id, starts_at, status"),
  ]);

  const stats = new Map<string, { total: number; last: string | null }>();
  for (const a of (appointments ?? []) as { customer_id: string; starts_at: string; status: string }[]) {
    if (a.status === "cancelled") continue;
    const s = stats.get(a.customer_id) ?? { total: 0, last: null };
    s.total += 1;
    if (!s.last || a.starts_at > s.last) s.last = a.starts_at;
    stats.set(a.customer_id, s);
  }

  const list = (customers ?? []).filter(
    (c) => !term || c.name.toLowerCase().includes(term) || c.phone.includes(term.replace(/\D/g, "") || "#"),
  );

  return (
    <div className="flex flex-col gap-8">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-5xl tracking-tight">Clientes</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {customers?.length ?? 0} cadastrados. O histórico se forma a partir dos atendimentos.
          </p>
        </div>
        <form action="/app/clientes" className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
          <input
            name="q"
            defaultValue={q ?? ""}
            placeholder="Buscar nome ou telefone"
            className="h-10 w-64 rounded-full border border-input bg-background pl-9 pr-4 text-sm focus:border-accent focus:outline-none"
          />
        </form>
      </header>

      {list.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
          {term ? "Nenhum cliente encontrado." : "Nenhum cliente ainda. Eles aparecem quando agendam pela sua página."}
        </div>
      ) : (
        <ul className="divide-y divide-border overflow-hidden rounded-2xl border border-border bg-background">
          {list.map((c) => {
            const s = stats.get(c.id);
            return (
              <li key={c.id} className="grid gap-3 p-5 md:grid-cols-[1fr_auto_auto] md:items-center">
                <div className="min-w-0">
                  <p className="truncate font-medium">{c.name}</p>
                  <p className="truncate text-sm text-muted-foreground">
                    {c.phone}
                    {c.email ? ` · ${c.email}` : ""}
                  </p>
                </div>
                <div className="text-sm md:text-right">
                  <p className="tabular-nums">{s?.total ?? 0} atendimentos</p>
                  <p className="text-xs text-muted-foreground">
                    {s?.last ? `Último: ${formatDateTime(s.last)}` : "Sem atendimento ainda"}
                  </p>
                </div>
                <Link href={`/app/agenda?data=${s?.last ? s.last.slice(0, 10) : ""}`} className="text-sm text-muted-foreground transition-colors hover:text-foreground md:text-right">
                  Ver agenda
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
