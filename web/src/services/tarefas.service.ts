// Consultas do quadro de tarefas (Kanban) ao Supabase.

import type { SupabaseClient } from "@supabase/supabase-js";

// Coluna do quadro, ex.: "A fazer".
export type TaskColumnRowDTO = { id: string; name: string; position: number };

// Tarefa do quadro, ainda sem o checklist.
export type TaskRowDTO = { id: string; title: string; column_id: string; description: string | null };

// Item do checklist de uma tarefa.
export type ChecklistRowDTO = { id: string; task_id: string; title: string; done: boolean };

// Busca o primeiro quadro da empresa.
// Entrada: cliente do Supabase.
// Saída: { data, error } com o id do quadro, ou null se não existir.
export async function getFirstBoard(supabase: SupabaseClient) {
  return supabase.from("task_boards").select("id").order("created_at").limit(1).maybeSingle();
}

// Busca colunas, tarefas e checklist de um quadro, em paralelo.
// Entrada: cliente do Supabase e id do quadro.
// Saída: colunas, tarefas e itens de checklist, cada um com seu próprio erro.
export async function getBoardContent(supabase: SupabaseClient, boardId: string) {
  const [columns, tasks, items] = await Promise.all([
    supabase.from("task_columns").select("id, name, position").eq("board_id", boardId).order("position").returns<TaskColumnRowDTO[]>(),
    supabase.from("tasks").select("id, title, column_id, description").eq("board_id", boardId).order("position").returns<TaskRowDTO[]>(),
    supabase.from("task_checklist_items").select("id, task_id, title, done").order("position").returns<ChecklistRowDTO[]>(),
  ]);
  return { columns, tasks, items };
}
