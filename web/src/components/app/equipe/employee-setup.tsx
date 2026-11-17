// Configuração de um profissional: quais serviços ele faz e em que dias e horários trabalha.
// Cada alteração grava direto no banco e atualiza a tela.
// Roda no navegador porque tem clique, formulário e chamadas ao Supabase.
"use client";

import { useRouter } from "next/navigation"; // atualiza a tela depois de cada gravação
import { useState, useTransition } from "react"; // estado e transição de carregamento
import { Loader2, Trash2 } from "lucide-react"; // ícones
import { createClient } from "@/lib/supabase/client"; // cliente do navegador

// Dias da semana, na mesma ordem do banco: 0 = domingo.
const WEEKDAYS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

// Serviço da empresa, para escolher quais o profissional faz.
type Service = { id: string; name: string };
// Expediente gravado: dia da semana e horário de início e fim.
type Hour = { id: string; weekday: number; start_time: string; end_time: string };

// Entrada: empresa, profissional, serviços da empresa, quais o profissional já faz e seus horários.
// Saída: botões de serviços, lista de expedientes e formulário para novo expediente.
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
  const [pending, startTransition] = useTransition(); // true enquanto grava
  const [error, setError] = useState<string | null>(null);
  // Valores do formulário de novo expediente. Segunda-feira e 9h às 18h são o padrão.
  const [weekday, setWeekday] = useState(1);
  const [start, setStart] = useState("09:00");
  const [end, setEnd] = useState("18:00");

  // Executa uma gravação no banco e atualiza a tela, ou mostra o erro.
  // Entrada: função que recebe o cliente e devolve a resposta do Supabase.
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

  // Liga ou desliga um serviço do profissional.
  // Se já está ligado, apaga a ligação. Se não está, cria.
  function toggleService(serviceId: string, linked: boolean) {
    run((supabase) =>
      linked
        ? supabase.from("employee_services").delete().eq("employee_id", employeeId).eq("service_id", serviceId)
        : supabase.from("employee_services").insert({ company_id: companyId, employee_id: employeeId, service_id: serviceId }),
    );
  }

  // Adiciona um expediente. Regra: o fim precisa vir depois do início (comparação de texto HH:MM funciona).
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

  // Remove um expediente pelo id.
  function removeHour(id: string) {
    run((supabase) => supabase.from("working_hours").delete().eq("id", id));
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Serviços que o profissional atende. Clicar liga ou desliga. */}
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

      {/* Expedientes: lista atual e formulário para adicionar. */}
      <div className="flex flex-col gap-3">
        <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Horário de trabalho</p>
        <ul className="flex flex-col gap-2">
          {hours.map((hour) => (
            <li key={hour.id} className="flex items-center justify-between rounded-lg bg-secondary/60 px-3 py-2 text-sm">
              {/* Corta os segundos: 09:00:00 vira 09:00. */}
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
