// Testes das funções puras da agenda. Rodam com: npm test (no diretório web).
// Usam o test runner nativo do Node, sem instalar nada.

import { test } from "node:test";
import assert from "node:assert/strict";
import { buildMonthCounts, dayKey, first, formatMoney, summarizeDay } from "./agenda.mapper.ts";
import type { AppointmentRowDTO } from "@/dto/agenda.dto";

// Monta uma linha de atendimento de teste, com valores padrão que cada teste pode trocar.
function row(overrides: Partial<AppointmentRowDTO> = {}): AppointmentRowDTO {
  return {
    id: "a1",
    starts_at: "2026-11-16T13:00:00-03:00", // 16/11 às 13h em São Paulo
    ends_at: "2026-11-16T14:00:00-03:00",
    status: "confirmed",
    payment_method: null,
    amount_paid: null,
    details: null,
    services: { name: "Corte", price: 50 },
    employees: { display_name: "Carlos" },
    customers: { name: "Ana", phone: "11977771234" },
    ...overrides,
  };
}

test("first devolve o primeiro item de uma lista", () => {
  assert.deepEqual(first([{ n: 1 }, { n: 2 }]), { n: 1 });
});

test("first devolve o próprio objeto quando a relação não é lista", () => {
  assert.deepEqual(first({ n: 1 }), { n: 1 });
});

test("first devolve undefined para null", () => {
  assert.equal(first(null), undefined);
});

test("dayKey usa o fuso de São Paulo, não UTC", () => {
  // 02:00 UTC do dia 17 ainda é dia 16 em São Paulo (UTC-3).
  assert.equal(dayKey("2026-11-17T02:00:00Z"), "2026-11-16");
});

test("buildMonthCounts separa marcados e cancelados por dia", () => {
  const counts = buildMonthCounts([
    { starts_at: "2026-11-16T13:00:00-03:00", status: "confirmed" },
    { starts_at: "2026-11-16T15:00:00-03:00", status: "cancelled" },
    { starts_at: "2026-11-16T16:00:00-03:00", status: "completed" },
  ]);
  assert.deepEqual(counts["2026-11-16"], { booked: 2, cancelled: 1 });
});

test("buildMonthCounts devolve vazio sem linhas", () => {
  assert.deepEqual(buildMonthCounts([]), {});
});

test("summarizeDay não conta cancelados nem no total ativo nem no previsto", () => {
  const summary = summarizeDay([
    row({ id: "1", services: { name: "Corte", price: 50 } }),
    row({ id: "2", status: "cancelled", services: { name: "Barba", price: 30 } }),
    row({ id: "3", services: [{ name: "Pintura", price: 100 }] }), // relação em lista também conta
  ]);
  assert.deepEqual(summary, { active: 2, expected: 150 });
});

test("summarizeDay trata serviço sem preço como zero", () => {
  const summary = summarizeDay([row({ services: { name: "Sob consulta", price: null } })]);
  assert.deepEqual(summary, { active: 1, expected: 0 });
});

test("formatMoney usa vírgula decimal", () => {
  assert.equal(formatMoney(150), "150,00");
  assert.equal(formatMoney(9.5), "9,50");
});
