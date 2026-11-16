// Tipos dos relatórios mensais: o formato que chega do Supabase e o resumo calculado.
// Não contém lógica.

// Atendimento do mês usado nas contas do relatório.
export type ReportRowDTO = {
  starts_at: string; // início do atendimento
  status: string; // situação do atendimento
  payment_method: string | null; // forma de pagamento, se foi pago
  amount_paid: number | null; // valor recebido
  services: { name: string } | { name: string }[] | null; // serviço (objeto ou lista)
};

// Resumo calculado do mês, pronto para a tela.
export type ReportSummaryDTO = {
  revenue: number; // soma do que foi recebido em atendimentos concluídos
  completedCount: number; // quantidade de atendimentos concluídos
  noShows: number; // quantidade de faltas
  cancelled: number; // quantidade de cancelados
  pending: number; // quantidade ainda aguardando fechamento
  byMethod: { label: string; value: number }[]; // receita por forma de pagamento
  topServices: [string, number][]; // nome do serviço e quantas vezes foi feito (até 5)
};
