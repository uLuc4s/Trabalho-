// Contas do relatório mensal: receita, faltas, cancelados, formas de pagamento e serviços mais feitos.
// Funções puras, sem acesso a banco.

import type { ReportRowDTO, ReportSummaryDTO } from "@/dto/relatorios.dto";
import { first } from "./agenda.mapper.ts"; // import relativo: o runner de testes do Node não lê o alias @/

// Tradução das formas de pagamento para o texto da tela.
export const PAYMENT_LABEL: Record<string, string> = { pix: "Pix", cartao: "Cartão", dinheiro: "Dinheiro" };

// Monta o resumo do mês a partir dos atendimentos.
// Entrada: atendimentos do mês.
// Saída: resumo com os totais e os rankings prontos para a tela.
export function buildReport(rows: ReportRowDTO[]): ReportSummaryDTO {
  const completed = rows.filter((r) => r.status === "completed"); // só concluídos entram na receita
  const revenue = completed.reduce((sum, r) => sum + Number(r.amount_paid ?? 0), 0);
  const noShows = rows.filter((r) => r.status === "no_show").length;
  const cancelled = rows.filter((r) => r.status === "cancelled").length;
  // Ainda sem fechamento: confirmados ou aguardando confirmação.
  const pending = rows.filter((r) => r.status === "confirmed" || r.status === "pending_confirmation").length;

  // Receita somada por forma de pagamento. Pagamento sem forma definida é ignorado.
  const byMethod = new Map<string, number>();
  for (const r of completed) {
    if (!r.payment_method) continue;
    byMethod.set(r.payment_method, (byMethod.get(r.payment_method) ?? 0) + Number(r.amount_paid ?? 0));
  }
  const methodData = [...byMethod.entries()].map(([k, v]) => ({
    label: PAYMENT_LABEL[k] ?? k, // nome legível, ou o código se não houver tradução
    value: Math.round(v), // arredonda para o gráfico
  }));

  // Quantas vezes cada serviço foi concluído.
  const byService = new Map<string, number>();
  for (const r of completed) {
    const name = first(r.services)?.name ?? "Sem nome";
    byService.set(name, (byService.get(name) ?? 0) + 1);
  }
  // Ordena do mais feito para o menos feito e pega os 5 primeiros.
  const topServices = [...byService.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5);

  return {
    revenue,
    completedCount: completed.length,
    noShows,
    cancelled,
    pending,
    byMethod: methodData,
    topServices,
  };
}

// Formata um valor em reais no padrão brasileiro, ex.: 1500 vira "R$ 1.500,00".
export function formatBRL(value: number): string {
  return `R$ ${value.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}
