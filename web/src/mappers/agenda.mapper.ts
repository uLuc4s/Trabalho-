// Funções puras que transformam dados da agenda. Não acessam banco nem rede,
// então são fáceis de testar (ver agenda.mapper.test.ts ao lado).

import type {
  AppointmentRowDTO,
  DayCountDTO,
  DaySummaryDTO,
  MonthStatusRowDTO,
  Relation,
} from "@/dto/agenda.dto";

// Pega o primeiro item de uma relação que pode vir como objeto ou lista.
// Entrada: relação (objeto, lista ou null).
// Saída: o item, ou undefined se não houver nada.
export function first<T>(value: Relation<T>): T | undefined {
  return Array.isArray(value) ? value[0] : (value ?? undefined);
}

// Converte um instante em chave de dia no fuso de São Paulo, ex.: "2026-11-16".
// "en-CA" formata a data como AAAA-MM-DD.
export function dayKey(iso: string): string {
  return new Date(iso).toLocaleDateString("en-CA", { timeZone: "America/Sao_Paulo" });
}

// Conta, por dia, quantos atendimentos estão marcados e quantos foram cancelados.
// Entrada: linhas do mês (data e status).
// Saída: objeto cuja chave é o dia (AAAA-MM-DD) e o valor é a contagem.
export function buildMonthCounts(rows: MonthStatusRowDTO[]): Record<string, DayCountDTO> {
  const counts: Record<string, DayCountDTO> = {};
  for (const row of rows) {
    const key = dayKey(row.starts_at); // dia do atendimento
    counts[key] ??= { booked: 0, cancelled: 0 }; // cria a entrada do dia na primeira vez
    if (row.status === "cancelled") counts[key].cancelled += 1;
    else counts[key].booked += 1;
  }
  return counts;
}

// Resume o dia: quantos atendimentos estão ativos e quanto se espera receber.
// Entrada: linhas do dia.
// Saída: total ativo e previsto. Cancelados não entram em nenhum dos dois.
export function summarizeDay(rows: AppointmentRowDTO[]): DaySummaryDTO {
  const active = rows.filter((r) => r.status !== "cancelled");
  const expected = active.reduce((sum, r) => sum + Number(first(r.services)?.price ?? 0), 0);
  return { active: active.length, expected };
}

// Formata um valor em reais no padrão brasileiro, ex.: 150 vira "150,00".
export function formatMoney(value: number): string {
  return value.toFixed(2).replace(".", ",");
}
