// Testes da junção de tarefas com checklist. Rodam com: npm test (no diretório web).

import { test } from "node:test";
import assert from "node:assert/strict";
import { attachChecklist } from "./tarefas.mapper.ts";

test("attachChecklist põe cada item na sua tarefa", () => {
  const tasks = [
    { id: "t1", title: "Levar escada", column_id: "c1", description: null },
    { id: "t2", title: "Trocar pneu", column_id: "c1", description: null },
  ];
  const items = [
    { id: "i1", task_id: "t1", title: "Checar cinta", done: true },
    { id: "i2", task_id: "t1", title: "Avisar cliente", done: false },
  ];
  const result = attachChecklist(tasks, items);
  assert.equal(result[0].checklist.length, 2);
  assert.equal(result[1].checklist.length, 0); // tarefa sem itens recebe lista vazia
});

test("attachChecklist mantém a ordem das tarefas", () => {
  const tasks = [
    { id: "t2", title: "B", column_id: "c1", description: null },
    { id: "t1", title: "A", column_id: "c1", description: null },
  ];
  const result = attachChecklist(tasks, []);
  assert.deepEqual(
    result.map((t) => t.id),
    ["t2", "t1"],
  );
});
