import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type Company = { id: string; name: string; slug: string; timezone: string };
export type Role = "owner" | "admin" | "member" | "viewer";

export async function getCurrentCompany() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("company_members")
    .select("role, companies(id, name, slug, timezone)")
    .eq("status", "active")
    .limit(1)
    .maybeSingle();

  if (!data) redirect("/onboarding");

  const raw = data.companies as Company | Company[] | null;
  const company = Array.isArray(raw) ? raw[0] : raw;
  if (!company) redirect("/onboarding");

  return { supabase, company, role: data.role as Role };
}

export function dayRange(date: string) {
  return {
    start: `${date}T00:00:00-03:00`,
    end: `${date}T23:59:59-03:00`,
  };
}

export function todayInSaoPaulo() {
  return new Date().toLocaleDateString("en-CA", { timeZone: "America/Sao_Paulo" });
}

export function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "America/Sao_Paulo",
  });
}

export function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "America/Sao_Paulo",
  });
}
