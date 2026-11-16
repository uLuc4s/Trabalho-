// Checklist de uma tarefa do Kanban: marcar, desmarcar e adicionar itens.
// Roda no navegador porque tem clique, formulário e chamada ao banco.
"use client";

import { useRouter } from "next/navigation"; // para atualizar a tela depois de gravar
import { useState, useTransition } from "react"; // estado e transição de carregamento
import { Check, Plus } from "lucide-react"; // ícones de marcar e de adicionar
import { createClient } from "@/lib/supabase/client"; // cliente do navegador
import { cn } from "@/lib/utils"; // junta classes CSS

// Formato de um item do checklist, como a tela usa.
export type ChecklistItem = { id: string; title: string; done: boolean };

// Entrada: empresa, tarefa e itens atuais.
// Saída: lista de itens com contagem, campo para novo item e mensagem de erro se algo falhar.
export function TaskChecklist({
  companyId,
  taskId,
  items,
}: {
  companyId: string;
  taskId: string;
  items: ChecklistItem[];
}) {
  const router = useRouter();
  const [draft, setDraft] = useState(""); // texto digitado no campo de novo item
  const [pending, startTransition] = useTransition(); // true enquanto grava
  const [error, setError] = useState<string | null>(null); // erro para mostrar
  const done = items.filter((i) => i.done).length; // quantos itens já estão marcados

  // Marca ou desmarca um item e grava no banco.
  // Entrada: o item atual. Saída: inverte o campo done e atualiza a tela.
  function toggle(item: ChecklistItem) {
    startTransition(async () => {
      const { error: updateError } = await createClient().from("task_checklist_items").update({ done: !item.done }).eq("id", item.id);
      if (updateError) return setError("Não foi possível atualizar o item.");
      router.refresh();
    });
  }

  // Adiciona um item novo ao fim da lista.
  // Regra: o título precisa ter pelo menos 2 caracteres. Limpa o campo antes de gravar.
  function add() {
    const title = draft.trim();
    if (title.length < 2) return;
    setDraft("");
    startTransition(async () => {
      const { error: insertError } = await createClient().from("task_checklist_items").insert({
        company_id: companyId,
        task_id: taskId,
        title,
        position: items.length, // o novo item vai para o fim
      });
      if (insertError) return setError("Não foi possível adicionar o item.");
      router.refresh();
    });
  }

  return (
    // onPointerDown impede que clicar aqui arraste o card do Kanban.
    <div className="mt-3 flex flex-col gap-2 border-t border-border pt-3" onPointerDown={(e) => e.stopPropagation()}>
      {/* Contagem "2 de 5 concluídos", só se houver itens. */}
      {items.length > 0 && (
        <p className="text-[11px] tabular-nums text-muted-foreground">
          {done} de {items.length} concluídos
        </p>
      )}
      {error && <p className="text-xs text-destructive">{error}</p>}
      <ul className="flex flex-col gap-1.5">
        {items.map((item) => (
          <li key={item.id}>
            <button
              type="button"
              onClick={() => toggle(item)}
              disabled={pending}
              className="flex w-full items-center gap-2 rounded-md px-1 py-1 text-left text-xs transition-colors hover:bg-secondary/60 disabled:opacity-60"
            >
              {/* Caixinha que mostra o check quando o item está concluído. */}
              <span
                className={cn(
                  "flex h-4 w-4 shrink-0 items-center justify-center rounded border transition-colors duration-200",
                  item.done ? "border-accent bg-accent text-accent-foreground" : "border-border bg-background",
                )}
              >
                {item.done && <Check className="h-3 w-3" aria-hidden />}
              </span>
              {/* Texto riscado quando concluído. */}
              <span className={cn("min-w-0 break-words", item.done && "text-muted-foreground line-through")}>{item.title}</span>
            </button>
          </li>
        ))}
      </ul>
      {/* Formulário de novo item. Enter envia. */}
      <form
        onSubmit={(e) => {
          e.preventDefault(); // não recarrega a página
          add();
        }}
        className="flex items-center gap-1.5"
      >
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Novo item"
          className="h-7 min-w-0 flex-1 rounded-md border border-input bg-background px-2 text-xs focus:border-accent focus:outline-none"
        />
        <button
          type="submit"
          aria-label="Adicionar item"
          disabled={pending}
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-border transition-colors hover:bg-secondary"
        >
          <Plus className="h-3.5 w-3.5" aria-hidden />
        </button>
      </form>
    </div>
  );
}
