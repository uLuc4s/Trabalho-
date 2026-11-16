"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Check, Loader2, UserX } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

const METHODS = [
  { value: "pix", label: "Pix" },
  { value: "cartao", label: "Cartão" },
  { value: "dinheiro", label: "Dinheiro" },
] as const;

export function OutcomeActions({ appointmentId, defaultAmount }: { appointmentId: string; defaultAmount: number | null }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [paying, setPaying] = useState(false);
  const [method, setMethod] = useState<string | null>(null);
  const [amount, setAmount] = useState(defaultAmount !== null ? String(defaultAmount) : "");
  const [error, setError] = useState<string | null>(null);

  function send(status: "completed" | "no_show", payment: string | null, value: number | null) {
    setError(null);
    startTransition(async () => {
      const { error: rpcError } = await createClient().rpc("app_set_appointment_outcome", {
        p_appointment_id: appointmentId,
        p_status: status,
        p_payment_method: payment,
        p_amount: value,
      });
      if (rpcError) {
        setError(rpcError.message);
        return;
      }
      router.refresh();
    });
  }

  if (paying) {
    return (
      <div className="flex flex-col gap-3 rounded-xl bg-secondary/60 p-3">
        <div className="flex flex-wrap gap-2">
          {METHODS.map((m) => (
            <button
              key={m.value}
              type="button"
              onClick={() => setMethod(m.value)}
              aria-pressed={method === m.value}
              className={cn(
                "flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs transition-all duration-200",
                method === m.value ? "border-accent bg-accent/10" : "border-border bg-background",
              )}
            >
              {method === m.value && <Check className="h-3 w-3 text-accent" aria-hidden />}
              {m.label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <input
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="Valor (R$)"
            inputMode="decimal"
            className="h-8 w-28 rounded-md border border-input bg-background px-2 text-xs focus:border-accent focus:outline-none"
          />
          <button
            type="button"
            disabled={!method || pending}
            onClick={() => {
              const value = Number(amount.replace(",", "."));
              if (Number.isNaN(value) || value < 0) return setError("Valor inválido.");
              send("completed", method, value);
            }}
            className="flex h-8 items-center gap-1.5 rounded-full bg-accent px-4 text-xs font-medium text-accent-foreground transition-colors hover:bg-accent/90 disabled:opacity-40"
          >
            {pending && <Loader2 className="h-3 w-3 animate-spin" aria-hidden />}
            Confirmar pagamento
          </button>
          <button type="button" onClick={() => setPaying(false)} className="text-xs text-muted-foreground hover:text-foreground">
            Voltar
          </button>
        </div>
        {error && <span className="text-xs text-destructive">{error}</span>}
      </div>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <button
        type="button"
        onClick={() => setPaying(true)}
        disabled={pending}
        className="flex h-9 items-center gap-1.5 rounded-full bg-accent px-3 text-xs font-medium text-accent-foreground transition-colors hover:bg-accent/90 disabled:opacity-50"
      >
        <Check className="h-3.5 w-3.5" aria-hidden />
        Concluir
      </button>
      <button
        type="button"
        onClick={() => send("no_show", null, null)}
        disabled={pending}
        className="flex h-9 items-center gap-1.5 rounded-full border border-border px-3 text-xs transition-colors hover:bg-secondary disabled:opacity-50"
      >
        <UserX className="h-3.5 w-3.5" aria-hidden />
        Faltou
      </button>
      {error && <span className="text-xs text-destructive">{error}</span>}
    </div>
  );
}
