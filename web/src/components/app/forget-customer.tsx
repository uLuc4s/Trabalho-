"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Loader2, Trash2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export function ForgetCustomer({ customerId }: { customerId: string }) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function forget() {
    setError(null);
    startTransition(async () => {
      const { error: rpcError } = await createClient().rpc("app_anonymize_customer", { p_customer_id: customerId });
      if (rpcError) {
        setError(rpcError.message);
        return;
      }
      router.refresh();
    });
  }

  if (!confirming) {
    return (
      <button
        type="button"
        onClick={() => setConfirming(true)}
        className="flex h-9 items-center gap-1.5 rounded-full border border-border px-3 text-xs text-muted-foreground transition-colors hover:border-destructive hover:text-destructive"
      >
        <Trash2 className="h-3.5 w-3.5" aria-hidden />
        Apagar dados
      </button>
    );
  }

  return (
    <div className="flex flex-col items-end gap-2 text-xs">
      <p className="max-w-[260px] text-right text-muted-foreground">
        Apaga nome, telefone e e-mail deste cliente e cancela os horários futuros. Não dá para desfazer.
      </p>
      <div className="flex gap-2">
        <button type="button" onClick={() => setConfirming(false)} className="h-8 rounded-full px-3 text-muted-foreground hover:text-foreground">
          Cancelar
        </button>
        <button
          type="button"
          onClick={forget}
          disabled={pending}
          className="flex h-8 items-center gap-1.5 rounded-full bg-destructive px-3 font-medium text-white disabled:opacity-50"
        >
          {pending && <Loader2 className="h-3 w-3 animate-spin" aria-hidden />}
          Confirmar exclusão
        </button>
      </div>
      {error && <span className="text-destructive">{error}</span>}
    </div>
  );
}
