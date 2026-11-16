// Consultas de ordens de serviço ao Supabase. A página chama estas funções e não fala com o banco direto.

import type { SupabaseClient } from "@supabase/supabase-js";
import type { LinkedAppointmentRowDTO, WorkOrderEventDTO, WorkOrderRowDTO } from "@/dto/ordens.dto";

// Busca as 60 ordens mais recentes da empresa.
// Entrada: cliente do Supabase.
// Saída: { data, error } com as ordens.
export async function getWorkOrders(supabase: SupabaseClient) {
  return supabase
    .from("work_orders")
    .select("id, title, status, created_at, customers(name)")
    .order("created_at", { ascending: false })
    .limit(60)
    .returns<WorkOrderRowDTO[]>();
}

// Busca os 300 eventos de histórico mais recentes, de todas as ordens.
// Entrada: cliente do Supabase.
// Saída: { data, error } com os eventos.
export async function getWorkOrderEvents(supabase: SupabaseClient) {
  return supabase
    .from("work_order_events")
    .select("work_order_id, event_type, payload, created_at")
    .order("created_at", { ascending: false })
    .limit(300)
    .returns<WorkOrderEventDTO[]>();
}

// Busca os atendimentos que estão vinculados a uma ordem (ou seja, têm work_order_id preenchido).
// Entrada: cliente do Supabase.
// Saída: { data, error } com o veículo de cada atendimento vinculado.
export async function getLinkedAppointments(supabase: SupabaseClient) {
  return supabase
    .from("appointments")
    .select("work_order_id, details")
    .not("work_order_id", "is", null)
    .returns<LinkedAppointmentRowDTO[]>();
}
