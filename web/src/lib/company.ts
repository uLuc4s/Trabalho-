// Funções compartilhadas pelo painel: quem é a empresa logada, datas e formatação.
// Usado por quase todas as páginas em web/src/app/app.

import { redirect } from "next/navigation"; // redireciona o usuário para outra rota no servidor
import { createClient } from "@/lib/supabase/server"; // cliente do Supabase que lê o cookie de sessão

// Modelos de negócio aceitos. Vêm da coluna companies.business_model (check no banco).
export type BusinessModel = "balcao" | "campo" | "orcamento" | "recorrente";

// Formato da empresa que o painel usa. Só os campos que as telas precisam.
export type Company = {
  id: string; // identificador da empresa (uuid)
  name: string; // nome exibido no painel
  slug: string; // parte da URL pública, ex.: /e/oficina-norte
  timezone: string; // fuso horário da empresa, padrão América/São Paulo
  business_model: BusinessModel | null; // null = ainda não escolheu o modelo
  segment: string | null; // ramo do negócio (barbearia, oficina...)
};

// Papel do usuário dentro da empresa. Define o que ele pode alterar.
export type Role = "owner" | "admin" | "member" | "viewer";

// Descobre a empresa do usuário logado.
// Entrada: nada (usa o cookie da sessão).
// Saída: o cliente do Supabase, a empresa e o papel do usuário.
// Se não houver vínculo ativo, manda o usuário para o onboarding.
export async function getCurrentCompany() {
  const supabase = await createClient(); // cria o cliente já com a sessão do usuário

  // Busca o primeiro vínculo ativo do usuário e já traz os dados da empresa.
  // A RLS do banco garante que o usuário só enxerga os próprios vínculos.
  const { data } = await supabase
    .from("company_members")
    .select("role, companies(id, name, slug, timezone, business_model, segment)")
    .eq("status", "active")
    .limit(1)
    .maybeSingle();

  // Sem vínculo ativo: o usuário ainda não tem empresa, então vai criar uma.
  if (!data) redirect("/onboarding");

  // O Supabase pode devolver a relação como objeto ou como lista. Aqui normalizamos para objeto.
  const raw = data.companies as Company | Company[] | null;
  const company = Array.isArray(raw) ? raw[0] : raw;
  if (!company) redirect("/onboarding"); // relação vazia: trata como sem empresa

  // Devolve o cliente, a empresa e o papel. Quem chama usa isso para filtrar e permitir ações.
  return { supabase, company, role: data.role as Role };
}

// Monta o intervalo de um dia inteiro no fuso de São Paulo.
// Entrada: data no formato AAAA-MM-DD.
// Saída: início e fim do dia, com o deslocamento -03:00.
export function dayRange(date: string) {
  return {
    start: `${date}T00:00:00-03:00`, // primeiro instante do dia
    end: `${date}T23:59:59-03:00`, // último instante do dia
  };
}

// Retorna a data de hoje em São Paulo, no formato AAAA-MM-DD.
// "en-CA" é usado porque esse idioma formata a data nesse padrão.
export function todayInSaoPaulo() {
  return new Date().toLocaleDateString("en-CA", { timeZone: "America/Sao_Paulo" });
}

// Converte um instante ISO em horário, ex.: "14:30".
export function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString("pt-BR", {
    hour: "2-digit", // hora com dois dígitos
    minute: "2-digit", // minuto com dois dígitos
    timeZone: "America/Sao_Paulo", // mostra no horário de São Paulo
  });
}

// Converte um instante ISO em data e hora, ex.: "16/11, 14:30".
export function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString("pt-BR", {
    day: "2-digit", // dia
    month: "2-digit", // mês
    hour: "2-digit", // hora
    minute: "2-digit", // minuto
    timeZone: "America/Sao_Paulo", // horário de São Paulo
  });
}

// Retorna o instante de N dias atrás, em milissegundos.
// Usado para filtrar clientes sem retorno (ex.: 30 dias).
export function daysAgoMs(days: number) {
  return Date.now() - days * 86400000; // 86400000 = milissegundos em 1 dia
}
