// Tipos da agenda: o formato exato que chega do Supabase e o que as telas usam.
// Não contém lógica. Qualquer mudança no formato do banco começa por aqui.

// O Supabase devolve uma relação (ex.: serviço de um atendimento) ora como objeto, ora como lista.
// Este tipo aceita as duas formas.
export type Relation<T> = T | T[] | null;

// Uma linha da consulta de atendimentos do dia, com as relações já trazidas.
export type AppointmentRowDTO = {
  id: string; // identificador do atendimento
  starts_at: string; // início, em ISO com fuso
  ends_at: string; // fim, em ISO com fuso
  status: string; // pending_confirmation, confirmed, completed, cancelled ou no_show
  payment_method: string | null; // pix, cartao ou dinheiro; null enquanto não foi pago
  amount_paid: number | null; // valor recebido no fechamento
  details: { placa?: string; veiculo?: string; ano?: string; area?: string } | null; // dados do segmento (veículo, área do caso)
  services: Relation<{ name: string; price: number | null }>; // serviço e preço de tabela
  employees: Relation<{ display_name: string }>; // profissional
  customers: Relation<{ name: string; phone: string }>; // cliente
};

// Linha mínima usada para montar o calendário do mês (só dia e status).
export type MonthStatusRowDTO = {
  starts_at: string; // início do atendimento
  status: string; // situação, para separar marcados e cancelados
};

// Contagem de um dia no calendário.
export type DayCountDTO = {
  booked: number; // atendimentos que não foram cancelados
  cancelled: number; // atendimentos cancelados
};

// Resumo do dia mostrado no topo da lista.
export type DaySummaryDTO = {
  active: number; // quantos atendimentos não estão cancelados
  expected: number; // soma dos preços dos atendimentos não cancelados, em reais
};
