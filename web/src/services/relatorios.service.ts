// Consulta do relatório mensal ao Supabase. A página chama esta função e não fala com o banco direto.

import type { SupabaseClient } from "@supabase/supabase-js";
import type { ReportRowDTO } from "@/dto/relatorios.dto";

// Busca os atendimentos do mês a partir do primeiro dia.
// Entrada: cliente do Supabase e instante de início do mês (com fuso).
// Saída: { data, error } com os atendimentos do mês.
export async function getMonthAppointments(supabase: SupabaseClient, monthStart: string) {
  return supabase
    .from("appointments")
    .select("starts_at, status, payment_method, amount_paid, services(name)")
    .gte("starts_at", monthStart)
    .returns<ReportRowDTO[]>();
}
