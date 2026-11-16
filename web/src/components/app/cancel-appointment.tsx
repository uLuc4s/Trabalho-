// Botão de cancelar um atendimento pela equipe. Chama a função do banco e atualiza a tela.
// Roda no navegador porque tem clique e chamada ao banco.
"use client";

import { useRouter } from "next/navigation"; // para atualizar a tela depois de cancelar
import { useState, useTransition } from "react"; // estado e transição de carregamento
import { Loader2, X } from "lucide-react"; // ícones de carregamento e de cancelar
import { createClient } from "@/lib/supabase/client"; // cliente do navegador

// Entrada: id do atendimento.
// Saída: botão "Cancelar". Mostra erro embaixo se o banco recusar.
export function CancelAppointment({ appointmentId }: { appointmentId: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition(); // true enquanto cancela
  const [error, setError] = useState<string | null>(null);

  // Chama a função do banco que cancela o atendimento.
  function cancel() {
    setError(null);
    startTransition(async () => {
      const supabase = createClient();
      const { error: rpcError } = await supabase.rpc("app_cancel_appointment", { p_appointment_id: appointmentId });
      if (rpcError) {
        setError(rpcError.message);
        return;
      }
      router.refresh(); // o atendimento some das ativas e fica cancelado na lista
    });
  }

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={cancel}
        disabled={pending}
        className="flex h-9 items-center gap-1.5 rounded-full border border-border px-3 text-xs transition-colors hover:border-destructive hover:text-destructive disabled:opacity-50"
      >
        {/* Enquanto cancela, troca o X pelo carregamento. */}
        {pending ? <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden /> : <X className="h-3.5 w-3.5" aria-hidden />}
        Cancelar
      </button>
      {error && <span className="text-xs text-destructive">{error}</span>}
    </div>
  );
}
