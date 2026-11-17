// Relatório do mês pronto para PDF: layout de impressão com cabeçalho da empresa, indicadores, pagamentos,
// serviços mais feitos e a lista de atendimentos concluídos. Gera o PDF pelo "Salvar como PDF" do navegador.
// Os números vêm das mesmas funções do painel (services e mappers), então o PDF bate com a tela.

import { getCurrentCompany, todayInSaoPaulo, formatDateTime } from "@/lib/company";
import { getMonthAppointments } from "@/services/relatorios.service";
import { buildReport, formatBRL, PAYMENT_LABEL } from "@/mappers/relatorios.mapper";
import { PrintButton } from "@/components/app/print-button";

// Monta o relatório do mês atual.
export default async function RelatorioImprimirPage() {
  const { supabase, company } = await getCurrentCompany();
  const today = todayInSaoPaulo();
  const monthStart = `${today.slice(0, 8)}01T00:00:00-03:00`;
  const { data } = await getMonthAppointments(supabase, monthStart);
  const rows = data ?? [];
  const report = buildReport(rows);
  const monthLabel = new Date(`${today}T12:00:00Z`).toLocaleDateString("pt-BR", { month: "long", year: "numeric", timeZone: "America/Sao_Paulo" });

  const kpis = [
    { label: "Receita recebida", value: formatBRL(report.revenue) },
    { label: "Concluídos", value: String(report.completedCount) },
    { label: "Faltas", value: String(report.noShows) },
    { label: "Cancelados", value: String(report.cancelled) },
  ];

  return (
    <main className="mx-auto max-w-3xl bg-white p-10 text-[13px] text-neutral-900 print:p-0">
      <div className="mb-6 flex items-start justify-between gap-6 border-b border-neutral-200 pb-5 print:hidden">
        <p className="text-xs text-neutral-500">Pré-visualização. Use o botão para salvar como PDF.</p>
        <PrintButton />
      </div>

      <header className="flex items-end justify-between border-b-2 border-neutral-900 pb-4">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-neutral-500">Relatório mensal</p>
          <h1 className="mt-1 text-3xl font-semibold capitalize">{monthLabel}</h1>
          <p className="mt-1 text-neutral-600">{company.name}</p>
        </div>
        <p className="text-xs text-neutral-500">Gerado em {formatDateTime(new Date().toISOString())}</p>
      </header>

      <section className="mt-6 grid grid-cols-4 gap-3">
        {kpis.map((k) => (
          <div key={k.label} className="rounded-lg border border-neutral-200 p-4">
            <p className="text-xs text-neutral-500">{k.label}</p>
            <p className="mt-2 text-xl font-semibold tabular-nums">{k.value}</p>
          </div>
        ))}
      </section>

      <section className="mt-8 grid grid-cols-2 gap-8">
        <div>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-neutral-700">Receita por forma de pagamento</h2>
          {report.byMethod.length === 0 ? (
            <p className="text-neutral-500">Nenhum pagamento registrado neste mês.</p>
          ) : (
            <table className="w-full border-collapse">
              <tbody>
                {report.byMethod.map((m) => (
                  <tr key={m.label} className="border-b border-neutral-200">
                    <td className="py-2">{m.label}</td>
                    <td className="py-2 text-right tabular-nums">{formatBRL(m.value)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
        <div>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-neutral-700">Serviços mais feitos</h2>
          {report.topServices.length === 0 ? (
            <p className="text-neutral-500">Nenhum atendimento concluído neste mês.</p>
          ) : (
            <table className="w-full border-collapse">
              <tbody>
                {report.topServices.map(([name, count]) => (
                  <tr key={name} className="border-b border-neutral-200">
                    <td className="py-2">{name}</td>
                    <td className="py-2 text-right tabular-nums">{count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </section>

      <section className="mt-8">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-neutral-700">Atendimentos concluídos</h2>
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b-2 border-neutral-900 text-left text-xs uppercase text-neutral-600">
              <th className="py-2">Data</th>
              <th className="py-2">Serviço</th>
              <th className="py-2">Pagamento</th>
              <th className="py-2 text-right">Valor</th>
            </tr>
          </thead>
          <tbody>
            {rows
              .filter((r) => r.status === "completed")
              .map((r, i) => {
                const service = Array.isArray(r.services) ? r.services[0] : r.services;
                return (
                  <tr key={i} className="border-b border-neutral-200">
                    <td className="py-2 tabular-nums">{formatDateTime(r.starts_at)}</td>
                    <td className="py-2">{service?.name ?? "Sem nome"}</td>
                    <td className="py-2">{r.payment_method ? PAYMENT_LABEL[r.payment_method] ?? r.payment_method : "—"}</td>
                    <td className="py-2 text-right tabular-nums">{formatBRL(Number(r.amount_paid ?? 0))}</td>
                  </tr>
                );
              })}
          </tbody>
        </table>
      </section>

      <footer className="mt-10 border-t border-neutral-200 pt-3 text-xs text-neutral-500">
        {company.name} · Agendfix · Valores de atendimentos concluídos no mês
      </footer>
    </main>
  );
}
