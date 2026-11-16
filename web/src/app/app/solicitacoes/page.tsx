import { ReviewRequest } from "@/components/app/review-request";
import { formatDateTime, getCurrentCompany } from "@/lib/company";

type Pick<T> = T | T[] | null;
type Row = {
  id: string;
  status: string;
  created_at: string;
  preferred_window: string | null;
  notes: string | null;
  services: Pick<{ name: string }>;
  customers: Pick<{ name: string; phone: string }>;
};

const first = <T,>(value: Pick<T>): T | undefined => (Array.isArray(value) ? value[0] : value ?? undefined);

export default async function SolicitacoesPage() {
  const { supabase } = await getCurrentCompany();

  const { data: rows, error: loadError } = await supabase
    .from("service_requests")
    .select("id, status, created_at, preferred_window, notes, services(name), customers(name, phone)")
    .order("created_at", { ascending: false })
    .limit(50);

  const list = (rows ?? []) as Row[];
  const open = list.filter((r) => r.status === "new" || r.status === "under_review");
  const decided = list.filter((r) => r.status !== "new" && r.status !== "under_review");

  return (
    <div className="flex flex-col gap-10">
      <header>
        <h1 className="font-display text-5xl tracking-tight">Solicitações</h1>
        <p className="mt-2 text-sm text-muted-foreground">Pedidos de orçamento e visita enviados pelos clientes.</p>
      </header>

      {loadError && <p className="rounded-2xl border border-destructive/40 p-4 text-sm text-destructive">Não foi possível carregar as solicitações. Recarregue a página.</p>}

      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-medium text-muted-foreground">Aguardando decisão · {open.length}</h2>
        {open.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
            Nenhuma solicitação aguardando.
          </div>
        ) : (
          <ul className="divide-y divide-border overflow-hidden rounded-2xl border border-border bg-background">
            {open.map((row) => {
              const service = first(row.services);
              const customer = first(row.customers);
              return (
                <li key={row.id} className="grid gap-4 p-5 md:grid-cols-[1fr_auto] md:items-center">
                  <div className="min-w-0">
                    <p className="font-medium">{service?.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {customer?.name} · {customer?.phone} · recebido em {formatDateTime(row.created_at)}
                    </p>
                    {row.preferred_window && <p className="mt-1 text-sm">Preferência: {row.preferred_window}</p>}
                    {row.notes && <p className="mt-1 text-sm text-muted-foreground">{row.notes}</p>}
                  </div>
                  <ReviewRequest requestId={row.id} />
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {decided.length > 0 && (
        <section className="flex flex-col gap-3">
          <h2 className="text-sm font-medium text-muted-foreground">Decididas</h2>
          <ul className="divide-y divide-border overflow-hidden rounded-2xl border border-border bg-background">
            {decided.map((row) => {
              const service = first(row.services);
              const customer = first(row.customers);
              return (
                <li key={row.id} className="flex items-center justify-between gap-4 p-5 text-sm">
                  <span className="truncate">
                    {service?.name} · {customer?.name}
                  </span>
                  <span className="shrink-0 rounded-full bg-secondary px-3 py-1 text-xs">
                    {row.status === "approved" ? "Aprovada" : "Recusada"}
                  </span>
                </li>
              );
            })}
          </ul>
        </section>
      )}
    </div>
  );
}
