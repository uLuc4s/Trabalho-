// Tipos da tela de clientes: o formato que chega do Supabase.
// Não contém lógica.

// Cliente da empresa, como vem da tabela customers.
export type CustomerRowDTO = {
  id: string; // identificador do cliente
  name: string; // nome
  phone: string; // telefone, só dígitos
  email: string | null; // e-mail opcional
};

// Dados de um atendimento usados para calcular o histórico de cada cliente.
export type CustomerAppointmentRowDTO = {
  customer_id: string; // cliente do atendimento
  starts_at: string; // início do atendimento
  status: string; // situação (cancelados não contam)
};

// Histórico calculado de um cliente.
export type CustomerStatsDTO = {
  total: number; // quantidade de atendimentos não cancelados
  last: string | null; // data do atendimento mais recente, ou null se nunca foi atendido
};
