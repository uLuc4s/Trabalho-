import { redirect } from "next/navigation";
import { ModelPicker } from "@/components/onboarding/model-picker";
import { getCurrentCompany } from "@/lib/company";

export default async function ModeloPage() {
  const { supabase, company } = await getCurrentCompany();
  if (company.business_model) redirect("/app");

  const { count } = await supabase
    .from("services")
    .select("id", { count: "exact", head: true })
    .eq("company_id", company.id);

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
