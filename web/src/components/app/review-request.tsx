// Botões de decisão de uma solicitação: "Recusar" e "Aprovar e abrir ordem", com confirmação antes.
// Roda no navegador porque tem clique, confirmação e chamada ao banco.
"use client";

import { useRouter } from "next/navigation"; // para atualizar a tela depois de decidir
import { useState, useTransition } from "react"; // estado e transição de carregamento
import { Check, Loader2, X } from "lucide-react"; // ícones
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/components/ui/toast"; // cliente do navegador

// Decisões possíveis que o usuário pode confirmar.
type Decision = "approved" | "rejected";

// Entrada: id da solicitação.
// Saída: botões de decisão. Ao clicar, pede confirmação antes de chamar o banco.
export function ReviewRequest({ requestId }: { requestId: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition(); // true enquanto grava
  const [asking, setAsking] = useState<Decision | null>(null); // decisão aguardando confirmação
  const [error, setError] = useState<string | null>(null);
  const { notify } = useToast();

  // Chama a função do banco que aprova ou recusa a solicitação.
  // Entrada: a decisão confirmada.
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
      notify(decision === "approved" ? "Pedido aprovado e ordem aberta" : "Pedido recusado");
      router.refresh(); // mostra a solicitação na lista de decididas
    });
  }

  // Tela de confirmação: explica o que vai acontecer e pede o "sim".
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

  // Tela normal: os dois botões de decisão. Cada um só abre a confirmação.
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
