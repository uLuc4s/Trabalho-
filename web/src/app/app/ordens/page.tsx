import { WorkOrderActions } from "@/components/app/work-order-actions";
import { formatDateTime, getCurrentCompany } from "@/lib/company";

type Pick<T> = T | T[] | null;
type Row = {
  id: string;
  title: string;
  status: string;
  created_at: string;
  customers: Pick<{ name: string }>;
};

const first = <T,>(value: Pick<T>): T | undefined => (Array.isArray(value) ? value[0] : value ?? undefined);

const STATUS_LABEL: Record<string, string> = {
  open: "Aberta",
  scheduled: "Programada",
  in_progress: "Em execução",
  completed: "Concluída",
  cancelled: "Cancelada",
};

export default async function OrdensPage() {
  const { supabase } = await getCurrentCompany();

  const { data: rows } = await supabase
    .from("work_orders")
    .select("id, title, status, created_at, customers(name)")
    .order("created_at", { ascending: false })
    .limit(60);

  const list = (rows ?? []) as Row[];

  const { data: linked } = await supabase
    .from("appointments")
    .select("work_order_id, details")
    .not("work_order_id", "is", null);
  const vehicleByOrder = new Map<string, { placa?: string; veiculo?: string; ano?: string }>();
  for (const a of (linked ?? []) as { work_order_id: string; details: { placa?: string; veiculo?: string; ano?: string } | null }[]) {
    if (a.details?.placa) vehicleByOrder.set(a.work_order_id, a.details);
  }

  return (
    <div className="flex flex-col gap-8">
      <header>
        <h1 className="font-display text-5xl tracking-tight">Ordens de serviço</h1>
        <p className="mt-2 text-sm text-muted-foreground">Acompanhe cada etapa do trabalho até a conclusão.</p>
      </header>

      {list.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
          Nenhuma ordem ainda. Aprove uma solicitação para abrir a primeira.
        </div>
      ) : (
        <ul className="divide-y divide-border overflow-hidden rounded-2xl border border-border bg-background">
          {list.map((row) => {
            const customer = first(row.customers);
            return (
              <li key={row.id} className="grid gap-4 p-5 md:grid-cols-[1fr_auto] md:items-center">
                <div className="min-w-0">
                  <p className="font-medium">{row.title}</p>
                  <p className="text-sm text-muted-foreground">
                    {customer?.name} · aberta em {formatDateTime(row.created_at)}
                  </p>
                  {vehicleByOrder.get(row.id) && (
                    <p className="mt-1 text-sm">
                      Veículo: {vehicleByOrder.get(row.id)?.veiculo} {vehicleByOrder.get(row.id)?.ano ? `(${vehicleByOrder.get(row.id)?.ano})` : ""} · Placa {vehicleByOrder.get(row.id)?.placa}
                    </p>
                  )}
                  <span className="mt-2 inline-block rounded-full bg-secondary px-3 py-1 text-xs">
                    {STATUS_LABEL[row.status] ?? row.status}
                  </span>
                </div>
                <WorkOrderActions workOrderId={row.id} status={row.status} />
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
