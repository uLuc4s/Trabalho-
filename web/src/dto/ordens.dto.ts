// Tipos da tela de ordens de serviço: o formato que chega do Supabase.
// Não contém lógica.

// Ordem de serviço com o nome do cliente.
export type WorkOrderRowDTO = {
  id: string; // identificador da ordem
  title: string; // título da ordem
  status: string; // open, scheduled, in_progress, completed ou cancelled
  created_at: string; // data de abertura
  customers: { name: string } | { name: string }[] | null; // cliente (objeto ou lista, dependendo da consulta)
};

// Evento de histórico de uma ordem (mudança de status).
export type WorkOrderEventDTO = {
  work_order_id: string; // ordem a que o evento pertence
  event_type: string; // "created" ou "status_changed"
  payload: { from?: string; to?: string }; // status anterior e novo
  created_at: string; // quando aconteceu
};

// Dados do veículo de um atendimento vinculado à ordem.
export type VehicleDTO = {
  placa?: string; // placa
  veiculo?: string; // modelo
  ano?: string; // ano
};

// Linha de atendimento vinculado a uma ordem.
export type LinkedAppointmentRowDTO = {
  work_order_id: string; // ordem vinculada
  details: VehicleDTO | null; // dados do veículo, se houver
};
