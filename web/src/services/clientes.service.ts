// Consultas de clientes ao Supabase. A página chama estas funções e não fala com o banco direto.

import type { SupabaseClient } from "@supabase/supabase-js";
import type { CustomerAppointmentRowDTO, CustomerRowDTO } from "@/dto/clientes.dto";

// Busca todos os clientes da empresa, em ordem alfabética.
// Entrada: cliente do Supabase.
// Saída: { data, error } com a lista de clientes.
export async function getCustomers(supabase: SupabaseClient) {
  return supabase
    .from("customers")
    .select("id, name, phone, email")
    .order("name")
    .returns<CustomerRowDTO[]>();
}

// Busca data e status de todos os atendimentos, para calcular o histórico de cada cliente.
// Entrada: cliente do Supabase.
// Saída: { data, error } com as linhas de atendimento.
export async function getCustomerAppointments(supabase: SupabaseClient) {
  return supabase
    .from("appointments")
    .select("customer_id, starts_at, status")
    .returns<CustomerAppointmentRowDTO[]>();
}
