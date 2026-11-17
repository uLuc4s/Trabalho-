// Botões de avanço de uma ordem de serviço. Mostra só as transições permitidas para o status atual.
// Roda no navegador porque tem clique e chamada ao banco.
"use client";

import { useRouter } from "next/navigation"; // para atualizar a tela depois de mudar o status
import { useState, useTransition } from "react"; // estado e transição de carregamento
import { Loader2 } from "lucide-react"; // ícone de carregamento
import { createClient } from "@/lib/supabase/client"; // cliente do navegador

// Transições permitidas por status, com o texto de cada botão.
// Deve espelhar a tabela de transições da função app_set_work_order_status no banco.
const NEXT: Record<string, { status: string; label: string }[]> = {
  open: [
    { status: "scheduled", label: "Programar" },
    { status: "cancelled", label: "Cancelar" },
  ],
  scheduled: [
    { status: "in_progress", label: "Iniciar" },
    { status: "cancelled", label: "Cancelar" },
  ],
  in_progress: [
    { status: "completed", label: "Concluir" },
    { status: "cancelled", label: "Cancelar" },
  ],
};

// Entrada: id e status atual da ordem.
// Saída: os botões das ações possíveis. Ordem concluída ou cancelada não mostra nada.
export function WorkOrderActions({ workOrderId, status }: { workOrderId: string; status: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition(); // true enquanto grava
  const [error, setError] = useState<string | null>(null);
  const actions = NEXT[status] ?? []; // ações do status atual, ou lista vazia

  // Muda o status da ordem pelo banco.
  // Entrada: novo status. Saída: recarrega a tela, ou mostra o erro.
  function move(next: string) {
    setError(null);
    startTransition(async () => {
      const supabase = createClient();
      const { error: rpcError } = await supabase.rpc("app_set_work_order_status", {
        p_work_order_id: workOrderId,
        p_status: next,
      });
      if (rpcError) {
        setError(rpcError.message);
        return;
      }
      router.refresh();
    });
  }

  // Sem ação possível (concluída ou cancelada): não renderiza nada.
  if (actions.length === 0) return null;

  return (
    <div className="flex flex-col items-end gap-2">
      <div className="flex flex-wrap items-center gap-2">
        {actions.map((action) => (
          <button
            key={action.status}
            type="button"
            onClick={() => move(action.status)}
            disabled={pending}
            className="flex h-9 items-center gap-1.5 rounded-full border border-border px-4 text-xs transition-colors hover:bg-secondary disabled:opacity-50"
          >
            {pending && <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />}
            {action.label}
          </button>
        ))}
      </div>
      {error && <span className="text-xs text-destructive">{error}</span>}
    </div>
  );
}
