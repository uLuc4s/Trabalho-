// Regras da tela de ordens: agrupa histórico e veículo por ordem, e traduz os status.
// Funções puras, sem acesso a banco.

import type { LinkedAppointmentRowDTO, VehicleDTO, WorkOrderEventDTO } from "@/dto/ordens.dto";

// Tradução dos status de ordem para o texto da tela.
export const STATUS_LABEL: Record<string, string> = {
  open: "Aberta",
  scheduled: "Programada",
  in_progress: "Em execução",
  completed: "Concluída",
  cancelled: "Cancelada",
};

// Agrupa os eventos por ordem, para que cada card receba só o próprio histórico.
// Entrada: lista de eventos de várias ordens.
// Saída: mapa de id da ordem para a lista de eventos dela.
export function groupEventsByOrder(events: WorkOrderEventDTO[]): Map<string, WorkOrderEventDTO[]> {
  const byOrder = new Map<string, WorkOrderEventDTO[]>();
  for (const e of events) {
    const list = byOrder.get(e.work_order_id) ?? []; // lista atual da ordem, ou vazia
    list.push(e);
    byOrder.set(e.work_order_id, list);
  }
  return byOrder;
}

// Associa o veículo a cada ordem. Só entram atendimentos que têm placa preenchida.
// Entrada: atendimentos vinculados a ordens.
// Saída: mapa de id da ordem para os dados do veículo.
export function buildVehicleByOrder(rows: LinkedAppointmentRowDTO[]): Map<string, VehicleDTO> {
  const byOrder = new Map<string, VehicleDTO>();
  for (const a of rows) {
    if (a.details?.placa) byOrder.set(a.work_order_id, a.details); // sem placa, não há veículo para mostrar
  }
  return byOrder;
}

// Escreve uma linha do histórico em texto.
// Entrada: um evento.
// Saída: "Ordem criada" ou "Aberta → Programada", conforme o tipo do evento.
export function describeEvent(event: WorkOrderEventDTO): string {
  if (event.event_type === "created") return "Ordem criada";
  // Sem status anterior ou novo, mostra um traço em vez de "undefined".
  const from = STATUS_LABEL[event.payload.from ?? ""] ?? event.payload.from ?? "—";
  const to = STATUS_LABEL[event.payload.to ?? ""] ?? event.payload.to ?? "—";
  return `${from} → ${to}`;
}
