import { KanbanBoard, type Column, type Task } from "@/components/app/kanban-board";
import { getCurrentCompany } from "@/lib/company";

export default async function TarefasPage() {
  const { supabase, company, role } = await getCurrentCompany();
  const canManage = role === "owner" || role === "admin";

  const { data: board, error: boardError } = await supabase.from("task_boards").select("id").order("created_at").limit(1).maybeSingle();

  const [{ data: columns }, { data: tasks }, { data: items }] = await Promise.all([
    board
      ? supabase.from("task_columns").select("id, name, position").eq("board_id", board.id).order("position")
      : Promise.resolve({ data: [] as Column[] }),
    board
      ? supabase.from("tasks").select("id, title, column_id, description").eq("board_id", board.id).order("position")
      : Promise.resolve({ data: [] as { id: string; title: string; column_id: string; description: string | null }[] }),
    board
      ? supabase.from("task_checklist_items").select("id, task_id, title, done").order("position")
      : Promise.resolve({ data: [] as { id: string; task_id: string; title: string; done: boolean }[] }),
  ]);

  const checklistByTask = new Map<string, { id: string; title: string; done: boolean }[]>();
  for (const item of items ?? []) {
    const list = checklistByTask.get(item.task_id) ?? [];
    list.push({ id: item.id, title: item.title, done: item.done });
    checklistByTask.set(item.task_id, list);
  }

  const taskList: Task[] = (tasks ?? []).map((t) => ({ ...t, checklist: checklistByTask.get(t.id) ?? [] }));

  return (
    <div className="flex flex-col gap-8">
      <header>
        <h1 className="font-display text-5xl tracking-tight">Tarefas</h1>
        <p className="mt-2 text-sm text-muted-foreground">Organize o que precisa ser feito. Arraste os cards entre as colunas e marque o checklist.</p>
      </header>

      {boardError && <p className="rounded-2xl border border-destructive/40 p-4 text-sm text-destructive">Não foi possível carregar o quadro. Recarregue a página.</p>}

      <KanbanBoard
        companyId={company.id}
        boardId={board?.id ?? null}
        columns={(columns ?? []) as Column[]}
        tasks={taskList}
        canManage={canManage}
      />
    </div>
  );
}
