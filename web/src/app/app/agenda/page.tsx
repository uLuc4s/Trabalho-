import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { CancelAppointment } from "@/components/app/cancel-appointment";
import { OutcomeActions } from "@/components/app/outcome-actions";
import { MonthCalendar, type DayCount } from "@/components/app/month-calendar";
import { dayRange, formatTime, getCurrentCompany, todayInSaoPaulo } from "@/lib/company";

type Pick<T> = T | T[] | null;
type Row = {
  id: string;
  starts_at: string;
  ends_at: string;
  status: string;
  payment_method: string | null;
  amount_paid: number | null;
  details: { placa?: string; veiculo?: string; ano?: string; area?: string } | null;
  services: Pick<{ name: string; price: number | null }>;
  employees: Pick<{ display_name: string }>;
  customers: Pick<{ name: string; phone: string }>;
};

const PAYMENT_LABEL: Record<string, string> = { pix: "Pix", cartao: "Cartão", dinheiro: "Dinheiro" };

const first = <T,>(value: Pick<T>): T | undefined => (Array.isArray(value) ? value[0] : value ?? undefined);
const dayKey = (iso: string) => new Date(iso).toLocaleDateString("en-CA", { timeZone: "America/Sao_Paulo" });

function shiftDate(date: string, days: number) {
  const d = new Date(`${date}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

const STATUS_LABEL: Record<string, string> = {
  pending_confirmation: "Aguardando",
  confirmed: "Confirmado",
  completed: "Concluído",
  cancelled: "Cancelado",
  no_show: "Não compareceu",
};

export default async function AgendaPage({
  searchParams,
}: {
  searchParams: Promise<{ data?: string; mes?: string }>;
}) {
  const { data, mes } = await searchParams;
  const today = todayInSaoPaulo();
  const date = data && /^\d{4}-\d{2}-\d{2}$/.test(data) ? data : today;
  const [year, month] = mes && /^\d{4}-\d{2}$/.test(mes) ? mes.split("-").map(Number) : today.split("-").slice(0, 2).map(Number);

  const { supabase, company } = await getCurrentCompany();
  const sensitive = company.segment === "advocacia" || company.segment === "clinica";
  const range = dayRange(date);
  const monthStart = `${year}-${String(month).padStart(2, "0")}-01T00:00:00-03:00`;
  const nextMonth = month === 12 ? `${year + 1}-01-01` : `${year}-${String(month + 1).padStart(2, "0")}-01`;
  const monthEnd = `${nextMonth}T00:00:00-03:00`;

  const [{ data: rows }, { data: monthRows }] = await Promise.all([
    supabase
      .from("appointments")
      .select("id, starts_at, ends_at, status, payment_method, amount_paid, details, services(name, price), employees(display_name), customers(name, phone)")
      .gte("starts_at", range.start)
      .lte("starts_at", range.end)
      .order("starts_at"),
    supabase.from("appointments").select("starts_at, status").gte("starts_at", monthStart).lt("starts_at", monthEnd),
  ]);

  const counts: Record<string, DayCount> = {};
  for (const row of (monthRows ?? []) as { starts_at: string; status: string }[]) {
    const key = dayKey(row.starts_at);
    counts[key] ??= { booked: 0, cancelled: 0 };
    if (row.status === "cancelled") counts[key].cancelled += 1;
    else counts[key].booked += 1;
  }

  const list = (rows ?? []) as Row[];
  const active = list.filter((r) => r.status !== "cancelled");
  const expected = active.reduce((sum, r) => sum + Number(first(r.services)?.price ?? 0), 0);
  const dayLabel = new Date(`${date}T12:00:00Z`).toLocaleDateString("pt-BR", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    timeZone: "America/Sao_Paulo",
  });

  return (
    <div className="flex flex-col gap-8">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm capitalize text-muted-foreground">{dayLabel}</p>
          <h1 className="mt-1 font-display text-5xl tracking-tight">Agenda</h1>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href={`/app/agenda?data=${shiftDate(date, -1)}`}
            aria-label="Dia anterior"
            className="flex h-10 w-10 items-center justify-center rounded-full border border-border bg-background transition-colors hover:bg-secondary"
          >
            <ChevronLeft className="h-4 w-4" aria-hidden />
          </Link>
          <Link
            href={`/app/agenda?data=${today}`}
            className="flex h-10 items-center rounded-full border border-border bg-background px-4 text-sm transition-colors hover:bg-secondary"
          >
            Hoje
          </Link>
          <Link
            href={`/app/agenda?data=${shiftDate(date, 1)}`}
            aria-label="Próximo dia"
            className="flex h-10 w-10 items-center justify-center rounded-full border border-border bg-background transition-colors hover:bg-secondary"
          >
            <ChevronRight className="h-4 w-4" aria-hidden />
          </Link>
        </div>
      </header>

      <MonthCalendar
        year={year}
        month={month}
        counts={counts}
        selected={date}
        today={today}
      />

      <section className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-sm font-medium text-muted-foreground">Atendimentos do dia · {active.length} ativos</h2>
          {expected > 0 && <p className="text-sm tabular-nums text-muted-foreground">Previsto: R$ {expected.toFixed(2).replace(".", ",")}</p>}
        </div>
        {list.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
            Nenhum atendimento neste dia.
          </div>
        ) : (
          <ul className="divide-y divide-border overflow-hidden rounded-2xl border border-border bg-background">
            {list.map((row) => {
              const service = first(row.services);
              const employee = first(row.employees);
              const customer = first(row.customers);
              const cancelled = row.status === "cancelled";
              return (
                <li key={row.id} className="grid gap-4 p-5 md:grid-cols-[110px_1fr_auto] md:items-center">
                  <p className={cn("font-display text-3xl tabular-nums", cancelled && "text-muted-foreground line-through")}>
                    {formatTime(row.starts_at)}
                  </p>
                  <div className="min-w-0">
                    <p className={cn("truncate font-medium", cancelled && "text-muted-foreground line-through")}>{customer?.name}</p>
                    <p className="truncate text-sm text-muted-foreground">
                      {sensitive ? "Atendimento" : service?.name} · {employee?.display_name}
                      {!sensitive && ` · ${customer?.phone}`}
                    </p>
                    {!sensitive && row.details?.placa && (
                      <p className="mt-1 text-xs text-muted-foreground">
                        Veículo: {row.details.veiculo} {row.details.ano ? `(${row.details.ano})` : ""} · Placa {row.details.placa}
                      </p>
                    )}
                  </div>
                  <div className="flex flex-col items-start gap-2 md:items-end">
                    <div className="flex items-center gap-3">
                      <span className="rounded-full bg-secondary px-3 py-1 text-xs">{STATUS_LABEL[row.status] ?? row.status}</span>
                      {row.status === "completed" && row.payment_method && (
                        <span className="text-xs text-muted-foreground">
                          {PAYMENT_LABEL[row.payment_method]} · R$ {Number(row.amount_paid ?? 0).toFixed(2).replace(".", ",")}
                        </span>
                      )}
                    </div>
                    {(row.status === "confirmed" || row.status === "pending_confirmation") && (
                      <div className="flex flex-col gap-2 md:items-end">
                        <OutcomeActions appointmentId={row.id} defaultAmount={first(row.services)?.price ?? null} />
                        <CancelAppointment appointmentId={row.id} />
                      </div>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}

function cn(...classes: (string | false | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}
