// Página de tarefas: quadro Kanban com colunas, tarefas e checklist.
// As consultas ficam em services e a junção de checklist em mappers.

import { KanbanBoard, type Column } from "@/components/app/kanban-board";
import { getCurrentCompany } from "@/lib/company";
import { getBoardContent, getFirstBoard } from "@/services/tarefas.service";
import { attachChecklist } from "@/mappers/tarefas.mapper";

// Entrada: nada além da sessão do usuário.
// Saída: quadro com as colunas e as tarefas da empresa.
export default async function TarefasPage() {
  const { supabase, company, role } = await getCurrentCompany();
  const canManage = role === "owner" || role === "admin"; // só dono e admin criam quadro

  const { data: board, error: boardError } = await getFirstBoard(supabase);

  // Sem quadro, não há colunas nem tarefas para buscar.
  const content = board ? await getBoardContent(supabase, board.id) : null;
  const columns = (content?.columns.data ?? []) as Column[];
  const taskList = attachChecklist(content?.tasks.data ?? [], content?.items.data ?? []);

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
        columns={columns}
        tasks={taskList}
        canManage={canManage}
      />
    </div>
  );
}
