// Calendário mensal da agenda: grade de dias com a contagem de marcados e cancelados em cada um.
// Não tem estado. A navegação entre meses e dias são links para a própria página com parâmetros na URL.
import Link from "next/link"; // navegação por link, sem JavaScript de estado
import { ChevronLeft, ChevronRight } from "lucide-react"; // setas de mês
import { cn } from "@/lib/utils"; // junta classes CSS

// Contagem de um dia: quantos marcados e quantos cancelados.
export type DayCount = { booked: number; cancelled: number };

// Abreviações dos dias da semana, começando no domingo.
const WEEK = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

// Entrada: ano, mês (1 a 12), contagens por dia (chave AAAA-MM-DD), dia selecionado e hoje.
// Saída: o calendário do mês com links para cada dia.
export function MonthCalendar({
  year,
  month,
  counts,
  selected,
  today,
}: {
  year: number;
  month: number;
  counts: Record<string, DayCount>;
  selected: string;
  today: string;
}) {
  // Primeiro dia do mês ao meio-dia UTC, para não cair no dia anterior por causa do fuso.
  const first = new Date(Date.UTC(year, month - 1, 1, 12));
  // Dia zero do mês seguinte = último dia deste mês.
  const daysInMonth = new Date(Date.UTC(year, month, 0, 12)).getUTCDate();
  const leading = first.getUTCDay(); // quantos espaços vazios antes do dia 1 (0 = domingo)
  // Lista de células: espaços vazios antes do dia 1, depois as datas AAAA-MM-DD do mês.
  const cells: (string | null)[] = [
    ...Array.from({ length: leading }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) => `${year}-${String(month).padStart(2, "0")}-${String(i + 1).padStart(2, "0")}`),
  ];

  // Mês anterior e seguinte, para as setas.
  const prev = new Date(Date.UTC(year, month - 2, 1, 12));
  const next = new Date(Date.UTC(year, month, 1, 12));
  // Nome do mês por extenso, ex.: "novembro de 2026".
  const monthLabel = first.toLocaleDateString("pt-BR", { month: "long", year: "numeric", timeZone: "UTC" });
  // Link para outro mês: só o ano e o mês vão na URL.
  const link = (d: Date) => `/app/agenda?mes=${d.toISOString().slice(0, 7)}`;

  return (
    <section className="rounded-2xl border border-border bg-background p-6">
      <header className="mb-5 flex items-center justify-between">
        <h2 className="font-display text-3xl capitalize tracking-tight">{monthLabel}</h2>
        <div className="flex items-center gap-2">
          <Link href={link(prev)} aria-label="Mês anterior" className="flex h-9 w-9 items-center justify-center rounded-full border border-border transition-colors hover:bg-secondary">
            <ChevronLeft className="h-4 w-4" aria-hidden />
          </Link>
          <Link href={link(next)} aria-label="Próximo mês" className="flex h-9 w-9 items-center justify-center rounded-full border border-border transition-colors hover:bg-secondary">
            <ChevronRight className="h-4 w-4" aria-hidden />
          </Link>
        </div>
      </header>

      {/* Linha com os nomes dos dias da semana. */}
      <div className="grid grid-cols-7 gap-1 text-center text-[11px] uppercase tracking-wider text-muted-foreground">
        {WEEK.map((d) => (
          <span key={d} className="py-2">{d}</span>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {cells.map((key, index) => {
          // Espaço vazio antes do dia 1: só ocupa a posição.
          if (!key) return <span key={`empty-${index}`} />;
          const day = Number(key.slice(8)); // número do dia, ex.: 16
          const count = counts[key] ?? { booked: 0, cancelled: 0 }; // zero se não houver nada
          const isSelected = key === selected; // dia aberto na lista ao lado
          const isToday = key === today; // dia de hoje, em destaque
          return (
            <Link
              key={key}
              href={`/app/agenda?data=${key}`}
              className={cn(
                "group flex aspect-square flex-col items-center justify-between rounded-xl border p-2 transition-all duration-200 hover:-translate-y-0.5 hover:border-accent/50",
                isSelected ? "border-accent bg-accent/5" : "border-transparent hover:bg-secondary/60",
              )}
            >
              <span
                className={cn(
                  "flex h-7 w-7 items-center justify-center rounded-full text-sm tabular-nums",
                  isToday && "bg-foreground text-background",
                )}
              >
                {day}
              </span>
              {/* Pontos e números: marcados em destaque, cancelados riscados e apagados. */}
              <div className="flex flex-col items-center gap-1 text-[11px] tabular-nums">
                {count.booked > 0 && (
                  <span className="flex items-center gap-1 text-foreground">
                    <span className="h-1.5 w-1.5 rounded-full bg-accent" aria-hidden />
                    {count.booked}
                  </span>
                )}
                {count.cancelled > 0 && (
                  <span className="flex items-center gap-1 text-muted-foreground line-through">
                    <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/50" aria-hidden />
                    {count.cancelled}
                  </span>
                )}
              </div>
            </Link>
          );
        })}
      </div>

      {/* Legenda das cores. */}
      <footer className="mt-5 flex items-center gap-5 text-xs text-muted-foreground">
        <span className="flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-accent" aria-hidden />Marcados</span>
        <span className="flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-muted-foreground/50" aria-hidden />Cancelados</span>
      </footer>
    </section>
  );
}
