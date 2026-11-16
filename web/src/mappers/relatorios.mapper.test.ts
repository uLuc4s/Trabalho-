// Testes das contas do relatório mensal. Rodam com: npm test (no diretório web).

import { test } from "node:test";
import assert from "node:assert/strict";
import { buildReport, formatBRL } from "./relatorios.mapper.ts";
import type { ReportRowDTO } from "@/dto/relatorios.dto";

// Monta um atendimento de teste com valores padrão.
function row(overrides: Partial<ReportRowDTO> = {}): ReportRowDTO {
  return {
    starts_at: "2026-11-10T13:00:00-03:00",
    status: "completed",
    payment_method: "pix",
    amount_paid: 100,
    services: { name: "Troca de óleo" },
    ...overrides,
  };
}

test("buildReport soma receita só dos concluídos", () => {
  const report = buildReport([
    row({ amount_paid: 100 }),
    row({ amount_paid: 50, status: "confirmed" }), // ainda não concluído, não entra na receita
  ]);
  assert.equal(report.revenue, 100);
  assert.equal(report.completedCount, 1);
});

test("buildReport conta faltas, cancelados e pendentes", () => {
  const report = buildReport([
    row({ status: "no_show" }),
    row({ status: "cancelled" }),
    row({ status: "confirmed" }),
    row({ status: "pending_confirmation" }),
  ]);
  assert.equal(report.noShows, 1);
  assert.equal(report.cancelled, 1);
  assert.equal(report.pending, 2);
});

test("buildReport agrupa receita por forma de pagamento com nome legível", () => {
  const report = buildReport([
    row({ payment_method: "pix", amount_paid: 100 }),
    row({ payment_method: "pix", amount_paid: 50 }),
    row({ payment_method: "cartao", amount_paid: 80 }),
    row({ payment_method: null, amount_paid: 999 }), // sem forma de pagamento, fica de fora
  ]);
  assert.deepEqual(report.byMethod, [
    { label: "Pix", value: 150 },
    { label: "Cartão", value: 80 },
  ]);
});

test("buildReport ordena os serviços mais feitos", () => {
  const report = buildReport([
    row({ services: { name: "Lavagem" } }),
    row({ services: { name: "Troca de óleo" } }),
    row({ services: { name: "Troca de óleo" } }),
  ]);
  assert.deepEqual(report.topServices, [
    ["Troca de óleo", 2],
    ["Lavagem", 1],
  ]);
});

test("buildReport devolve zeros para mês sem atendimentos", () => {
  const report = buildReport([]);
  assert.equal(report.revenue, 0);
  assert.deepEqual(report.byMethod, []);
  assert.deepEqual(report.topServices, []);
});

test("formatBRL usa separador de milhar e vírgula decimal", () => {
  assert.equal(formatBRL(1500), "R$ 1.500,00");
  assert.equal(formatBRL(0), "R$ 0,00");
});
