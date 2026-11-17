// Quadro Kanban de tarefas: colunas, cards que se arrastam entre colunas, criação e remoção.
// Roda no navegador porque tem arrastar, formulários e chamadas ao banco.
"use client";

import { useRouter } from "next/navigation"; // para atualizar a tela depois de cada gravação
import { useState, useTransition } from "react"; // estado e transição de carregamento
import { Loader2, Plus, Trash2 } from "lucide-react"; // ícones
import { createClient } from "@/lib/supabase/client"; // cliente do navegador
import { cn } from "@/lib/utils"; // junta classes CSS
import { TaskChecklist, type ChecklistItem } from "@/components/app/tarefas/task-checklist"; // checklist de cada card

// Formato de uma coluna.
export type Column = { id: string; name: string; position: number };
// Formato de uma tarefa, já com o checklist.
export type Task = {
  id: string;
  title: string;
  column_id: string;
  description: string | null;
  checklist: ChecklistItem[];
};

// Entrada: empresa, quadro (ou null), colunas, tarefas e se o usuário pode criar o quadro.
// Saída: o quadro com as colunas e os cards. Sem quadro, mostra o botão de criar (ou um aviso).
export function KanbanBoard({
  companyId,
  boardId,
  columns,
  tasks,
  canManage,
}: {
  companyId: string;
  boardId: string | null;
  columns: Column[];
  tasks: Task[];
  canManage: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition(); // true enquanto grava
  const [dragging, setDragging] = useState<string | null>(null); // id do card sendo arrastado
  const [over, setOver] = useState<string | null>(null); // id da coluna sob o cursor
  const [draft, setDraft] = useState<Record<string, string>>({}); // texto de nova tarefa, por coluna
  const [error, setError] = useState<string | null>(null);

  // Executa uma ação no banco, atualiza a tela ou mostra o erro.
  // Entrada: função que recebe o cliente e devolve a resposta do Supabase.
  function run(action: (supabase: ReturnType<typeof createClient>) => PromiseLike<{ error: { message: string } | null }>) {
    setError(null);
    startTransition(async () => {
      const { error: actionError } = await action(createClient());
      if (actionError) {
        setError(actionError.message);
        return;
      }
      router.refresh();
    });
  }

  // Cria o quadro "Operação" com três colunas padrão.
  // Saída: se o quadro falhar, mostra erro. Se as colunas falharem, avisa para recarregar.
  function createBoard() {
    startTransition(async () => {
      const supabase = createClient();
      // Cria o quadro e pega o id dele.
      const { data: board, error: boardError } = await supabase
        .from("task_boards")
        .insert({ company_id: companyId, name: "Operação" })
        .select("id")
        .single();
      if (boardError || !board) {
        setError("Não foi possível criar o quadro.");
        return;
      }
      // Cria as três colunas padrão ligadas ao quadro novo.
      const { error: columnsError } = await supabase.from("task_columns").insert(
        ["A fazer", "Em andamento", "Concluído"].map((name, position) => ({
          company_id: companyId,
          board_id: board.id,
          name,
          position,
        })),
      );
      if (columnsError) {
        setError("Quadro criado, mas as colunas falharam. Recarregue a página.");
        return;
      }
      router.refresh();
    });
  }

  // Cria uma tarefa na coluna indicada.
  // Regra: o título precisa ter pelo menos 2 caracteres. Vai para o fim da coluna.
  function addTask(columnId: string) {
    const title = (draft[columnId] ?? "").trim();
    if (!boardId || title.length < 2) return;
    setDraft((d) => ({ ...d, [columnId]: "" })); // limpa o campo antes de gravar
    run(async (supabase) => {
      const { data: userData } = await supabase.auth.getUser(); // quem criou
      return supabase.from("tasks").insert({
        company_id: companyId,
        board_id: boardId,
        column_id: columnId,
        title,
        created_by: userData.user?.id ?? null,
        position: tasks.filter((t) => t.column_id === columnId).length, // última posição da coluna
      });
    });
  }

  // Move uma tarefa para outra coluna. Não faz nada se for a mesma coluna.
  function moveTask(taskId: string, columnId: string) {
    setOver(null);
    setDragging(null);
    const task = tasks.find((t) => t.id === taskId);
    if (!task || task.column_id === columnId) return;
    run((supabase) => supabase.from("tasks").update({ column_id: columnId }).eq("id", taskId));
  }

  // Apaga uma tarefa.
  function removeTask(taskId: string) {
    run((supabase) => supabase.from("tasks").delete().eq("id", taskId));
  }

  // Sem quadro ou sem colunas: tela de criação (para dono e admin) ou aviso (para os outros).
  if (!boardId || columns.length === 0) {
    return (
      <div className="flex flex-col items-start gap-4 rounded-2xl border border-dashed border-border p-10">
        <p className="text-sm text-muted-foreground">Ainda não há quadro de tarefas para a sua empresa.</p>
        {canManage ? (
          <button
            type="button"
            onClick={createBoard}
            disabled={pending}
            className="flex h-10 items-center gap-2 rounded-full bg-accent px-5 text-sm font-medium text-accent-foreground transition-colors hover:bg-accent/90 disabled:opacity-50"
          >
            {pending && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
            Criar quadro
          </button>
        ) : (
          <p className="text-xs text-muted-foreground">Peça ao dono ou administrador para criar o quadro.</p>
        )}
        {error && <p className="text-sm text-destructive">{error}</p>}
      </div>
    );
  }

  // Quadro normal: uma seção por coluna, com os cards e o campo de nova tarefa.
  return (
    <div className="flex flex-col gap-4">
      {error && <p className="text-sm text-destructive">{error}</p>}
      <div className="grid gap-4 md:grid-cols-3">
        {columns.map((column) => {
          const items = tasks.filter((t) => t.column_id === column.id); // cards desta coluna
          const isOver = over === column.id; // destaque quando um card está sobre ela
          return (
            <section
              key={column.id}
              // Aceita o drop: precisa cancelar o padrão do navegador.
              onDragOver={(e) => {
                e.preventDefault();
                setOver(column.id);
              }}
              onDragLeave={() => setOver((current) => (current === column.id ? null : current))}
              onDrop={(e) => {
                e.preventDefault();
                // Pega o id do card arrastado: primeiro do dataTransfer, depois do estado.
                const taskId = e.dataTransfer.getData("text/plain") || dragging;
                if (taskId) moveTask(taskId, column.id);
              }}
              className={cn(
                "flex min-h-[320px] flex-col gap-3 rounded-2xl border p-4 transition-colors duration-300",
                isOver ? "border-accent bg-accent/5" : "border-border bg-secondary/40",
              )}
            >
              <header className="flex items-center justify-between px-1">
                <h2 className="text-sm font-semibold">{column.name}</h2>
                <span className="rounded-full bg-background px-2 py-0.5 text-xs tabular-nums text-muted-foreground">{items.length}</span>
              </header>

              <ul className="flex flex-col gap-2">
                {items.map((task) => (
                  <li
                    key={task.id}
                    draggable // permite arrastar o card
                    onDragStart={(e) => {
                      e.dataTransfer.setData("text/plain", task.id); // leva o id junto com o arraste
                      setDragging(task.id);
                    }}
                    onDragEnd={() => {
                      setDragging(null);
                      setOver(null);
                    }}
                    className={cn(
                      "group flex cursor-grab items-start justify-between gap-3 rounded-xl border border-border bg-background p-4 text-sm shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-dashboard active:cursor-grabbing",
                      dragging === task.id && "opacity-40", // card original fica apagado enquanto é arrastado
                    )}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-3">
                        <span className="min-w-0 break-words font-medium">{task.title}</span>
                        {/* Lixeira que aparece ao passar o mouse. */}
                        <button
                          type="button"
                          aria-label="Remover tarefa"
                          onClick={() => removeTask(task.id)}
                          className="shrink-0 text-muted-foreground opacity-0 transition-all group-hover:opacity-100 hover:text-destructive"
                        >
                          <Trash2 className="h-3.5 w-3.5" aria-hidden />
                        </button>
                      </div>
                      {/* Contador "2/5" dos itens do checklist, se houver. */}
                      {task.checklist.length > 0 && (
                        <span className="mt-2 inline-block rounded-full bg-secondary px-2 py-0.5 text-[10px] tabular-nums text-muted-foreground">
                          {task.checklist.filter((i) => i.done).length}/{task.checklist.length}
                        </span>
                      )}
                      <TaskChecklist companyId={companyId} taskId={task.id} items={task.checklist} />
                    </div>
                  </li>
                ))}
              </ul>

              {/* Campo para criar uma tarefa nova nesta coluna. */}
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  addTask(column.id);
                }}
                className="mt-auto flex items-center gap-2"
              >
                <input
                  value={draft[column.id] ?? ""}
                  onChange={(e) => setDraft((d) => ({ ...d, [column.id]: e.target.value }))}
                  placeholder="Nova tarefa"
                  className="h-9 min-w-0 flex-1 rounded-md border border-input bg-background px-3 text-sm focus:border-accent focus:outline-none"
                />
                <button
                  type="submit"
                  aria-label="Adicionar tarefa"
                  disabled={pending}
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-accent text-accent-foreground transition-colors hover:bg-accent/90 disabled:opacity-50"
                >
                  <Plus className="h-4 w-4" aria-hidden />
                </button>
              </form>
            </section>
          );
        })}
      </div>
    </div>
  );
}
