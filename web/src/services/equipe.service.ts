// Consultas da tela de equipe: profissionais, acessos, convites, serviços e horários.
// A página chama estas funções; as regras de permissão continuam no banco (RLS e funções).

import type { SupabaseClient } from "@supabase/supabase-js";

// Carrega tudo o que a tela de equipe precisa, em paralelo.
// Entrada: cliente do Supabase e id da empresa.
// Saída: profissionais, acessos, convites, serviços, ligações, horários e nomes dos membros.
export async function getEquipeData(supabase: SupabaseClient, companyId: string) {
  const [employees, members, invites, services, links, hours, names] = await Promise.all([
    supabase.from("employees").select("id, display_name, active").order("display_name"),
    supabase.from("company_members").select("id, role, status").order("created_at"),
    supabase
      .from("invitations")
      .select("id, email, role, expires_at, accepted_at")
      .is("accepted_at", null)
      .gt("expires_at", new Date().toISOString())
      .order("expires_at"),
    supabase.from("services").select("id, name").eq("active", true).order("name"),
    supabase.from("employee_services").select("employee_id, service_id"),
    supabase.from("working_hours").select("id, employee_id, weekday, start_time, end_time").order("weekday"),
    // Nomes pela função do banco: a leitura direta de perfis só traz o próprio.
    supabase.rpc("app_company_member_names", { p_company: companyId }),
  ]);
  return {
    employees: employees.data,
    members: members.data,
    invites: invites.data,
    services: services.data,
    links: links.data,
    hours: hours.data,
    nameRows: (names.data ?? []) as { member_id: string; full_name: string }[],
  };
}
