// Consultas da visão geral do painel. As datas chegam prontas da página.
// A RLS garante que só entram dados da empresa do usuário.

import type { SupabaseClient } from "@supabase/supabase-js";

// Entrada: cliente do Supabase e janelas de tempo (hoje, mês, 14 dias atrás, 7 à frente, 30 dias atrás).
// Saída: os oito resultados, na mesma ordem que a página usa.
export async function getHomeData(
  supabase: SupabaseClient,
  w: { day: { start: string; end: string }; from: string; to: string; monthStart: string; now: string; thirtyDaysAgo: string },
) {
  const { day, from, to, monthStart, thirtyDaysAgo } = w;
  return Promise.all([

      // Atendimentos de hoje, sem contar cancelados. Só a contagem, sem trazer as linhas.
      supabase.from("appointments").select("id", { count: "exact", head: true }).gte("starts_at", day.start).lte("starts_at", day.end).neq("status", "cancelled"),
      // Solicitações ainda sem resposta (contagem).
      supabase.from("service_requests").select("id", { count: "exact", head: true }).in("status", ["new", "under_review"]),
      // Status de todas as ordens, para o gráfico de rosca.
      supabase.from("work_orders").select("status"),
      // Atendimentos da janela do gráfico (14 dias atrás até 7 à frente).
      supabase.from("appointments").select("starts_at, status, services(price, name), customers(name)").gte("starts_at", from).lte("starts_at", to).neq("status", "cancelled"),
      // Atendimentos do mês, para a receita prevista.
      supabase.from("appointments").select("starts_at, services(price)").gte("starts_at", monthStart).neq("status", "cancelled"),
      // Próximos 6 atendimentos a partir de agora.
      supabase.from("appointments").select("id, starts_at, services(name), customers(name)").gte("starts_at", w.now).neq("status", "cancelled").order("starts_at").limit(6),
      // Total de clientes cadastrados (contagem).
      supabase.from("customers").select("id", { count: "exact", head: true }),
      // Clientes com atendimento nos últimos 30 dias, para achar quem sumiu.
      supabase.from("appointments").select("customer_id").gte("starts_at", thirtyDaysAgo).neq("status", "cancelled"),

  ]);
}
