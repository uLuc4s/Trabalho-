// Testes das regras de clientes. Rodam com: npm test (no diretório web).

import { test } from "node:test";
import assert from "node:assert/strict";
import { buildCustomerStats, filterCustomers, isInactive } from "./clientes.mapper.ts";
import type { CustomerRowDTO } from "@/dto/clientes.dto";

// Data limite fixa para os testes: 1 de novembro de 2026, 00:00 UTC.
const CUTOFF = Date.UTC(2026, 10, 1);

const ana: CustomerRowDTO = { id: "c1", name: "Ana Lima", phone: "11977771234", email: null };
const bruno: CustomerRowDTO = { id: "c2", name: "Bruno Dias", phone: "11966665555", email: null };

test("buildCustomerStats ignora cancelados e pega a data mais recente", () => {
  const stats = buildCustomerStats([
    { customer_id: "c1", starts_at: "2026-10-01T13:00:00Z", status: "completed" },
    { customer_id: "c1", starts_at: "2026-10-20T13:00:00Z", status: "confirmed" },
    { customer_id: "c1", starts_at: "2026-10-25T13:00:00Z", status: "cancelled" },
  ]);
  assert.deepEqual(stats.get("c1"), { total: 2, last: "2026-10-20T13:00:00Z" });
});

test("buildCustomerStats não cria histórico para cliente só com cancelados", () => {
  const stats = buildCustomerStats([{ customer_id: "c2", starts_at: "2026-10-01T13:00:00Z", status: "cancelled" }]);
  assert.equal(stats.has("c2"), false);
});

test("isInactive é verdadeiro para quem nunca foi atendido", () => {
  assert.equal(isInactive(undefined, CUTOFF), true);
});

test("isInactive respeita a data limite", () => {
  assert.equal(isInactive({ total: 1, last: "2026-10-15T13:00:00Z" }, CUTOFF), true); // antes do limite
  assert.equal(isInactive({ total: 1, last: "2026-11-10T13:00:00Z" }, CUTOFF), false); // depois do limite
});

test("filterCustomers busca por nome sem diferenciar maiúsculas", () => {
  const result = filterCustomers([ana, bruno], new Map(), { term: "ANA", onlyInactive: false, cutoffMs: CUTOFF });
  assert.deepEqual(result, [ana]);
});

test("filterCustomers busca por telefone ignorando formatação", () => {
  const result = filterCustomers([ana, bruno], new Map(), { term: "(11) 96666", onlyInactive: false, cutoffMs: CUTOFF });
  assert.deepEqual(result, [bruno]);
});

test("filterCustomers com filtro de sem retorno mostra só os inativos", () => {
  const stats = buildCustomerStats([{ customer_id: "c1", starts_at: "2026-11-10T13:00:00Z", status: "completed" }]);
  const result = filterCustomers([ana, bruno], stats, { term: "", onlyInactive: true, cutoffMs: CUTOFF });
  assert.deepEqual(result, [bruno]); // Ana voltou recentemente, Bruno nunca voltou
});

test("filterCustomers sem termo e sem filtro devolve todos", () => {
  const result = filterCustomers([ana, bruno], new Map(), { term: "  ", onlyInactive: false, cutoffMs: CUTOFF });
  assert.deepEqual(result, [ana, bruno]);
});
