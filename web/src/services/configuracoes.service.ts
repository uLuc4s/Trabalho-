// Consulta das configurações da empresa.

import type { SupabaseClient } from "@supabase/supabase-js";

// Campos da empresa que aparecem na tela de configurações.
export type CompanySettingsRowDTO = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  address: string | null;
  phone: string | null;
  payment_methods: string[] | null; // formas de pagamento aceitas
  cancellation_hours: number; // antecedência mínima para cancelar ou remarcar
};

// Busca os dados de configuração da empresa.
// Entrada: cliente do Supabase e id da empresa.
// Saída: { data, error } com a empresa. Retorna um único registro.
export async function getCompanySettings(supabase: SupabaseClient, companyId: string) {
  return supabase
    .from("companies")
    .select("id, name, slug, description, address, phone, payment_methods, cancellation_hours")
    .eq("id", companyId)
    .single()
    .returns<CompanySettingsRowDTO>();
}
