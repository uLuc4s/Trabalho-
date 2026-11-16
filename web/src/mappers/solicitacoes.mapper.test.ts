// Testes da separação de solicitações. Rodam com: npm test (no diretório web).

import { test } from "node:test";
import assert from "node:assert/strict";
import { splitRequests } from "./solicitacoes.mapper.ts";
import type { ServiceRequestRowDTO } from "../services/solicitacoes.service.ts";

// Monta uma solicitação de teste com o status informado.
function req(id: string, status: string): ServiceRequestRowDTO {
  return {
    id,
    status,
    created_at: "2026-11-16T10:00:00Z",
    preferred_window: null,
    notes: null,
    services: { name: "Orçamento" },
    customers: { name: "Ana", phone: "11977771234" },
  };
}

test("splitRequests põe new e under_review em aberto", () => {
  const { open, decided } = splitRequests([req("1", "new"), req("2", "under_review")]);
  assert.equal(open.length, 2);
  assert.equal(decided.length, 0);
});

test("splitRequests põe aprovadas e recusadas em decididas", () => {
  const { open, decided } = splitRequests([req("1", "approved"), req("2", "rejected")]);
  assert.equal(open.length, 0);
  assert.equal(decided.length, 2);
});

test("splitRequests devolve listas vazias sem solicitações", () => {
  assert.deepEqual(splitRequests([]), { open: [], decided: [] });
});
