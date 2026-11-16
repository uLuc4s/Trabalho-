// Consulta das solicitações de orçamento ou visita feitas pelos clientes.

import type { SupabaseClient } from "@supabase/supabase-js";

// Uma solicitação, com serviço e cliente já trazidos.
export type ServiceRequestRowDTO = {
  id: string; // identificador da solicitação
  status: string; // new, under_review, approved ou rejected
  created_at: string; // quando o cliente enviou
  preferred_window: string | null; // preferência de dia e horário informada pelo cliente
  notes: string | null; // observação do cliente
  services: { name: string } | { name: string }[] | null; // serviço pedido
  customers: { name: string; phone: string } | { name: string; phone: string }[] | null; // cliente
};

// Busca as 50 solicitações mais recentes.
// Entrada: cliente do Supabase.
// Saída: { data, error } com as solicitações.
export async function getServiceRequests(supabase: SupabaseClient) {
  return supabase
    .from("service_requests")
    .select("id, status, created_at, preferred_window, notes, services(name), customers(name, phone)")
    .order("created_at", { ascending: false })
    .limit(50)
    .returns<ServiceRequestRowDTO[]>();
}
