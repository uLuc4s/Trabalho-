import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

type Membership = {
  role: string;
  companies: { name: string; slug: string } | { name: string; slug: string }[] | null;
};

export default async function AppHomePage() {
  const supabase = await createClient();
  const { data: membership } = await supabase
    .from("company_members")
    .select("role, companies(name, slug)")
    .eq("status", "active")
    .limit(1)
    .maybeSingle<Membership>();

  if (!membership) redirect("/onboarding");

  const company = Array.isArray(membership.companies)
    ? membership.companies[0]
    : membership.companies;

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-2 bg-background px-6">
      <p className="text-sm text-muted-foreground">Painel de {company?.name}</p>
      <h1 className="font-display text-4xl tracking-tight">Em construção</h1>
    </main>
  );
}
