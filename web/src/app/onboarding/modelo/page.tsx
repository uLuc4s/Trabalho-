// Passo 2 do cadastro: escolher como a empresa atende (modelo e ramo).
// Se a empresa já tem modelo, manda direto para o painel.
import { redirect } from "next/navigation"; // redireciona no servidor
import { ModelPicker } from "@/components/onboarding/model-picker"; // seletor de modelo e ramo
import { getCurrentCompany } from "@/lib/company"; // empresa e papel do usuário logado
import { countCompanyServices } from "@/services/cadastro.service";

// Monta a página do passo 2.
// Depende da requisição (banco e sessão): bloqueia no servidor em vez de pré-renderizar.
export const instant = false;

export default async function ModeloPage() {
  const { supabase, company } = await getCurrentCompany();
  // Já escolheu: não precisa estar aqui.
  if (company.business_model) redirect("/app");

  // Conta os serviços da empresa. Se já houver, o seletor não cria exemplos.
  const { count } = await countCompanyServices(supabase, company.id);

  return (
    <main className="min-h-screen bg-background px-6 py-16 md:px-12">
      <div className="mx-auto flex max-w-4xl flex-col gap-10">
        <header className="flex flex-col gap-3">
          <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Passo 2 de 2</p>
          <h1 className="font-display text-5xl tracking-tight md:text-6xl">Como você atende?</h1>
          <p className="max-w-xl text-sm text-muted-foreground">
            A gente monta o painel e alguns serviços de exemplo de acordo com a sua rotina.
          </p>
        </header>
        <ModelPicker companyId={company.id} hasServices={(count ?? 0) > 0} />
      </div>
    </main>
  );
}
