// Página de serviços: formulário para cadastrar e lista dos serviços da empresa.
// A consulta fica em services.

import { ServiceForm } from "@/components/app/forms/service-form";
import { getCurrentCompany } from "@/lib/company";
import { getServices } from "@/services/servicos.service";
import { formatMoney } from "@/mappers/agenda.mapper";

// Entrada: nada além da sessão do usuário.
// Saída: formulário de cadastro e a lista de serviços.
export default async function ServicosPage() {
  const { supabase, company } = await getCurrentCompany();

  const { data: services, error: loadError } = await getServices(supabase);

  return (
    <div className="flex flex-col gap-8">
      <header>
        <h1 className="font-display text-5xl tracking-tight">Serviços</h1>
        <p className="mt-2 text-sm text-muted-foreground">O que o cliente pode agendar e quanto tempo cada um leva.</p>
      </header>

      {/* Formulário para criar um serviço novo. */}
      <ServiceForm companyId={company.id} />

      {loadError ? (
        <p className="rounded-2xl border border-destructive/40 p-4 text-sm text-destructive">Não foi possível carregar os serviços. Recarregue a página.</p>
      ) : !services || services.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
          Nenhum serviço cadastrado ainda.
        </div>
      ) : (
        <ul className="divide-y divide-border overflow-hidden rounded-2xl border border-border bg-background">
          {services.map((service) => (
            <li key={service.id} className="flex items-center justify-between gap-4 p-5">
              <div className="min-w-0">
                {service.category && <p className="text-[11px] uppercase tracking-[0.16em] text-accent">{service.category}</p>}
                <p className="font-medium">{service.name}</p>
                {service.description && <p className="mt-1 text-sm text-muted-foreground">{service.description}</p>}
                <p className="mt-1 text-xs text-muted-foreground">{service.duration_minutes} min</p>
              </div>
              <div className="text-right text-sm tabular-nums">
                {service.price !== null ? `R$ ${formatMoney(Number(service.price))}` : "Sob consulta"}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
