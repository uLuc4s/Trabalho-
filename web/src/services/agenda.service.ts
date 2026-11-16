// Consultas da agenda ao Supabase. As páginas chamam estas funções em vez de falar com o banco direto.
// Cada função devolve { data, error }, como o Supabase, para quem chama decidir o que mostrar.

import type { SupabaseClient } from "@supabase/supabase-js";
import type { AppointmentRowDTO, MonthStatusRowDTO } from "@/dto/agenda.dto";

// Busca os atendimentos de um intervalo de horário (normalmente um dia), já com cliente, serviço e profissional.
// Entrada: cliente do Supabase, início e fim do intervalo em ISO.
// Saída: lista ordenada por horário de início.
export async function getAppointmentsInRange(
  supabase: SupabaseClient,
  range: { start: string; end: string },
) {
  return supabase
    .from("appointments")
    .select("id, starts_at, ends_at, status, payment_method, amount_paid, details, services(name, price), employees(display_name), customers(name, phone)")
    .gte("starts_at", range.start) // começa depois do início do intervalo
    .lte("starts_at", range.end) // e antes do fim
    .order("starts_at")
    .returns<AppointmentRowDTO[]>();
}

// Busca só data e status dos atendimentos de um mês, para pintar o calendário.
// Entrada: cliente, primeiro instante do mês e primeiro instante do mês seguinte.
// Saída: linhas com início e status.
export async function getMonthStatuses(
  supabase: SupabaseClient,
  monthStart: string,
  monthEnd: string,
) {
  return supabase
    .from("appointments")
    .select("starts_at, status")
    .gte("starts_at", monthStart) // a partir do primeiro dia do mês
    .lt("starts_at", monthEnd) // antes do primeiro dia do mês seguinte
    .returns<MonthStatusRowDTO[]>();
}
