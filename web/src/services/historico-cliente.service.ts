// Consultas do histórico de um cliente: atendimentos, pedidos de orçamento e ordens de serviço.
// A RLS do banco garante que só aparece o que é da empresa do usuário logado.

import type { SupabaseClient } from "@supabase/supabase-js";

// Dados do cliente que aparecem no cabeçalho do histórico.
export type CustomerHeaderDTO = { id: string; name: string; phone: string; email: string | null };

// Linha de atendimento do histórico.
export type CustomerAppointmentDTO = {
  id: string;
  starts_at: string;
  status: string;
  payment_method: string | null;
  amount_paid: number | null;
  services: { name: string } | { name: string }[] | null;
};

// Linha de pedido de orçamento do histórico.
export type CustomerRequestDTO = {
  id: string;
  created_at: string;
  status: string;
  services: { name: string } | { name: string }[] | null;
};

// Linha de ordem de serviço do histórico.
export type CustomerOrderDTO = { id: string; title: string; status: string; created_at: string };

// Busca o cliente pelo id. Retorna null se não existir ou não for da empresa.
export async function getCustomerHeader(supabase: SupabaseClient, customerId: string) {
  return supabase.from("customers").select("id, name, phone, email").eq("id", customerId).maybeSingle();
}

// Busca os atendimentos do cliente, do mais recente para o mais antigo.
export async function getCustomerAppointmentsHistory(supabase: SupabaseClient, customerId: string) {
  return supabase
    .from("appointments")
    .select("id, starts_at, status, payment_method, amount_paid, services(name)")
    .eq("customer_id", customerId)
    .order("starts_at", { ascending: false })
    .limit(200);
}

// Busca os pedidos de orçamento do cliente.
export async function getCustomerRequestsHistory(supabase: SupabaseClient, customerId: string) {
  return supabase
    .from("service_requests")
    .select("id, created_at, status, services(name)")
    .eq("customer_id", customerId)
    .order("created_at", { ascending: false })
    .limit(100);
}

// Busca as ordens de serviço do cliente.
export async function getCustomerOrdersHistory(supabase: SupabaseClient, customerId: string) {
  return supabase
    .from("work_orders")
    .select("id, title, status, created_at")
    .eq("customer_id", customerId)
    .order("created_at", { ascending: false })
    .limit(100);
}
