// Página de configurações: dados da empresa que aparecem para o cliente e regras de atendimento.
// A consulta fica em services.

import { CompanySettingsForm } from "@/components/app/company-settings-form";
import { getCurrentCompany } from "@/lib/company";
import { getCompanySettings } from "@/services/configuracoes.service";

// Entrada: nada além da sessão do usuário.
// Saída: formulário de configurações, ou apenas leitura para quem não é dono ou admin.
export default async function ConfiguracoesPage() {
  const { supabase, company, role } = await getCurrentCompany();
  const canEdit = role === "owner" || role === "admin"; // só dono e admin alteram

  const { data } = await getCompanySettings(supabase, company.id);

  // Sem dados da empresa, não há o que mostrar.
  if (!data) return null;

  return (
    <div className="flex flex-col gap-10">
      <header>
        <h1 className="font-display text-5xl tracking-tight">Configurações</h1>
        <p className="mt-2 text-sm text-muted-foreground">Como a sua empresa aparece para o cliente e como ela atende.</p>
      </header>

      {canEdit ? (
        // Empresa sem formas de pagamento cadastradas recebe lista vazia, não null.
        <CompanySettingsForm company={{ ...data, payment_methods: data.payment_methods ?? [] }} />
      ) : (
        <p className="rounded-2xl border border-border bg-background p-6 text-sm text-muted-foreground">
          Somente o dono ou administrador altera as configurações.
        </p>
      )}
    </div>
  );
}
