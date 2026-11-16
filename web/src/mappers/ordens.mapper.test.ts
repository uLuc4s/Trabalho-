// Testes das regras de ordens de serviço. Rodam com: npm test (no diretório web).

import { test } from "node:test";
import assert from "node:assert/strict";
import { buildVehicleByOrder, describeEvent, groupEventsByOrder } from "./ordens.mapper.ts";
import type { WorkOrderEventDTO } from "@/dto/ordens.dto";

test("groupEventsByOrder separa os eventos de cada ordem", () => {
  const events: WorkOrderEventDTO[] = [
    { work_order_id: "o1", event_type: "created", payload: {}, created_at: "2026-11-16T10:00:00Z" },
    { work_order_id: "o2", event_type: "created", payload: {}, created_at: "2026-11-16T11:00:00Z" },
    { work_order_id: "o1", event_type: "status_changed", payload: { from: "open", to: "scheduled" }, created_at: "2026-11-16T12:00:00Z" },
  ];
  const grouped = groupEventsByOrder(events);
  assert.equal(grouped.get("o1")?.length, 2);
  assert.equal(grouped.get("o2")?.length, 1);
});

test("buildVehicleByOrder ignora atendimento sem placa", () => {
  const vehicles = buildVehicleByOrder([
    { work_order_id: "o1", details: { placa: "ABC1D23", veiculo: "Gol", ano: "2015" } },
    { work_order_id: "o2", details: null },
    { work_order_id: "o3", details: { veiculo: "Uno" } }, // sem placa
  ]);
  assert.deepEqual(vehicles.get("o1"), { placa: "ABC1D23", veiculo: "Gol", ano: "2015" });
  assert.equal(vehicles.has("o2"), false);
  assert.equal(vehicles.has("o3"), false);
});

test("describeEvent traduz a criação", () => {
  const text = describeEvent({ work_order_id: "o1", event_type: "created", payload: {}, created_at: "2026-11-16T10:00:00Z" });
  assert.equal(text, "Ordem criada");
});

test("describeEvent traduz a mudança de status para o texto da tela", () => {
  const text = describeEvent({
    work_order_id: "o1",
    event_type: "status_changed",
    payload: { from: "open", to: "in_progress" },
    created_at: "2026-11-16T10:00:00Z",
  });
  assert.equal(text, "Aberta → Em execução");
});
