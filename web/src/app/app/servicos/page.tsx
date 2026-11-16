import { ServiceForm } from "@/components/app/service-form";
import { getCurrentCompany } from "@/lib/company";

export default async function ServicosPage() {
  const { supabase, company } = await getCurrentCompany();

  const { data: services } = await supabase
    .from("services")
    .select("id, name, duration_minutes, price, active")
    .order("name");

  return (
    <div className="flex flex-col gap-8">
      <header>
        <h1 className="font-display text-5xl tracking-tight">Serviços</h1>
        <p className="mt-2 text-sm text-muted-foreground">O que o cliente pode agendar e quanto tempo cada um leva.</p>
      </header>

      <ServiceForm companyId={company.id} />

      {!services || services.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
          Nenhum serviço cadastrado ainda.
        </div>
      ) : (
        <ul className="divide-y divide-border overflow-hidden rounded-2xl border border-border bg-background">
          {services.map((service) => (
            <li key={service.id} className="flex items-center justify-between gap-4 p-5">
              <div>
                <p className="font-medium">{service.name}</p>
                <p className="text-sm text-muted-foreground">{service.duration_minutes} min</p>
              </div>
              <div className="text-right text-sm tabular-nums">
                {service.price !== null ? `R$ ${Number(service.price).toFixed(2).replace(".", ",")}` : "Sob consulta"}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
