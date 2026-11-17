// Remarcar um atendimento pelo painel: escolhe a nova data e hora e a regra do banco confirma.
// Roda no navegador porque tem formulário e chamada ao banco.
"use client";

import { useRouter } from "next/navigation"; // atualiza a agenda depois de remarcar
import { useState, useTransition } from "react"; // estado e transição de envio
import { CalendarClock, Loader2 } from "lucide-react"; // ícones
import { createClient } from "@/lib/supabase/client"; // cliente do navegador
import { useToast } from "@/components/ui/toast"; // aviso de sucesso ou erro

// Entrada: id do atendimento e data/hora atual (para sugerir no campo).
// Saída: botão "Remarcar" que abre a escolha de nova data e hora.
export function RescheduleAppointment({ appointmentId, startsAtLocal }: { appointmentId: string; startsAtLocal: string }) {
  const router = useRouter();
  const { notify } = useToast();
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState(startsAtLocal); // formato AAAA-MM-DDTHH:MM, horário de São Paulo
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  // Envia o novo horário. A hora digitada é de São Paulo, então vai com o deslocamento -03:00.
  function save() {
    setError(null);
    if (!value) return setError("Escolha a nova data e hora.");
    startTransition(async () => {
      const { error: rpcError } = await createClient().rpc("app_reschedule_appointment", {
        p_appointment_id: appointmentId,
        p_new_starts_at: `${value}:00-03:00`,
      });
      if (rpcError) {
        const busy = rpcError.message.includes("indisponível") || rpcError.message.includes("bloqueado");
        setError(busy ? "Esse horário não está livre para este profissional." : rpcError.message);
        notify("Não foi possível remarcar.", "error");
        return;
      }
      notify("Atendimento remarcado");
      setOpen(false);
      router.refresh();
    });
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex h-9 items-center gap-1.5 rounded-full border border-border px-3 text-xs transition-colors hover:bg-secondary"
      >
        <CalendarClock className="h-3.5 w-3.5" aria-hidden />
        Remarcar
      </button>
    );
  }

  return (
    <div className="flex w-full flex-col gap-2 text-xs md:w-auto">
      <div className="flex flex-wrap items-center gap-2">
        <input
          type="datetime-local"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          aria-label="Nova data e hora"
          className="h-9 rounded-md border border-input bg-background px-2 text-sm focus:border-accent focus:outline-none"
        />
        <button type="button" onClick={() => setOpen(false)} className="h-8 rounded-full px-3 text-muted-foreground hover:text-foreground">
          Voltar
        </button>
        <button
          type="button"
          onClick={save}
          disabled={pending}
          className="flex h-8 items-center gap-1.5 rounded-full bg-accent px-3 font-medium text-accent-foreground disabled:opacity-50"
        >
          {pending && <Loader2 className="h-3 w-3 animate-spin" aria-hidden />}
          Confirmar
        </button>
      </div>
      {error && <span className="text-destructive">{error}</span>}
    </div>
  );
}
