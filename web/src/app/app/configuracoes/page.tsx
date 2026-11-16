import { CompanySettingsForm } from "@/components/app/company-settings-form";
import { getCurrentCompany } from "@/lib/company";

export default async function ConfiguracoesPage() {
  const { supabase, company, role } = await getCurrentCompany();
  const canEdit = role === "owner" || role === "admin";

  const { data } = await supabase
    .from("companies")
    .select("id, name, slug, description, address, phone, payment_methods, cancellation_hours")
    .eq("id", company.id)
    .single();

  if (!data) return null;

  return (
    <div className="flex flex-col gap-10">
      <header>
        <h1 className="font-display text-5xl tracking-tight">Configurações</h1>
        <p className="mt-2 text-sm text-muted-foreground">Como a sua empresa aparece para o cliente e como ela atende.</p>
      </header>

      {canEdit ? (
        <CompanySettingsForm company={data} />
      ) : (
        <p className="rounded-2xl border border-border bg-background p-6 text-sm text-muted-foreground">
          Somente o dono ou administrador altera as configurações.
        </p>
      )}
    </div>
  );
}
