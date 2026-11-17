// Botão de cancelar um atendimento pela equipe, com confirmação em duas etapas.
// Chama a função do banco só depois que o usuário confirma, e atualiza a tela.
// Roda no navegador porque tem clique, estado e chamada ao banco.
"use client";

import { useRouter } from "next/navigation"; // para atualizar a tela depois de cancelar
import { useState, useTransition } from "react"; // estado e transição de carregamento
import { Loader2, X } from "lucide-react"; // ícones de carregamento e de cancelar
import { createClient } from "@/lib/supabase/client"; // cliente do navegador
import { useToast } from "@/components/ui/toast"; // aviso de sucesso ou erro

// Entrada: id do atendimento.
// Saída: botão "Cancelar". O primeiro clique pede confirmação; só o segundo cancela de fato.
export function CancelAppointment({ appointmentId }: { appointmentId: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition(); // true enquanto cancela
  const [confirming, setConfirming] = useState(false); // true depois do primeiro clique
  const [error, setError] = useState<string | null>(null);
  const { notify } = useToast();

  // Chama a função do banco que cancela o atendimento.
  function cancel() {
    setError(null);
    startTransition(async () => {
      const supabase = createClient();
      const { error: rpcError } = await supabase.rpc("app_cancel_appointment", { p_appointment_id: appointmentId });
      if (rpcError) {
        setError(rpcError.message);
        notify("Não foi possível cancelar.", "error");
        return;
      }
      setConfirming(false);
      notify("Atendimento cancelado");
      router.refresh(); // o atendimento some das ativas e fica cancelado na lista
    });
  }

  // Primeira etapa: só o botão de cancelar.
  if (!confirming) {
    return (
      <button
        type="button"
        onClick={() => setConfirming(true)}
        className="flex h-9 items-center gap-1.5 rounded-full border border-border px-3 text-xs transition-colors hover:border-destructive hover:text-destructive"
      >
        <X className="h-3.5 w-3.5" aria-hidden />
        Cancelar
      </button>
    );
  }

  // Segunda etapa: confirmação explícita, com opção de voltar sem cancelar.
  return (
    <div className="flex flex-col items-end gap-2 text-xs">
      <p className="text-right text-muted-foreground">Cancelar este atendimento? O horário fica livre para outro cliente.</p>
      <div className="flex gap-2">
        <button type="button" onClick={() => setConfirming(false)} className="h-8 rounded-full px-3 text-muted-foreground hover:text-foreground">
          Voltar
        </button>
        <button
          type="button"
          onClick={cancel}
          disabled={pending}
          className="flex h-8 items-center gap-1.5 rounded-full bg-destructive px-3 font-medium text-white disabled:opacity-50"
        >
          {pending && <Loader2 className="h-3 w-3 animate-spin" aria-hidden />}
          Sim, cancelar
        </button>
      </div>
      {error && <span className="text-destructive">{error}</span>}
    </div>
  );
}
