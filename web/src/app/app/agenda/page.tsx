import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { CancelAppointment } from "@/components/app/cancel-appointment";
import { dayRange, formatTime, getCurrentCompany, todayInSaoPaulo } from "@/lib/company";

type Pick<T> = T | T[] | null;
type Row = {
  id: string;
  starts_at: string;
  ends_at: string;
  status: string;
  services: Pick<{ name: string }>;
  employees: Pick<{ display_name: string }>;
  customers: Pick<{ name: string; phone: string }>;
};

const first = <T,>(value: Pick<T>): T | undefined => (Array.isArray(value) ? value[0] : value ?? undefined);

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

export default async function AgendaPage({ searchParams }: { searchParams: Promise<{ data?: string }> }) {
  const { data } = await searchParams;
  const date = data && /^\d{4}-\d{2}-\d{2}$/.test(data) ? data : todayInSaoPaulo();
  const { supabase } = await getCurrentCompany();
  const range = dayRange(date);

  const { data: rows } = await supabase
    .from("appointments")
    .select("id, starts_at, ends_at, status, services(name), employees(display_name), customers(name, phone)")
    .gte("starts_at", range.start)
    .lte("starts_at", range.end)
    .order("starts_at");

  const list = (rows ?? []) as Row[];
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
            href={`/app/agenda?data=${todayInSaoPaulo()}`}
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
                <p className="font-display text-3xl tabular-nums">{formatTime(row.starts_at)}</p>
                <div className="min-w-0">
                  <p className="truncate font-medium">{customer?.name}</p>
                  <p className="truncate text-sm text-muted-foreground">
                    {service?.name} · {employee?.display_name} · {customer?.phone}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="rounded-full bg-secondary px-3 py-1 text-xs">{STATUS_LABEL[row.status] ?? row.status}</span>
                  {!cancelled && <CancelAppointment appointmentId={row.id} />}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
