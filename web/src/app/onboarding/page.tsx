import { redirect } from "next/navigation";
import { AuthShell } from "@/components/auth/auth-shell";
import { OnboardingForm } from "@/components/auth/onboarding-form";
import { createClient } from "@/lib/supabase/server";

export default async function OnboardingPage() {
  const supabase = await createClient();
  const { data: membership } = await supabase
    .from("company_members")
    .select("id")
    .eq("status", "active")
    .limit(1)
    .maybeSingle();

  if (membership) redirect("/app");

  return (
    <AuthShell title="Sua empresa" description="Cadastre os dados que os seus clientes vão ver na página de agendamento.">
      <OnboardingForm />
    </AuthShell>
  );
}
