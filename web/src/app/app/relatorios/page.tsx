// Página de relatórios do mês: receita, contagens e gráficos.
// A consulta fica em services, as contas em mappers e os tipos em dto.

import Link from "next/link";
import { BarChart } from "@/components/app/charts/charts";
import { getCurrentCompany, todayInSaoPaulo } from "@/lib/company";
import { getMonthAppointments } from "@/services/relatorios.service";
import { buildReport, formatBRL } from "@/mappers/relatorios.mapper";

// Entrada: nada além da sessão do usuário.
// Saída: relatório do mês atual.
export default async function RelatoriosPage() {
  const { supabase } = await getCurrentCompany();
  const today = todayInSaoPaulo();
  // Primeiro instante do mês atual, com o fuso de São Paulo.
  const monthStart = `${today.slice(0, 8)}01T00:00:00-03:00`;

  const { data, error: loadError } = await getMonthAppointments(supabase, monthStart);
  const report = buildReport(data ?? []); // todas as contas saem do mapper

  // Cartões do topo do relatório.
  const kpis = [
    { label: "Receita recebida", value: formatBRL(report.revenue) },
    { label: "Atendimentos concluídos", value: String(report.completedCount) },
    { label: "Faltas", value: String(report.noShows) },
    { label: "Cancelados", value: String(report.cancelled) },
  ];

  return (
    <div className="flex flex-col gap-8">
      <header>
        <h1 className="font-display text-5xl tracking-tight">Relatórios</h1>
        <p className="mt-2 text-sm text-muted-foreground">Mês atual. {report.pending} atendimentos ainda aguardam fechamento.</p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Link href="/app/relatorios/imprimir" className="rounded-full bg-accent px-4 py-1.5 text-sm font-medium text-accent-foreground transition-colors hover:bg-accent/90">
            Gerar PDF do mês
          </Link>
          <Link href="/app/exportar/atendimentos" className="rounded-full border border-border px-4 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-secondary">
            Exportar CSV do mês
          </Link>
        </div>
      </header>

      {/* Aviso se a consulta falhar, em vez de mostrar zeros como se fossem reais. */}
      {loadError && (
        <p className="rounded-2xl border border-destructive/40 p-4 text-sm text-destructive">Não foi possível carregar os dados do mês. Recarregue a página.</p>
      )}

      <section className="grid gap-4 md:grid-cols-4">
        {kpis.map((k) => (
          <div key={k.label} className="rounded-2xl border border-border bg-background p-6">
            <p className="text-sm text-muted-foreground">{k.label}</p>
            <p className="mt-4 font-display text-4xl tabular-nums tracking-tight">{k.value}</p>
          </div>
        ))}
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        <div className="rounded-2xl border border-border bg-background p-6">
          <h2 className="font-body text-base font-semibold">Receita por forma de pagamento</h2>
          {report.byMethod.length === 0 ? (
            <p className="mt-6 text-sm text-muted-foreground">Nenhum pagamento registrado neste mês.</p>
          ) : (
            <div className="mt-6">
              <BarChart data={report.byMethod} height={160} />
            </div>
          )}
        </div>

        <div className="rounded-2xl border border-border bg-background p-6">
          <h2 className="font-body text-base font-semibold">Serviços mais feitos</h2>
          {report.topServices.length === 0 ? (
            <p className="mt-6 text-sm text-muted-foreground">Nenhum atendimento concluído neste mês.</p>
          ) : (
            <ul className="mt-6 divide-y divide-border">
              {report.topServices.map(([name, count]) => (
                <li key={name} className="flex items-center justify-between py-3 text-sm">
                  <span>{name}</span>
                  <span className="tabular-nums text-muted-foreground">{count}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </div>
  );
}
