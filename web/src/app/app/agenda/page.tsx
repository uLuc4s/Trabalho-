// Página da agenda do dia e do mês. A consulta fica em services, a conta em mappers e os tipos em dto.

import { Suspense } from "react";
import Link from "next/link";
import { connection } from "next/server";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { CancelAppointment } from "@/components/app/cancel-appointment";
import { OutcomeActions } from "@/components/app/outcome-actions";
import { MonthCalendar } from "@/components/app/month-calendar";
import { cn } from "@/lib/utils";
import { dayRange, formatTime, getCurrentCompany, todayInSaoPaulo } from "@/lib/company";
import { getAppointmentsInRange, getMonthStatuses } from "@/services/agenda.service";
import { buildMonthCounts, first, formatMoney, summarizeDay } from "@/mappers/agenda.mapper";
import type { AppointmentRowDTO } from "@/dto/agenda.dto";

// Tradução dos códigos de pagamento para o texto da tela.
const PAYMENT_LABEL: Record<string, string> = { pix: "Pix", cartao: "Cartão", dinheiro: "Dinheiro" };

// Tradução dos códigos de status para o texto da tela.
const STATUS_LABEL: Record<string, string> = {
  pending_confirmation: "Aguardando",
  confirmed: "Confirmado",
  completed: "Concluído",
  cancelled: "Cancelado",
  no_show: "Não compareceu",
};

// Soma ou subtrai dias de uma data AAAA-MM-DD. Usa meio-dia UTC para não cair na virada do dia.
function shiftDate(date: string, days: number) {
  const d = new Date(`${date}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

// Entrada: parâmetros da URL (?data=AAAA-MM-DD e ?mes=AAAA-MM).
// Saída: a tela da agenda.
// Página da rota. O conteúdo fica em Suspense porque depende da requisição (data e parâmetros).
export default function AgendaPage({
  searchParams,
}: {
  searchParams: Promise<{ data?: string; mes?: string; vista?: string }>;
}) {
  return (
    <Suspense fallback={null}>
      <AgendaContent searchParams={searchParams} />
    </Suspense>
  );
}

async function AgendaContent({
  searchParams,
}: {
  searchParams: Promise<{ data?: string; mes?: string; vista?: string }>;
}) {
  // Avisa o Next que a página depende da requisição (data de hoje e parâmetros).
  await connection();
  const { data, mes, vista } = await searchParams;
  const semana = vista === "semana"; // visão semanal: mostra os 7 dias da semana da data escolhida
  const today = todayInSaoPaulo();
  // Usa a data da URL só se estiver no formato certo; senão, usa hoje.
  const date = data && /^\d{4}-\d{2}-\d{2}$/.test(data) ? data : today;
  // Mês da URL no formato AAAA-MM, ou o mês atual.
  const [year, month] = mes && /^\d{4}-\d{2}$/.test(mes) ? mes.split("-").map(Number) : today.split("-").slice(0, 2).map(Number);

  const { supabase, company } = await getCurrentCompany();
  // Em advocacia e clínica, a agenda não mostra o serviço nem o telefone (sigilo).
  const sensitive = company.segment === "advocacia" || company.segment === "clinica";
  const range = dayRange(date); // início e fim do dia
  // Semana (domingo a sábado) que contém a data escolhida.
  const base = new Date(`${date}T12:00:00Z`);
  const sunday = new Date(base.getTime() - base.getUTCDay() * 86400000).toISOString().slice(0, 10);
  const saturday = new Date(new Date(`${sunday}T12:00:00Z`).getTime() + 6 * 86400000).toISOString().slice(0, 10);
  const weekRange = { start: dayRange(sunday).start, end: dayRange(saturday).end };
  // Primeiro instante do mês e do mês seguinte, para o calendário.
  const monthStart = `${year}-${String(month).padStart(2, "0")}-01T00:00:00-03:00`;
  const nextMonth = month === 12 ? `${year + 1}-01-01` : `${year}-${String(month + 1).padStart(2, "0")}-01`;
  const monthEnd = `${nextMonth}T00:00:00-03:00`;

  // Busca o dia e o mês em paralelo.
  const [{ data: rows, error: rowsError }, { data: monthRows, error: monthError }] = await Promise.all([
    getAppointmentsInRange(supabase, semana ? weekRange : range),
    getMonthStatuses(supabase, monthStart, monthEnd),
  ]);

  // Contagem por dia para o calendário, e resumo do dia para o topo da lista.
  const counts = buildMonthCounts(monthRows ?? []);
  const list = (rows ?? []) as AppointmentRowDTO[];
  const { active: activeCount, expected } = summarizeDay(list);
  // Data por extenso, ex.: "segunda-feira, 16 de novembro".
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
        <div className="flex items-center gap-2 text-sm">
          <Link href={`/app/agenda?data=${date}`} className={`rounded-full border px-4 py-1.5 transition-colors ${!semana ? "border-accent bg-accent/10" : "border-border hover:bg-secondary"}`}>Dia</Link>
          <Link href={`/app/agenda?data=${date}&vista=semana`} className={`rounded-full border px-4 py-1.5 transition-colors ${semana ? "border-accent bg-accent/10" : "border-border hover:bg-secondary"}`}>Semana</Link>
        </div>
        <div className="flex items-center gap-2">
          {/* Navegação entre dias: anterior, hoje e próximo. */}
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

      {/* Calendário do mês, com a contagem de cada dia. */}
      <MonthCalendar year={year} month={month} counts={counts} selected={date} today={today} />

      <section className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-sm font-medium text-muted-foreground">Atendimentos do dia · {activeCount} ativos</h2>
          {expected > 0 && <p className="text-sm tabular-nums text-muted-foreground">Previsto: R$ {formatMoney(expected)}</p>}
        </div>
        {/* Se alguma consulta falhar, mostra o aviso em vez de parecer um dia vazio. */}
        {rowsError || monthError ? (
          <div className="rounded-2xl border border-dashed border-destructive/40 p-10 text-center text-sm text-destructive">
            Não foi possível carregar a agenda. Recarregue a página.
          </div>
        ) : list.length === 0 ? (
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
                    {semana ? `${new Date(row.starts_at).toLocaleDateString("pt-BR", { weekday: "short", day: "2-digit", timeZone: "America/Sao_Paulo" })} · ` : ""}{formatTime(row.starts_at)}
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
                          {PAYMENT_LABEL[row.payment_method]} · R$ {formatMoney(Number(row.amount_paid ?? 0))}
                        </span>
                      )}
                    </div>
                    {(row.status === "confirmed" || row.status === "pending_confirmation") && (
                      <div className="flex flex-col gap-2 md:items-end">
                        <OutcomeActions appointmentId={row.id} defaultAmount={service?.price ?? null} />
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
