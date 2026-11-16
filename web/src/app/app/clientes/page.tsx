import Link from "next/link";
import { connection } from "next/server";
import { Search } from "lucide-react";
import { ForgetCustomer } from "@/components/app/forget-customer";
import { daysAgoMs, formatDateTime, getCurrentCompany } from "@/lib/company";

export default async function ClientesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; sem_retorno?: string }>;
}) {
  await connection();
  const { q, sem_retorno } = await searchParams;
  const term = (q ?? "").trim().toLowerCase();
  const onlyInactive = sem_retorno === "1";
  const { supabase, role } = await getCurrentCompany();
  const canManage = role === "owner" || role === "admin";

  const [{ data: customers, error: customersError }, { data: appointments, error: appointmentsError }] = await Promise.all([
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

  const cutoff = daysAgoMs(30);
  const digits = term.replace(/\D/g, "");
  const list = (customers ?? []).filter((c) => {
    if (term && !c.name.toLowerCase().includes(term) && !(digits && c.phone.includes(digits))) return false;
    if (onlyInactive) {
      const last = stats.get(c.id)?.last;
      if (last && new Date(last).getTime() >= cutoff) return false;
    }
    return true;
  });

  const inactiveCount = (customers ?? []).filter((c) => {
    const last = stats.get(c.id)?.last;
    return !last || new Date(last).getTime() < cutoff;
  }).length;

  return (
    <div className="flex flex-col gap-8">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-5xl tracking-tight">Clientes</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {customers?.length ?? 0} cadastrados · {inactiveCount} sem retorno há 30 dias
          </p>
        </div>
        <form action="/app/clientes" className="flex items-center gap-2">
          {onlyInactive && <input type="hidden" name="sem_retorno" value="1" />}
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
            <input
              name="q"
              defaultValue={q ?? ""}
              placeholder="Nome ou telefone"
              className="h-10 w-56 rounded-full border border-input bg-background pl-9 pr-4 text-sm focus:border-accent focus:outline-none"
            />
          </div>
        </form>
      </header>

      <div className="flex flex-wrap gap-2 text-sm">
        <Link
          href="/app/clientes"
          className={`rounded-full border px-4 py-1.5 transition-colors ${!onlyInactive ? "border-accent bg-accent/10" : "border-border hover:bg-secondary"}`}
        >
          Todos
        </Link>
        <Link
          href="/app/clientes?sem_retorno=1"
          className={`rounded-full border px-4 py-1.5 transition-colors ${onlyInactive ? "border-accent bg-accent/10" : "border-border hover:bg-secondary"}`}
        >
          Sem retorno há 30 dias
        </Link>
      </div>

      {customersError || appointmentsError ? (
        <p className="rounded-2xl border border-destructive/40 p-4 text-sm text-destructive">Não foi possível carregar os clientes. Recarregue a página.</p>
      ) : list.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
          {term || onlyInactive ? "Nenhum cliente com esse filtro." : "Nenhum cliente ainda. Eles aparecem quando agendam pela sua página."}
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
                <div className="flex items-center gap-3 md:justify-end">
                  <Link href={`/app/agenda?data=${s?.last ? s.last.slice(0, 10) : ""}`} className="text-sm text-muted-foreground transition-colors hover:text-foreground">
                    Ver agenda
                  </Link>
                  {canManage && <ForgetCustomer customerId={c.id} />}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
