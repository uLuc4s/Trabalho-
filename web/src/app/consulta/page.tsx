"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState, useTransition } from "react";
import { AlertCircle, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

type Booking = {
  status: string;
  starts_at: string;
  ends_at: string;
  service: string;
  employee: string;
  company: string;
  cancellable: boolean;
};

const STATUS: Record<string, string> = {
  pending_confirmation: "Aguardando confirmação",
  confirmed: "Confirmado",
  completed: "Concluído",
  cancelled: "Cancelado",
  no_show: "Não compareceu",
};

function Consulta() {
  const params = useSearchParams();
  const router = useRouter();
  const token = params.get("token") ?? "";
  const [booking, setBooking] = useState<Booking | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

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

  function cancel() {
    setError(null);
    startTransition(async () => {
      const { error: rpcError } = await createClient().rpc("public_cancel_booking", { p_token: token });
      if (rpcError) {
        setError(rpcError.message);
        return;
      }
      router.refresh();
      setBooking((b) => (b ? { ...b, status: "cancelled", cancellable: false } : b));
    });
  }

  if (!token) return <p className="text-sm text-destructive">Link incompleto.</p>;
  if (error && !booking) return <p className="text-sm text-destructive">{error}</p>;
  if (!booking) return <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" aria-hidden />;

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

      {booking.cancellable && (
        <button
          type="button"
          onClick={cancel}
          disabled={pending}
          className="h-11 w-fit rounded-full border border-border px-6 text-sm transition-colors hover:border-destructive hover:text-destructive disabled:opacity-50"
        >
          {pending ? "Cancelando..." : "Cancelar agendamento"}
        </button>
      )}
    </div>
  );
}

export default function ConsultaPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-6 py-12">
      <div className="w-full max-w-md rounded-2xl border border-border p-8 shadow-dashboard">
        <h1 className="mb-6 font-display text-4xl tracking-tight">Meu agendamento</h1>
        <Suspense fallback={null}>
          <Consulta />
        </Suspense>
      </div>
    </main>
  );
}
