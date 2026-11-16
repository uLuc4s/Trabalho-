// Página do cliente para consultar, remarcar ou cancelar um agendamento, usando o link recebido (?token=).
// Não exige login: o token é a única credencial.
// ATENÇÃO: o token fica na URL e pode aparecer em histórico e logs de acesso.
"use client";

import { useRouter, useSearchParams } from "next/navigation"; // lê a URL e navega
import { Suspense, useEffect, useMemo, useState, useTransition } from "react"; // estado e efeitos
import { AlertCircle, Loader2 } from "lucide-react"; // ícones
import { createClient } from "@/lib/supabase/client"; // cliente do navegador
import { cn } from "@/lib/utils"; // junta classes CSS

// Dados do agendamento, como a função public_get_booking devolve.
type Booking = {
  status: string;
  starts_at: string;
  ends_at: string;
  service: string;
  service_id: string;
  employee: string;
  employee_id: string;
  company: string;
  company_slug: string;
  cancellable: boolean; // true se ainda está ativo e dentro do prazo
};
// Horário livre devolvido pelo banco.
type Slot = { slot_start: string; slot_employee_id: string };

// Texto de cada situação do agendamento.
const STATUS: Record<string, string> = {
  pending_confirmation: "Aguardando confirmação",
  confirmed: "Confirmado",
  completed: "Concluído",
  cancelled: "Cancelado",
  no_show: "Não compareceu",
};

// Quantos dias à frente o cliente pode escolher na remarcação.
const DAYS = 14;
// Data no formato AAAA-MM-DD, no fuso de São Paulo.
const isoDate = (d: Date) => d.toLocaleDateString("en-CA", { timeZone: "America/Sao_Paulo" });
// Só a hora, ex.: "09:30".
const timeLabel = (iso: string) => new Date(iso).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit", timeZone: "America/Sao_Paulo" });

// Remarcação: escolhe um novo dia e horário com o mesmo profissional e serviço.
// Entrada: token, dados do agendamento e a função chamada quando remarca com sucesso.
// Saída: seleção de dia e horário, e o botão de confirmar.
function Reschedule({ token, booking, onDone }: { token: string; booking: Booking; onDone: (startsAt: string) => void }) {
  const [date, setDate] = useState<string | null>(null); // dia escolhido
  const [slots, setSlots] = useState<Slot[] | null>(null); // horários livres; null = carregando
  const [chosen, setChosen] = useState<Slot | null>(null); // horário escolhido
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition(); // true enquanto remarca

  // Próximos 14 dias, começando amanhã. Calculado uma vez.
  const days = useMemo(() => {
    const base = new Date();
    return Array.from({ length: DAYS }, (_, i) => {
      const d = new Date(base);
      d.setDate(base.getDate() + i + 1);
      return d;
    });
  }, []);

  // Ao escolher um dia, busca os horários livres do mesmo profissional.
  // A flag "active" descarta respostas antigas se o usuário trocar de dia rápido.
  useEffect(() => {
    if (!date) return;
    let active = true;
    createClient()
      .rpc("public_available_slots", {
        p_slug: booking.company_slug,
        p_service_id: booking.service_id,
        p_date: date,
        p_employee_id: booking.employee_id, // mantém o mesmo profissional
      })
      .then(({ data, error: rpcError }) => {
        if (!active) return;
        if (rpcError) {
          setError("Não foi possível carregar os horários.");
          setSlots([]);
          return;
        }
        setError(null);
        setSlots((data ?? []) as Slot[]);
      });
    return () => {
      active = false;
    };
  }, [date, booking.company_slug, booking.service_id, booking.employee_id]);

  // Grava a nova data pelo banco. Se outra pessoa pegou o horário, explica.
  function confirm() {
    if (!chosen) return;
    setError(null);
    startTransition(async () => {
      const { error: rpcError } = await createClient().rpc("public_reschedule_booking", {
        p_token: token,
        p_new_starts_at: chosen.slot_start,
      });
      if (rpcError) {
        setError(rpcError.message.includes("indisponível") ? "Esse horário acabou de ser ocupado. Escolha outro." : rpcError.message);
        return;
      }
      onDone(chosen.slot_start);
    });
  }

  return (
    <div className="flex flex-col gap-4 border-t border-border pt-6">
      <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Novo dia</p>
      {/* Faixa de dias. Rola na horizontal no celular. */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {days.map((d) => {
          const key = isoDate(d);
          return (
            <button
              key={key}
              type="button"
              onClick={() => {
                setDate(key);
                setSlots(null);
                setChosen(null);
              }}
              className={cn(
                "flex min-w-[56px] shrink-0 flex-col items-center rounded-xl border px-3 py-2 text-xs transition-all duration-200",
                date === key ? "border-accent bg-accent text-accent-foreground" : "border-border hover:border-accent/50",
              )}
            >
              <span className="uppercase opacity-70">{d.toLocaleDateString("pt-BR", { weekday: "short", timeZone: "America/Sao_Paulo" })}</span>
              <span className="text-base tabular-nums">{d.toLocaleDateString("pt-BR", { day: "2-digit", timeZone: "America/Sao_Paulo" })}</span>
            </button>
          );
        })}
      </div>

      {/* Estados da lista de horários: carregando, vazio ou a grade. */}
      {date && slots === null && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" aria-hidden />}
      {date && slots && slots.length === 0 && <p className="text-sm text-muted-foreground">Sem horário livre neste dia.</p>}
      {slots && slots.length > 0 && (
        <div className="grid grid-cols-3 gap-2">
          {slots.map((slot) => {
            const selected = chosen?.slot_start === slot.slot_start;
            return (
              <button
                key={slot.slot_start}
                type="button"
                onClick={() => setChosen(slot)}
                className={cn(
                  "rounded-lg border py-2 text-sm tabular-nums transition-all duration-200",
                  selected ? "border-accent bg-accent text-accent-foreground" : "border-border hover:border-accent/50",
                )}
              >
                {timeLabel(slot.slot_start)}
              </button>
            );
          })}
        </div>
      )}

      {error && (
        <p role="alert" className="flex items-center gap-2 text-sm text-destructive">
          <AlertCircle className="h-4 w-4" aria-hidden />
          {error}
        </p>
      )}

      {/* Só libera quando há um horário escolhido e nada está sendo gravado. */}
      <button
        type="button"
        onClick={confirm}
        disabled={!chosen || pending}
        className="flex h-11 w-fit items-center gap-2 rounded-full bg-accent px-6 text-sm font-medium text-accent-foreground transition-colors hover:bg-accent/90 disabled:opacity-40"
      >
        {pending && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
        Confirmar nova data
      </button>
    </div>
  );
}

// Tela principal da consulta: carrega o agendamento pelo token e oferece remarcar ou cancelar.
function Consulta() {
  const params = useSearchParams(); // parâmetros da URL
  const router = useRouter();
  const token = params.get("token") ?? ""; // token do link, ou vazio
  const [booking, setBooking] = useState<Booking | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState(false); // true quando a remarcação está aberta
  const [pending, startTransition] = useTransition(); // true enquanto cancela

  // Busca o agendamento assim que o token chega. Se der erro, mostra mensagem.
  useEffect(() => {
    if (!token) return;
    let active = true;
    createClient()
      .rpc("public_get_booking", { p_token: token })
      .then(({ data, error: rpcError }) => {
        if (!active) return;
        if (rpcError) {
          setError("Agendamento não encontrado. Verifique o link.");
          return;
        }
        setBooking(data as Booking);
      });
    return () => {
      active = false;
    };
  }, [token]);

  // Cancela o agendamento pelo token e atualiza a tela na hora.
  function cancel() {
    setError(null);
    startTransition(async () => {
      const { error: rpcError } = await createClient().rpc("public_cancel_booking", { p_token: token });
      if (rpcError) {
        setError(rpcError.message);
        return;
      }
      setBooking((b) => (b ? { ...b, status: "cancelled", cancellable: false } : b));
      router.refresh();
    });
  }

  // Sem token: link incompleto. Erro sem dados: mostra só o erro. Carregando: spinner.
  if (!token) return <p className="text-sm text-destructive">Link incompleto.</p>;
  if (error && !booking) return <p className="text-sm text-destructive">{error}</p>;
  if (!booking) return <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" aria-hidden />;

  // Data por extenso no fuso de São Paulo.
  const when = new Date(booking.starts_at).toLocaleString("pt-BR", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "America/Sao_Paulo",
  });

  return (
    <div className="flex flex-col gap-6">
      <div>
        <p className="text-sm text-muted-foreground">{booking.company}</p>
        <p className="mt-2 font-display text-3xl capitalize tracking-tight">{when}</p>
        <p className="mt-2 text-sm">
          {booking.service} com {booking.employee}
        </p>
        <span className="mt-4 inline-block rounded-full bg-secondary px-3 py-1 text-xs">{STATUS[booking.status] ?? booking.status}</span>
      </div>

      {error && (
        <p role="alert" className="flex items-center gap-2 text-sm text-destructive">
          <AlertCircle className="h-4 w-4" aria-hidden />
          {error}
        </p>
      )}

      {/* Botões de remarcar e cancelar: só aparecem se ainda for possível. */}
      {booking.cancellable && !editing && (
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="h-11 rounded-full bg-accent px-6 text-sm font-medium text-accent-foreground transition-colors hover:bg-accent/90"
          >
            Remarcar
          </button>
          <button
            type="button"
            onClick={cancel}
            disabled={pending}
            className="h-11 rounded-full border border-border px-6 text-sm transition-colors hover:border-destructive hover:text-destructive disabled:opacity-50"
          >
            {pending ? "Cancelando..." : "Cancelar agendamento"}
          </button>
        </div>
      )}

      {editing && (
        <Reschedule
          token={token}
          booking={booking}
          onDone={(startsAt) => {
            setEditing(false);
            setBooking((b) => (b ? { ...b, starts_at: startsAt } : b));
            router.refresh();
          }}
        />
      )}
    </div>
  );
}

// Página da rota. O Suspense é exigido pelo Next para useSearchParams em páginas estáticas.
export default function ConsultaPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-6 py-12">
      <div className="w-full max-w-lg rounded-2xl border border-border p-8 shadow-dashboard">
        <h1 className="mb-6 font-display text-4xl tracking-tight">Meu agendamento</h1>
        <Suspense fallback={null}>
          <Consulta />
        </Suspense>
      </div>
    </main>
  );
}
