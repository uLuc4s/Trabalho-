// Passo 1 do cadastro: criar a empresa (nome e endereço público).
// Se o usuário já tem vínculo ativo com uma empresa, manda para o painel.
import { redirect } from "next/navigation"; // redireciona no servidor
import { AuthShell } from "@/components/auth/auth-shell"; // moldura das telas de acesso
import { OnboardingForm } from "@/components/auth/onboarding-form"; // formulário de criar empresa
import { createClient } from "@/lib/supabase/server"; // cliente do servidor com a sessão

// Monta a página do passo 1.
export default async function OnboardingPage() {
  const supabase = await createClient();
  // Procura um vínculo ativo: se já existe, não precisa criar empresa de novo.
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
