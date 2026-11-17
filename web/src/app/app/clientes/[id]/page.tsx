// Histórico completo de um cliente: dados de contato, resumo e a linha do tempo de atendimentos,
// pedidos de orçamento e ordens de serviço. Acessível pelo botão "Histórico" na lista de clientes.

import Link from "next/link";
import { notFound } from "next/navigation";
import { formatDateTime, getCurrentCompany } from "@/lib/company";
import { formatMoney } from "@/mappers/agenda.mapper";
import {
  getCustomerAppointmentsHistory,
  getCustomerHeader,
  getCustomerOrdersHistory,
  getCustomerRequestsHistory,
} from "@/services/historico-cliente.service";

// Rótulos em português dos status de cada tipo de registro.
const APPOINTMENT_STATUS: Record<string, string> = {
  pending_confirmation: "Aguardando",
  confirmed: "Confirmado",
  completed: "Concluído",
  cancelled: "Cancelado",
  no_show: "Faltou",
};
const REQUEST_STATUS: Record<string, string> = {
  new: "Novo",
  under_review: "Em análise",
  approved: "Aprovado",
  rejected: "Recusado",
  expired: "Expirado",
  cancelled: "Cancelado",
};
const ORDER_STATUS: Record<string, string> = {
  open: "Aberta",
  scheduled: "Programada",
  in_progress: "Em execução",
  completed: "Concluída",
  cancelled: "Cancelada",
};

// Pega o nome do serviço, que pode vir como objeto ou lista.
function serviceName(value: { name: string } | { name: string }[] | null) {
  const item = Array.isArray(value) ? value[0] : value;
  return item?.name ?? "Sem serviço";
}

// Monta o histórico de um cliente. O id vem da URL.
export default async function ClienteHistoricoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { supabase } = await getCurrentCompany();

  const { data: customer } = await getCustomerHeader(supabase, id);
  if (!customer) notFound();

  const [{ data: appointments }, { data: requests }, { data: orders }] = await Promise.all([
    getCustomerAppointmentsHistory(supabase, id),
    getCustomerRequestsHistory(supabase, id),
    getCustomerOrdersHistory(supabase, id),
  ]);

  const list = appointments ?? [];
  const completed = list.filter((a) => a.status === "completed");
  const totalPaid = completed.reduce((sum, a) => sum + Number(a.amount_paid ?? 0), 0);

  return (
    <div className="flex flex-col gap-8">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <Link href="/app/clientes" className="text-sm text-muted-foreground hover:text-foreground">
            ← Clientes
          </Link>
          <h1 className="mt-2 font-display text-5xl tracking-tight">{customer.name}</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {customer.phone}
            {customer.email ? ` · ${customer.email}` : ""}
          </p>
        </div>
      </header>

      <section className="grid gap-4 md:grid-cols-4">
        <Stat label="Atendimentos" value={String(list.length)} />
        <Stat label="Concluídos" value={String(completed.length)} />
        <Stat label="Total pago" value={formatMoney(totalPaid)} />
        <Stat label="Ordens abertas" value={String((orders ?? []).filter((o) => o.status !== "completed" && o.status !== "cancelled").length)} />
      </section>

      <Block title="Atendimentos">
        {list.length === 0 ? (
          <Empty text="Nenhum atendimento ainda." />
        ) : (
          <Table
            head={["Data", "Serviço", "Situação", "Pagamento", "Valor"]}
            rows={list.map((a) => [
              formatDateTime(a.starts_at),
              serviceName(a.services),
              APPOINTMENT_STATUS[a.status] ?? a.status,
              a.payment_method ?? "—",
              a.amount_paid !== null ? formatMoney(Number(a.amount_paid)) : "—",
            ])}
          />
        )}
      </Block>

      <Block title="Pedidos de orçamento">
        {(requests ?? []).length === 0 ? (
          <Empty text="Nenhum pedido ainda." />
        ) : (
          <Table
            head={["Data", "Serviço", "Situação"]}
            rows={(requests ?? []).map((r) => [formatDateTime(r.created_at), serviceName(r.services), REQUEST_STATUS[r.status] ?? r.status])}
          />
        )}
      </Block>

      <Block title="Ordens de serviço">
        {(orders ?? []).length === 0 ? (
          <Empty text="Nenhuma ordem ainda." />
        ) : (
          <Table
            head={["Data", "Título", "Situação"]}
            rows={(orders ?? []).map((o) => [formatDateTime(o.created_at), o.title, ORDER_STATUS[o.status] ?? o.status])}
          />
        )}
      </Block>
    </div>
  );
}

// Cartão de indicador. Entrada: rótulo e valor. Saída: caixa com número.
function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-border bg-background p-6">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="mt-3 font-display text-3xl tabular-nums tracking-tight">{value}</p>
    </div>
  );
}

// Bloco com título. Entrada: título e conteúdo. Saída: seção.
function Block({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-sm font-medium text-muted-foreground">{title}</h2>
      {children}
    </section>
  );
}

// Tabela simples. Entrada: cabeçalhos e linhas. Saída: tabela com borda.
function Table({ head, rows }: { head: string[]; rows: string[][] }) {
  return (
    <div className="overflow-x-auto rounded-2xl border border-border bg-background">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
            {head.map((h) => (
              <th key={h} className="px-5 py-3 font-medium">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} className="border-b border-border/60 last:border-0">
              {row.map((cell, j) => (
                <td key={j} className="px-5 py-3">
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// Mensagem de bloco vazio. Entrada: texto. Saída: caixa tracejada.
function Empty({ text }: { text: string }) {
  return <div className="rounded-2xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">{text}</div>;
}
