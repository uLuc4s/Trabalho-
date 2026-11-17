// Consultas do cadastro (onboarding): vínculo do usuário e serviços já cadastrados da empresa.
// A RLS do banco garante que cada consulta só enxerga o que é do usuário logado.

import type { SupabaseClient } from "@supabase/supabase-js";

// Procura um vínculo ativo do usuário com alguma empresa.
// Saída: { data, error } com o id do vínculo, ou null se não existir.
export async function getActiveMembership(supabase: SupabaseClient) {
  return supabase.from("company_members").select("id").eq("status", "active").limit(1).maybeSingle();
}

// Conta os serviços da empresa (usado para não criar exemplos duplicados).
// Saída: { count, error }.
export async function countCompanyServices(supabase: SupabaseClient, companyId: string) {
  return supabase.from("services").select("id", { count: "exact", head: true }).eq("company_id", companyId);
}
