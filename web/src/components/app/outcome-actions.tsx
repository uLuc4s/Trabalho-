// Botões de fechamento de um atendimento: "Concluir" (com forma e valor de pagamento) e "Faltou".
// Roda no navegador porque tem clique, estado e chamada ao banco.
"use client";

import { useRouter } from "next/navigation"; // para atualizar a tela depois de gravar
import { useState, useTransition } from "react"; // estado local e transição (mostra carregamento)
import { Check, Loader2, UserX } from "lucide-react"; // ícones
import { createClient } from "@/lib/supabase/client"; // cliente do navegador para chamar a função do banco
import { cn } from "@/lib/utils"; // junta classes CSS

// Formas de pagamento aceitas, com o texto que aparece no botão.
const METHODS = [
  { value: "pix", label: "Pix" },
  { value: "cartao", label: "Cartão" },
  { value: "dinheiro", label: "Dinheiro" },
] as const;

// Entrada: id do atendimento e valor sugerido (preço do serviço, ou null).
// Saída: os botões de fechamento, e o formulário de pagamento quando o usuário escolhe "Concluir".
export function OutcomeActions({ appointmentId, defaultAmount }: { appointmentId: string; defaultAmount: number | null }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition(); // true enquanto a gravação está em andamento
  const [paying, setPaying] = useState(false); // true quando o formulário de pagamento está aberto
  const [method, setMethod] = useState<string | null>(null); // forma escolhida
  // Valor inicial: o preço do serviço, se houver. Vazio se for sob consulta.
  const [amount, setAmount] = useState(defaultAmount !== null ? String(defaultAmount) : "");
  const [error, setError] = useState<string | null>(null); // mensagem de erro para mostrar

  // Chama a função do banco que fecha o atendimento.
  // Entrada: situação (concluído ou falta), forma de pagamento e valor (null para falta).
  // Saída: atualiza a tela; se der erro, mostra a mensagem.
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
      router.refresh(); // recarrega os dados da página com o novo status
    });
  }

  // Modo de pagamento: aparece depois de clicar em "Concluir".
  if (paying) {
    return (
      <div className="flex flex-col gap-3 rounded-xl bg-secondary/60 p-3">
        <div className="flex flex-wrap gap-2">
          {METHODS.map((m) => (
            <button
              key={m.value}
              type="button"
              onClick={() => {
                setMethod(m.value);
                // Se já houver valor válido, conclui direto com esta forma.
                const value = Number(amount.replace(",", "."));
                if (amount.trim() !== "" && !Number.isNaN(value) && value >= 0) send("completed", m.value, value);
              }}
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
            inputMode="decimal" // teclado numérico no celular
            className="h-8 w-28 rounded-md border border-input bg-background px-2 text-xs focus:border-accent focus:outline-none"
          />
          <button
            type="button"
            disabled={!method || pending} // precisa escolher a forma antes
            onClick={() => {
              if (amount.trim() === "") return setError("Informe o valor recebido.");
              const value = Number(amount.replace(",", ".")); // aceita vírgula como separador
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

  // Modo normal: dois botões, "Concluir" (abre o pagamento) e "Faltou" (fecha direto).
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
        onClick={() => send("no_show", null, null)} // falta não tem pagamento
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
