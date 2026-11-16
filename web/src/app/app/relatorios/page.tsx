import { BarChart } from "@/components/app/charts";
import { getCurrentCompany, todayInSaoPaulo } from "@/lib/company";

type Pick<T> = T | T[] | null;
type Row = {
  starts_at: string;
  status: string;
  payment_method: string | null;
  amount_paid: number | null;
  services: Pick<{ name: string }>;
};

const first = <T,>(value: Pick<T>): T | undefined => (Array.isArray(value) ? value[0] : value ?? undefined);
const money = (v: number) => `R$ ${v.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const PAYMENT_LABEL: Record<string, string> = { pix: "Pix", cartao: "Cartão", dinheiro: "Dinheiro" };

export default async function RelatoriosPage() {
  const { supabase } = await getCurrentCompany();
  const today = todayInSaoPaulo();
  const monthStart = `${today.slice(0, 8)}01T00:00:00-03:00`;

  const { data } = await supabase
    .from("appointments")
    .select("starts_at, status, payment_method, amount_paid, services(name)")
    .gte("starts_at", monthStart);

  const rows = (data ?? []) as Row[];
  const completed = rows.filter((r) => r.status === "completed");
  const revenue = completed.reduce((sum, r) => sum + Number(r.amount_paid ?? 0), 0);
  const noShows = rows.filter((r) => r.status === "no_show").length;
  const cancelled = rows.filter((r) => r.status === "cancelled").length;
  const pending = rows.filter((r) => r.status === "confirmed" || r.status === "pending_confirmation").length;

  const byMethod = new Map<string, number>();
  for (const r of completed) {
    if (!r.payment_method) continue;
    byMethod.set(r.payment_method, (byMethod.get(r.payment_method) ?? 0) + Number(r.amount_paid ?? 0));
  }
  const methodData = [...byMethod.entries()].map(([k, v]) => ({ label: PAYMENT_LABEL[k] ?? k, value: Math.round(v) }));

  const byService = new Map<string, number>();
  for (const r of completed) {
    const name = first(r.services)?.name ?? "Sem nome";
    byService.set(name, (byService.get(name) ?? 0) + 1);
  }
  const topServices = [...byService.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5);

  const kpis = [
    { label: "Receita recebida", value: money(revenue) },
    { label: "Atendimentos concluídos", value: String(completed.length) },
    { label: "Faltas", value: String(noShows) },
    { label: "Cancelados", value: String(cancelled) },
  ];

  return (
    <div className="flex flex-col gap-8">
      <header>
        <h1 className="font-display text-5xl tracking-tight">Relatórios</h1>
        <p className="mt-2 text-sm text-muted-foreground">Mês atual. {pending} atendimentos ainda aguardam fechamento.</p>
      </header>

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
          {methodData.length === 0 ? (
            <p className="mt-6 text-sm text-muted-foreground">Nenhum pagamento registrado neste mês.</p>
          ) : (
            <div className="mt-6">
              <BarChart data={methodData} height={160} />
            </div>
          )}
        </div>

        <div className="rounded-2xl border border-border bg-background p-6">
          <h2 className="font-body text-base font-semibold">Serviços mais feitos</h2>
          {topServices.length === 0 ? (
            <p className="mt-6 text-sm text-muted-foreground">Nenhum atendimento concluído neste mês.</p>
          ) : (
            <ul className="mt-6 divide-y divide-border">
              {topServices.map(([name, count]) => (
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
