import Link from "next/link";
import { CalendarDays, ClipboardList, Inbox } from "lucide-react";
import { dayRange, getCurrentCompany, formatTime, todayInSaoPaulo } from "@/lib/company";

export default async function AppHomePage() {
  const { supabase, company } = await getCurrentCompany();
  const today = dayRange(todayInSaoPaulo());

  const [todayRes, pendingRes, openRes, nextRes] = await Promise.all([
    supabase
      .from("appointments")
      .select("id", { count: "exact", head: true })
      .gte("starts_at", today.start)
      .lte("starts_at", today.end)
      .neq("status", "cancelled"),
    supabase
      .from("service_requests")
      .select("id", { count: "exact", head: true })
      .in("status", ["new", "under_review"]),
    supabase
      .from("work_orders")
      .select("id", { count: "exact", head: true })
      .in("status", ["open", "scheduled", "in_progress"]),
    supabase
      .from("appointments")
      .select("id, starts_at, services(name), customers(name)")
      .gte("starts_at", new Date().toISOString())
      .neq("status", "cancelled")
      .order("starts_at")
      .limit(5),
  ]);

  const cards = [
    { label: "Atendimentos hoje", value: todayRes.count ?? 0, href: "/app/agenda", icon: CalendarDays },
    { label: "Solicitações pendentes", value: pendingRes.count ?? 0, href: "/app/solicitacoes", icon: Inbox },
    { label: "Ordens em andamento", value: openRes.count ?? 0, href: "/app/ordens", icon: ClipboardList },
  ];

  type Next = {
    id: string;
    starts_at: string;
    services: { name: string } | { name: string }[] | null;
    customers: { name: string } | { name: string }[] | null;
  };
  const next = (nextRes.data ?? []) as Next[];
  const pick = (value: { name: string } | { name: string }[] | null) =>
    Array.isArray(value) ? value[0]?.name : value?.name;

  return (
    <div className="flex flex-col gap-10">
      <header>
        <p className="text-sm text-muted-foreground">{company.name}</p>
        <h1 className="mt-1 font-display text-5xl tracking-tight">Visão do dia</h1>
      </header>

      <section className="grid gap-4 md:grid-cols-3">
        {cards.map((card) => (
          <Link
            key={card.label}
            href={card.href}
            className="group rounded-2xl border border-border bg-background p-6 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-dashboard"
          >
            <card.icon className="h-4 w-4 text-muted-foreground transition-colors group-hover:text-accent" aria-hidden />
            <p className="mt-6 font-display text-5xl tabular-nums">{card.value}</p>
            <p className="mt-1 text-sm text-muted-foreground">{card.label}</p>
          </Link>
        ))}
      </section>

      <section className="rounded-2xl border border-border bg-background p-6">
        <div className="flex items-center justify-between">
          <h2 className="font-body text-base font-semibold">Próximos atendimentos</h2>
          <Link href="/app/agenda" className="text-sm text-muted-foreground transition-colors hover:text-foreground">
            Ver agenda
          </Link>
        </div>

        {next.length === 0 ? (
          <p className="mt-6 text-sm text-muted-foreground">Nenhum atendimento marcado ainda.</p>
        ) : (
          <ul className="mt-4 divide-y divide-border">
            {next.map((row) => (
              <li key={row.id} className="flex items-center justify-between gap-4 py-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{pick(row.customers)}</p>
                  <p className="truncate text-xs text-muted-foreground">{pick(row.services)}</p>
                </div>
                <span className="shrink-0 text-sm tabular-nums text-muted-foreground">{formatTime(row.starts_at)}</span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
