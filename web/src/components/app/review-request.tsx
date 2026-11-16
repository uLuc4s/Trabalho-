"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Check, Loader2, X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

type Decision = "approved" | "rejected";

export function ReviewRequest({ requestId }: { requestId: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [asking, setAsking] = useState<Decision | null>(null);
  const [error, setError] = useState<string | null>(null);

  function decide(decision: Decision) {
    setError(null);
    startTransition(async () => {
      const { error: rpcError } = await createClient().rpc("app_review_service_request", {
        p_request_id: requestId,
        p_decision: decision,
      });
      if (rpcError) {
        setError(rpcError.message);
        return;
      }
      router.refresh();
    });
  }

  if (asking) {
    return (
      <div className="flex flex-col items-end gap-2">
        <p className="text-xs text-muted-foreground">
          {asking === "approved" ? "Aprovar e abrir a ordem de serviço?" : "Recusar este pedido?"}
        </p>
        <div className="flex items-center gap-2">
          <button type="button" onClick={() => setAsking(null)} className="h-9 rounded-full px-3 text-xs text-muted-foreground hover:text-foreground">
            Voltar
          </button>
          <button
            type="button"
            onClick={() => decide(asking)}
            disabled={pending}
            className="flex h-9 items-center gap-1.5 rounded-full bg-accent px-4 text-xs font-medium text-accent-foreground disabled:opacity-50"
          >
            {pending && <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />}
            Sim, confirmar
          </button>
        </div>
        {error && <span className="text-xs text-destructive">{error}</span>}
      </div>
    );
  }

  return (
    <div className="flex flex-col items-end gap-2">
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => setAsking("rejected")}
          disabled={pending}
          className="flex h-9 items-center gap-1.5 rounded-full border border-border px-3 text-xs transition-colors hover:border-destructive hover:text-destructive disabled:opacity-50"
        >
          <X className="h-3.5 w-3.5" aria-hidden />
          Recusar
        </button>
        <button
          type="button"
          onClick={() => setAsking("approved")}
          disabled={pending}
          className="flex h-9 items-center gap-1.5 rounded-full bg-accent px-4 text-xs font-medium text-accent-foreground transition-colors hover:bg-accent/90 disabled:opacity-50"
        >
          <Check className="h-3.5 w-3.5" aria-hidden />
          Aprovar e abrir ordem
        </button>
      </div>
    </div>
  );
}
