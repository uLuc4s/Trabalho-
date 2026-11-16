import Link from "next/link";
// Página de ordens de serviço: lista, veículo, status, ações e histórico de cada ordem.
// A consulta fica em services, as regras em mappers e os tipos em dto.

import { WorkOrderActions } from "@/components/app/work-order-actions";
import { formatDateTime, getCurrentCompany } from "@/lib/company";
import { getLinkedAppointments, getWorkOrderEvents, getWorkOrders } from "@/services/ordens.service";
import { buildVehicleByOrder, describeEvent, groupEventsByOrder, STATUS_LABEL } from "@/mappers/ordens.mapper";
import { first } from "@/mappers/agenda.mapper";

// Entrada: nada além da sessão do usuário.
// Saída: lista de ordens com veículo e histórico de status.
export default async function OrdensPage() {
  const { supabase } = await getCurrentCompany();

  // Busca ordens, histórico e veículos em paralelo.
  const [{ data: rows, error: loadError }, { data: events }, { data: linked }] = await Promise.all([
    getWorkOrders(supabase),
    getWorkOrderEvents(supabase),
    getLinkedAppointments(supabase),
  ]);

  const list = rows ?? [];
  const historyByOrder = groupEventsByOrder(events ?? []); // histórico de cada ordem
  const vehicleByOrder = buildVehicleByOrder(linked ?? []); // veículo de cada ordem

  return (
    <div className="flex flex-col gap-8">
      <header>
        <h1 className="font-display text-5xl tracking-tight">Ordens de serviço</h1>
        <p className="mt-2 text-sm text-muted-foreground">Acompanhe cada etapa do trabalho até a conclusão.</p>
      </header>

      {/* Se a consulta falhar, mostra aviso em vez de parecer lista vazia. */}
      {loadError ? (
        <p className="rounded-2xl border border-destructive/40 p-4 text-sm text-destructive">Não foi possível carregar as ordens. Recarregue a página.</p>
      ) : list.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
          Nenhuma ordem ainda.{" "}
          <Link href="/app/solicitacoes" className="font-medium text-foreground underline underline-offset-4">
            Ver solicitações para aprovar
          </Link>
        </div>
      ) : (
        <ul className="divide-y divide-border overflow-hidden rounded-2xl border border-border bg-background">
          {list.map((row) => {
            const customer = first(row.customers);
            const vehicle = vehicleByOrder.get(row.id);
            const history = historyByOrder.get(row.id) ?? [];
            return (
              <li key={row.id} className="grid gap-4 p-5 md:grid-cols-[1fr_auto] md:items-center">
                <div className="min-w-0">
                  <p className="font-medium">{row.title}</p>
                  <p className="text-sm text-muted-foreground">
                    {customer?.name} · aberta em {formatDateTime(row.created_at)}
                  </p>
                  {vehicle && (
                    <p className="mt-1 text-sm">
                      Veículo: {vehicle.veiculo} {vehicle.ano ? `(${vehicle.ano})` : ""} · Placa {vehicle.placa}
                    </p>
                  )}
                  <span className="mt-2 inline-block rounded-full bg-secondary px-3 py-1 text-xs">
                    {STATUS_LABEL[row.status] ?? row.status}
                  </span>
                </div>
                <div className="flex flex-col items-end gap-2">
                  {/* Botões para avançar ou cancelar a ordem, conforme o status atual. */}
                  <WorkOrderActions workOrderId={row.id} status={row.status} />
                  {/* Histórico recolhível de mudanças de status. */}
                  <details className="text-xs text-muted-foreground">
                    <summary className="cursor-pointer">Histórico ({history.length})</summary>
                    <ul className="mt-2 flex flex-col gap-1 text-right">
                      {history.map((e, i) => (
                        <li key={i}>
                          {describeEvent(e)} · {formatDateTime(e.created_at)}
                        </li>
                      ))}
                    </ul>
                  </details>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
