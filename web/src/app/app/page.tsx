import Link from "next/link";
import { ArrowUpRight, CalendarDays, ClipboardList, Inbox, Users, Wallet } from "lucide-react";
import { BarChart, Donut, type Point } from "@/components/app/charts";
import { formatTime, getCurrentCompany, todayInSaoPaulo, dayRange } from "@/lib/company";

type Pick<T> = T | T[] | null;
type Row = { starts_at: string; status: string; services: Pick<{ price: number | null; name: string }>; customers: Pick<{ name: string }> };

const first = <T,>(value: Pick<T>): T | undefined => (Array.isArray(value) ? value[0] : value ?? undefined);
const money = (value: number) => `R$ ${value.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const dayKey = (iso: string) => new Date(iso).toLocaleDateString("en-CA", { timeZone: "America/Sao_Paulo" });
const shortDay = (key: string) => new Date(`${key}T12:00:00Z`).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });

export default async function AppHomePage() {
  const { supabase, company } = await getCurrentCompany();
  const today = todayInSaoPaulo();
  const day = dayRange(today);
  const now = new Date();
  const from = new Date(now.getTime() - 14 * 86400000).toISOString();
  const to = new Date(now.getTime() + 7 * 86400000).toISOString();
  const monthStart = `${today.slice(0, 8)}01T00:00:00-03:00`;

  const thirtyDaysAgo = new Date(now.getTime() - 30 * 86400000).toISOString();
  const [todayRes, pendingRes, orderRows, windowRes, monthRes, nextRes, customersRes, activeRows] = await Promise.all([
    supabase.from("appointments").select("id", { count: "exact", head: true }).gte("starts_at", day.start).lte("starts_at", day.end).neq("status", "cancelled"),
    supabase.from("service_requests").select("id", { count: "exact", head: true }).in("status", ["new", "under_review"]),
    supabase.from("work_orders").select("status"),
    supabase.from("appointments").select("starts_at, status, services(price, name), customers(name)").gte("starts_at", from).lte("starts_at", to).neq("status", "cancelled"),
    supabase.from("appointments").select("starts_at, services(price)").gte("starts_at", monthStart).neq("status", "cancelled"),
    supabase.from("appointments").select("id, starts_at, services(name), customers(name)").gte("starts_at", now.toISOString()).neq("status", "cancelled").order("starts_at").limit(6),
    supabase.from("customers").select("id", { count: "exact", head: true }),
    supabase.from("appointments").select("customer_id").gte("starts_at", thirtyDaysAgo).neq("status", "cancelled"),
  ]);

  // Atendimentos por dia (últimos 14 dias + próximos 7)
  const counts = new Map<string, number>();
  for (let i = -14; i <= 7; i++) counts.set(dayKey(new Date(now.getTime() + i * 86400000).toISOString()), 0);
  for (const row of (windowRes.data ?? []) as Row[]) {
    const key = dayKey(row.starts_at);
    if (counts.has(key)) counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  const barData: Point[] = [...counts.entries()].map(([key, value]) => ({ label: shortDay(key), value }));

  // Receita prevista do mês
  const revenue = (monthRes.data ?? []).reduce((sum, row) => {
    const service = first((row as unknown as { services: Pick<{ price: number | null }> }).services);
    return sum + Number(service?.price ?? 0);
  }, 0);

  // Ordens por status
  const statusLabel: Record<string, string> = { open: "Abertas", scheduled: "Programadas", in_progress: "Em execução", completed: "Concluídas", cancelled: "Canceladas" };
  const statusCount = new Map<string, number>();
  for (const row of (orderRows.data ?? []) as { status: string }[]) {
    statusCount.set(row.status, (statusCount.get(row.status) ?? 0) + 1);
  }
  const donutData: Point[] = Object.keys(statusLabel)
    .map((key) => ({ label: statusLabel[key], value: statusCount.get(key) ?? 0 }))
    .filter((p) => p.value > 0);

  type Next = { starts_at: string; services: Pick<{ name: string }>; customers: Pick<{ name: string }> };
  const next = (nextRes.data ?? []) as Next[];
  const openOrdersCount = (orderRows.data ?? []).filter((o: { status: string }) => ["open", "scheduled", "in_progress"].includes(o.status)).length;
  const customersTotal = customersRes.count ?? 0;
  const activeCustomers = new Set(((activeRows.data ?? []) as { customer_id: string }[]).map((r) => r.customer_id)).size;
  const weekTotal = barData.slice(-7).reduce((acc, d) => acc + d.value, 0);

  const model = company.business_model;
  const fieldWork = model === "campo" || model === "orcamento";
  const recurring = model === "recorrente";

  const kpis = fieldWork
    ? [
        { label: "Visitas hoje", value: String(todayRes.count ?? 0), hint: "atendimentos", href: "/app/agenda", icon: CalendarDays },
        { label: "Ordens em andamento", value: String(openOrdersCount), hint: "abertas ou em execução", href: "/app/ordens", icon: ClipboardList },
        { label: "Solicitações", value: String(pendingRes.count ?? 0), hint: "aguardando resposta", href: "/app/solicitacoes", icon: Inbox },
        { label: "Receita prevista", value: money(revenue), hint: "neste mês", href: "/app/agenda", icon: Wallet },
      ]
    : recurring
      ? [
          { label: "Visitas hoje", value: String(todayRes.count ?? 0), hint: "da rotina", href: "/app/agenda", icon: CalendarDays },
          { label: "Próximos 7 dias", value: String(weekTotal), hint: "visitas", href: "/app/agenda", icon: CalendarDays },
          { label: "Clientes fixos", value: String(customersTotal), hint: "na base", href: "/app/agenda", icon: Users },
          { label: "Receita prevista", value: money(revenue), hint: "neste mês", href: "/app/agenda", icon: Wallet },
        ]
      : [
          { label: "Hoje", value: String(todayRes.count ?? 0), hint: "atendimentos", href: "/app/agenda", icon: CalendarDays },
          { label: "Próximos 7 dias", value: String(weekTotal), hint: "atendimentos", href: "/app/agenda", icon: CalendarDays },
          { label: "Clientes para reativar", value: String(Math.max(0, customersTotal - activeCustomers)), hint: "sem atendimento há 30 dias", href: "/app/agenda", icon: Users },
          { label: "Receita prevista", value: money(revenue), hint: "neste mês", href: "/app/agenda", icon: Wallet },
        ];

  return (
    <div className="flex flex-col gap-8">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm text-muted-foreground">{company.name}</p>
          <h1 className="mt-1 font-display text-5xl tracking-tight">Visão geral</h1>
        </div>
        <Link href="/app/ordens" className="flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground">
          <ClipboardList className="h-4 w-4" aria-hidden />
          Ordens de serviço
          <ArrowUpRight className="h-4 w-4" aria-hidden />
        </Link>
      </header>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {kpis.map((kpi) => (
          <Link
            key={kpi.label}
            href={kpi.href}
            className="group rounded-2xl border border-border bg-background p-6 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-dashboard"
          >
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">{kpi.label}</span>
              <kpi.icon className="h-4 w-4 text-muted-foreground transition-colors group-hover:text-accent" aria-hidden />
            </div>
            <p className="mt-5 font-display text-4xl tabular-nums tracking-tight">{kpi.value}</p>
            <p className="mt-1 text-xs text-muted-foreground">{kpi.hint}</p>
          </Link>
        ))}
      </section>

      <section className="grid gap-4 xl:grid-cols-3">
        <div className="rounded-2xl border border-border bg-background p-6 xl:col-span-2">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h2 className="font-body text-base font-semibold">Atendimentos por dia</h2>
              <p className="text-xs text-muted-foreground">Últimos 14 dias e próximos 7</p>
            </div>
          </div>
          <BarChart data={barData} height={200} />
        </div>

        <div className="rounded-2xl border border-border bg-background p-6">
          <h2 className="mb-6 font-body text-base font-semibold">Ordens de serviço</h2>
          {donutData.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhuma ordem ainda.</p>
          ) : (
            <Donut data={donutData} />
          )}
        </div>
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
          <ul className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {next.map((row) => {
              const service = first(row.services);
              const customer = first(row.customers);
              return (
                <li key={row.starts_at + customer?.name} className="flex items-center justify-between gap-4 rounded-xl bg-secondary/60 p-4">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{customer?.name}</p>
                    <p className="truncate text-xs text-muted-foreground">{service?.name}</p>
                  </div>
                  <span className="shrink-0 font-display text-2xl tabular-nums">{formatTime(row.starts_at)}</span>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
