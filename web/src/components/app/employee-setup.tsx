"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Loader2, Trash2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

const WEEKDAYS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

type Service = { id: string; name: string };
type Hour = { id: string; weekday: number; start_time: string; end_time: string };

export function EmployeeSetup({
  companyId,
  employeeId,
  services,
  linkedServiceIds,
  hours,
}: {
  companyId: string;
  employeeId: string;
  services: Service[];
  linkedServiceIds: string[];
  hours: Hour[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [weekday, setWeekday] = useState(1);
  const [start, setStart] = useState("09:00");
  const [end, setEnd] = useState("18:00");

  function run(action: (supabase: ReturnType<typeof createClient>) => PromiseLike<{ error: { message: string } | null }>) {
    setError(null);
    startTransition(async () => {
      const supabase = createClient();
      const { error: actionError } = await action(supabase);
      if (actionError) {
        setError(actionError.message);
        return;
      }
      router.refresh();
    });
  }

  function toggleService(serviceId: string, linked: boolean) {
    run((supabase) =>
      linked
        ? supabase.from("employee_services").delete().eq("employee_id", employeeId).eq("service_id", serviceId)
        : supabase.from("employee_services").insert({ company_id: companyId, employee_id: employeeId, service_id: serviceId }),
    );
  }

  function addHour() {
    if (start >= end) return setError("O horário final precisa ser depois do inicial.");
    run((supabase) =>
      supabase.from("working_hours").insert({
        company_id: companyId,
        employee_id: employeeId,
        weekday,
        start_time: start,
        end_time: end,
      }),
    );
  }

  function removeHour(id: string) {
    run((supabase) => supabase.from("working_hours").delete().eq("id", id));
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3">
        <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Serviços que atende</p>
        {services.length === 0 ? (
          <p className="text-sm text-muted-foreground">Cadastre um serviço antes de vincular.</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {services.map((service) => {
              const linked = linkedServiceIds.includes(service.id);
              return (
                <button
                  key={service.id}
                  type="button"
                  disabled={pending}
                  onClick={() => toggleService(service.id, linked)}
                  className={`rounded-full border px-3 py-1.5 text-xs transition-colors disabled:opacity-50 ${
                    linked ? "border-accent bg-accent/10 text-foreground" : "border-border text-muted-foreground hover:bg-secondary"
                  }`}
                >
                  {service.name}
                </button>
              );
            })}
          </div>
        )}
      </div>

      <div className="flex flex-col gap-3">
        <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Horário de trabalho</p>
        <ul className="flex flex-col gap-2">
          {hours.map((hour) => (
            <li key={hour.id} className="flex items-center justify-between rounded-lg bg-secondary/60 px-3 py-2 text-sm">
              <span>
                {WEEKDAYS[hour.weekday]} · {hour.start_time.slice(0, 5)} às {hour.end_time.slice(0, 5)}
              </span>
              <button
                type="button"
                aria-label="Remover horário"
                onClick={() => removeHour(hour.id)}
                disabled={pending}
                className="text-muted-foreground transition-colors hover:text-destructive disabled:opacity-50"
              >
                <Trash2 className="h-4 w-4" aria-hidden />
              </button>
            </li>
          ))}
          {hours.length === 0 && <li className="text-sm text-muted-foreground">Sem horário definido.</li>}
        </ul>

        <div className="flex flex-wrap items-end gap-3">
          <label className="flex flex-col gap-1 text-xs text-muted-foreground">
            Dia
            <select
              value={weekday}
              onChange={(e) => setWeekday(Number(e.target.value))}
              className="h-9 rounded-md border border-input bg-background px-2 text-sm text-foreground"
            >
              {WEEKDAYS.map((label, index) => (
                <option key={label} value={index}>
                  {label}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1 text-xs text-muted-foreground">
            Início
            <input
              type="time"
              value={start}
              onChange={(e) => setStart(e.target.value)}
              className="h-9 rounded-md border border-input bg-background px-2 text-sm text-foreground"
            />
          </label>
          <label className="flex flex-col gap-1 text-xs text-muted-foreground">
            Fim
            <input
              type="time"
              value={end}
              onChange={(e) => setEnd(e.target.value)}
              className="h-9 rounded-md border border-input bg-background px-2 text-sm text-foreground"
            />
          </label>
          <button
            type="button"
            onClick={addHour}
            disabled={pending}
            className="flex h-9 items-center gap-2 rounded-full bg-accent px-4 text-xs font-medium text-accent-foreground transition-colors hover:bg-accent/90 disabled:opacity-50"
          >
            {pending && <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />}
            Adicionar horário
          </button>
        </div>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}
