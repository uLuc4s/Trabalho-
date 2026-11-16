// Botão de apagar os dados de um cliente (LGPD), com confirmação em duas etapas.
// Roda no navegador porque tem clique, confirmação e chamada ao banco.
"use client";

import { useRouter } from "next/navigation"; // para atualizar a tela depois de apagar
import { useState, useTransition } from "react"; // estado e transição de carregamento
import { Loader2, Trash2 } from "lucide-react"; // ícones
import { createClient } from "@/lib/supabase/client"; // cliente do navegador

// Entrada: id do cliente.
// Saída: botão "Apagar dados". Ao clicar, aparece a confirmação com aviso de que não dá para desfazer.
export function ForgetCustomer({ customerId }: { customerId: string }) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false); // true quando a confirmação está aberta
  const [pending, startTransition] = useTransition(); // true enquanto apaga
  const [error, setError] = useState<string | null>(null);

  // Chama a função do banco que anonimiza o cliente e cancela os horários futuros.
  function forget() {
    setError(null);
    startTransition(async () => {
      const { error: rpcError } = await createClient().rpc("app_anonymize_customer", { p_customer_id: customerId });
      if (rpcError) {
        setError(rpcError.message);
        return;
      }
      router.refresh(); // o cliente aparece como "Cliente removido"
    });
  }

  // Primeira etapa: só o botão de apagar.
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

  // Segunda etapa: aviso claro e confirmação explícita.
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
