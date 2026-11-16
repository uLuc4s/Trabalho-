// Consulta da lista de serviços da empresa.

import type { SupabaseClient } from "@supabase/supabase-js";

// Um serviço como aparece na tela de serviços.
export type ServiceRowDTO = {
  id: string; // identificador do serviço
  name: string; // nome
  category: string | null; // categoria, ex.: "Motor"
  description: string | null; // descrição curta
  duration_minutes: number; // duração em minutos
  price: number | null; // preço; null = sob consulta
  active: boolean; // ativo aparece para o cliente
};

// Busca os serviços, ordenados por categoria e depois por nome.
// Entrada: cliente do Supabase.
// Saída: { data, error } com os serviços.
export async function getServices(supabase: SupabaseClient) {
  return supabase
    .from("services")
    .select("id, name, category, description, duration_minutes, price, active")
    .order("category", { nullsFirst: false }) // serviços sem categoria vão por último
    .order("name")
    .returns<ServiceRowDTO[]>();
}
