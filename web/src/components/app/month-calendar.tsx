import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

export type DayCount = { booked: number; cancelled: number };

const WEEK = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

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
  const first = new Date(Date.UTC(year, month - 1, 1, 12));
  const daysInMonth = new Date(Date.UTC(year, month, 0, 12)).getUTCDate();
  const leading = first.getUTCDay();
  const cells: (string | null)[] = [
    ...Array.from({ length: leading }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) => `${year}-${String(month).padStart(2, "0")}-${String(i + 1).padStart(2, "0")}`),
  ];

  const prev = new Date(Date.UTC(year, month - 2, 1, 12));
  const next = new Date(Date.UTC(year, month, 1, 12));
  const monthLabel = first.toLocaleDateString("pt-BR", { month: "long", year: "numeric", timeZone: "UTC" });
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

      <div className="grid grid-cols-7 gap-1 text-center text-[11px] uppercase tracking-wider text-muted-foreground">
        {WEEK.map((d) => (
          <span key={d} className="py-2">{d}</span>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {cells.map((key, index) => {
          if (!key) return <span key={`empty-${index}`} />;
          const day = Number(key.slice(8));
          const count = counts[key] ?? { booked: 0, cancelled: 0 };
          const isSelected = key === selected;
          const isToday = key === today;
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

      <footer className="mt-5 flex items-center gap-5 text-xs text-muted-foreground">
        <span className="flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-accent" aria-hidden />Marcados</span>
        <span className="flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-muted-foreground/50" aria-hidden />Cancelados</span>
      </footer>
    </section>
  );
}
