// Junta tarefas e checklist: cada tarefa recebe os próprios itens.
// Função pura, sem acesso a banco.

import type { ChecklistRowDTO, TaskRowDTO } from "@/services/tarefas.service";

// Uma tarefa já com a lista de itens do checklist.
export type TaskWithChecklist = TaskRowDTO & {
  checklist: { id: string; title: string; done: boolean }[];
};

// Entrada: tarefas e itens de checklist de todo o quadro.
// Saída: tarefas com o checklist de cada uma. Tarefa sem itens recebe lista vazia.
export function attachChecklist(tasks: TaskRowDTO[], items: ChecklistRowDTO[]): TaskWithChecklist[] {
  // Agrupa os itens pelo id da tarefa.
  const byTask = new Map<string, { id: string; title: string; done: boolean }[]>();
  for (const item of items) {
    const list = byTask.get(item.task_id) ?? []; // lista atual da tarefa, ou vazia
    list.push({ id: item.id, title: item.title, done: item.done });
    byTask.set(item.task_id, list);
  }
  return tasks.map((t) => ({ ...t, checklist: byTask.get(t.id) ?? [] }));
}
