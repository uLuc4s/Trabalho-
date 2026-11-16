// Fluxo de agendamento público em 4 passos: serviço, profissional e dia, horário e seus dados.
// Não exige login. Ao confirmar, mostra o link para consultar ou cancelar o agendamento.
// Roda no navegador porque tem seleção, consultas de horário e envio.
"use client";

import Link from "next/link"; // link para a consulta do agendamento
import { useEffect, useMemo, useState, useTransition } from "react"; // estado, efeitos, cálculo memorizado e transição
import { AlertCircle, ArrowLeft, Check, Loader2 } from "lucide-react"; // ícones
import { createClient } from "@/lib/supabase/client"; // cliente do navegador
import { cn } from "@/lib/utils"; // junta classes CSS

// Serviço como a página pública recebe.
type Service = {
  id: string;
  name: string;
  description: string | null;
  category: string | null;
  duration_minutes: number;
  price: number | null;
};
// Profissional como a página pública recebe.
type Employee = { id: string; display_name: string };
// Dados públicos da empresa usados pelo fluxo.
type Info = { name: string; timezone: string; segment: string | null; services: Service[]; employees: Employee[] };

// Áreas de atuação para o caso de advocacia.
const LEGAL_AREAS = ["Trabalhista", "Civil", "Família", "Criminal", "Empresarial", "Outra"];
// Um horário livre devolvido pelo banco: início e profissional.
type Slot = { slot_start: string; slot_employee_id: string };

// Quantos dias à frente o cliente pode escolher.
const DAYS_AHEAD = 14;

// Converte uma data em AAAA-MM-DD no fuso de São Paulo.
function isoDate(d: Date) {
  return d.toLocaleDateString("en-CA", { timeZone: "America/Sao_Paulo" });
}

// Formata o preço em reais, ou "Sob consulta" se não houver preço.
function formatPrice(value: number | null) {
  return value === null ? "Sob consulta" : `R$ ${Number(value).toFixed(2).replace(".", ",")}`;
}

// Entrada: endereço da empresa e informações públicas (serviços, profissionais e segmento).
// Saída: o fluxo em passos, ou a confirmação com o link do agendamento.
export function BookingFlow({ slug, info }: { slug: string; info: Info }) {
  const [serviceId, setServiceId] = useState<string | null>(null); // serviço escolhido
  const [employeeId, setEmployeeId] = useState<string | "any">("any"); // profissional escolhido, ou qualquer um
  const [date, setDate] = useState<string | null>(null); // dia escolhido, em AAAA-MM-DD
  const [slots, setSlots] = useState<Slot[] | null>(null); // horários livres; null = ainda carregando
  const [chosenSlot, setChosenSlot] = useState<Slot | null>(null); // horário escolhido
  const [name, setName] = useState(""); // dados do cliente
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [consent, setConsent] = useState(false); // aceite do uso dos dados (LGPD)
  const [plate, setPlate] = useState(""); // placa, só para oficina
  const [vehicle, setVehicle] = useState(""); // modelo do veículo, só para oficina
  const [vehicleYear, setVehicleYear] = useState(""); // ano do veículo, opcional
  const [legalArea, setLegalArea] = useState(""); // área do caso, só para advocacia
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<{ token: string; startsAt: string } | null>(null); // agendamento criado
  const [submitting, startSubmit] = useTransition();

  // Serviço escolhido, ou null se ainda não escolheu.
  const service = info.services.find((s) => s.id === serviceId) ?? null;

  // Troca o profissional e limpa o horário, porque a lista de horários muda.
  function pickEmployee(id: string | "any") {
    setEmployeeId(id);
    setSlots(null);
    setChosenSlot(null);
  }

  // Troca o dia e limpa o horário, porque a lista de horários muda.
  function pickDate(value: string) {
    setDate(value);
    setSlots(null);
    setChosenSlot(null);
  }
  // Nome do profissional a partir do id.
  const employeeName = (id: string) => info.employees.find((e) => e.id === id)?.display_name ?? "";

  // Lista dos próximos 14 dias, começando amanhã. Calculada uma vez.
  const days = useMemo(() => {
    const list: Date[] = [];
    const base = new Date();
    for (let i = 1; i <= DAYS_AHEAD; i++) {
      const d = new Date(base);
      d.setDate(base.getDate() + i);
      list.push(d);
    }
    return list;
  }, []);

  // Quando serviço, dia ou profissional mudam, busca os horários livres no banco.
  // A flag "active" descarta respostas antigas se o usuário trocar de opção rápido.
  useEffect(() => {
    if (!serviceId || !date) return;
    let active = true;
    createClient()
      .rpc("public_available_slots", {
        p_slug: slug,
        p_service_id: serviceId,
        p_date: date,
        p_employee_id: employeeId === "any" ? null : employeeId, // null = qualquer profissional
      })
      .then(({ data, error: rpcError }) => {
        if (!active) return; // resposta de uma escolha antiga, ignora
        if (rpcError) {
          setError("Não foi possível carregar os horários.");
          setSlots([]);
          return;
        }
        setError(null);
        setSlots((data ?? []) as Slot[]);
      });
    return () => {
      active = false;
    };
  }, [slug, serviceId, date, employeeId]);

  // Confirma o agendamento: valida os dados, monta os detalhes do segmento e envia.
  // Regras: nome, telefone com DDD, aceite e, conforme o segmento, placa e modelo (oficina) ou área (advocacia).
  function confirm(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!service || !chosenSlot) return;
    setError(null);
    if (name.trim().length < 2) return setError("Informe seu nome.");
    if (phone.replace(/\D/g, "").length < 10) return setError("Informe um telefone com DDD.");
    if (!consent) return setError("Aceite o uso dos seus dados para confirmar.");

    // Dados extras do segmento. Vão para a coluna details do agendamento.
    let details: Record<string, string> | null = null;
    if (info.segment === "oficina") {
      // Placa com pelo menos 7 caracteres (ABC1D23 ou ABC1234), sem contar hífen ou espaço.
      if (plate.replace(/[^a-zA-Z0-9]/g, "").length < 7) return setError("Informe a placa do veículo.");
      if (vehicle.trim().length < 2) return setError("Informe o modelo do veículo.");
      details = { placa: plate.toUpperCase(), veiculo: vehicle.trim(), ano: vehicleYear.trim() };
    }
    if (info.segment === "advocacia") {
      if (!legalArea) return setError("Escolha a área do seu caso.");
      details = { area: legalArea };
    }

    startSubmit(async () => {
      const { data, error: rpcError } = await createClient().rpc("public_create_booking", {
        p_slug: slug,
        p_service_id: service.id,
        p_employee_id: chosenSlot.slot_employee_id,
        p_starts_at: chosenSlot.slot_start,
        p_name: name.trim(),
        p_phone: phone,
        p_email: email.trim() || null,
        p_details: details,
      });
      if (rpcError) {
        // Se outra pessoa pegou o horário no meio do caminho, explica e pede outro.
        setError(
          rpcError.message.includes("indisponível")
            ? "Esse horário acabou de ser marcado. Escolha outro."
            : rpcError.message,
        );
        if (date) setChosenSlot(null);
        return;
      }
      const result = data as { token: string; starts_at: string };
      setDone({ token: result.token, startsAt: result.starts_at });
    });
  }

  // Tela de confirmação: data por extenso e link para consultar ou cancelar.
  // ATENÇÃO: o token vai na URL, pode aparecer em histórico e logs de acesso.
  if (done) {
    const when = new Date(done.startsAt).toLocaleString("pt-BR", {
      weekday: "long",
      day: "2-digit",
      month: "long",
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "America/Sao_Paulo",
    });
    return (
      <div className="flex flex-col items-start gap-6 rounded-2xl border border-border bg-background p-8">
        <span className="flex h-12 w-12 items-center justify-center rounded-full bg-accent text-accent-foreground">
          <Check className="h-5 w-5" aria-hidden />
        </span>
        <div>
          <h2 className="font-display text-4xl tracking-tight">Agendamento confirmado</h2>
          <p className="mt-3 text-sm text-muted-foreground">
            {service?.name} · {when}
          </p>
        </div>
        <Link
          href={`/consulta?token=${done.token}`}
          className="inline-flex h-11 items-center rounded-full bg-accent px-6 text-sm font-medium text-accent-foreground transition-colors hover:bg-accent/90"
        >
          Ver ou cancelar meu agendamento
        </Link>
        <p className="text-xs text-muted-foreground">Guarde este link. Ele é o único jeito de consultar o agendamento sem login.</p>
      </div>
    );
  }

  // Passo atual, para destacar o título da etapa: 1 serviço, 2 dia, 3 horário, 4 dados.
  const step = !serviceId ? 1 : !date ? 2 : !chosenSlot ? 3 : 4;

  return (
    <div className="flex flex-col gap-10">
      {/* Passo 1: serviço. Escolher outro serviço zera as escolhas seguintes. */}
      <section className="flex flex-col gap-3">
        <StepLabel n={1} label="Serviço" active={step === 1} done={!!serviceId} />
        <div className="grid gap-3 md:grid-cols-2">
          {info.services.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => {
                setServiceId(item.id);
                setDate(null);
                setSlots(null);
                setChosenSlot(null);
              }}
              className={cn(
                "flex items-center justify-between rounded-2xl border p-5 text-left transition-all duration-300 hover:-translate-y-0.5 hover:border-accent/50",
                serviceId === item.id ? "border-accent bg-accent/5" : "border-border bg-background",
              )}
            >
              <span className="min-w-0">
                {item.category && <span className="block text-[11px] uppercase tracking-[0.16em] text-accent">{item.category}</span>}
                <span className="block font-medium">{item.name}</span>
                {item.description && <span className="mt-1 block text-sm text-muted-foreground">{item.description}</span>}
                <span className="mt-1 block text-xs text-muted-foreground">{item.duration_minutes} min</span>
              </span>
              <span className="text-sm tabular-nums">{formatPrice(item.price)}</span>
            </button>
          ))}
        </div>
      </section>

      {/* Passo 2: profissional e dia. Só aparece depois do serviço. */}
      {serviceId && (
        <section className="flex flex-col gap-3">
          <StepLabel n={2} label="Profissional e dia" active={step === 2} done={!!date} />
          <div className="flex flex-wrap gap-2">
            <Chip active={employeeId === "any"} onClick={() => pickEmployee("any")}>
              Qualquer um
            </Chip>
            {info.employees.map((emp) => (
              <Chip key={emp.id} active={employeeId === emp.id} onClick={() => pickEmployee(emp.id)}>
                {emp.display_name}
              </Chip>
            ))}
          </div>
          {/* Faixa horizontal com os próximos dias. Rola na horizontal no celular. */}
          <div className="flex gap-2 overflow-x-auto pb-2">
            {days.map((d) => {
              const value = isoDate(d);
              return (
                <Chip key={value} active={date === value} onClick={() => pickDate(value)}>
                  <span className="block text-[10px] uppercase tracking-wider opacity-70">
                    {d.toLocaleDateString("pt-BR", { weekday: "short", timeZone: "America/Sao_Paulo" })}
                  </span>
                  <span className="text-base tabular-nums">{d.toLocaleDateString("pt-BR", { day: "2-digit", timeZone: "America/Sao_Paulo" })}</span>
                </Chip>
              );
            })}
          </div>
        </section>
      )}

      {/* Passo 3: horário. Mostra carregamento, mensagem de dia vazio ou a grade de horários. */}
      {date && (
        <section className="flex flex-col gap-3">
          <StepLabel n={3} label="Horário" active={step === 3} done={!!chosenSlot} />
          {slots === null ? (
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" aria-hidden />
          ) : slots.length === 0 ? (
            <p className="text-sm text-muted-foreground">Sem horário livre neste dia. Escolha outra data.</p>
          ) : (
            <div className="grid grid-cols-3 gap-2 md:grid-cols-6">
              {slots.map((slot) => {
                const time = new Date(slot.slot_start).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit", timeZone: "America/Sao_Paulo" });
                // Marca como escolhido só se for o mesmo horário E o mesmo profissional.
                const selected = chosenSlot?.slot_start === slot.slot_start && chosenSlot?.slot_employee_id === slot.slot_employee_id;
                return (
                  <button
                    key={`${slot.slot_start}-${slot.slot_employee_id}`}
                    type="button"
                    onClick={() => setChosenSlot(slot)}
                    className={cn(
                      "flex flex-col items-center rounded-xl border px-3 py-3 text-sm tabular-nums transition-all duration-200 hover:border-accent/50",
                      selected ? "border-accent bg-accent text-accent-foreground" : "border-border bg-background",
                    )}
                  >
                    {time}
                    {/* Com "qualquer um", mostra o nome de quem atende naquele horário. */}
                    {employeeId === "any" && (
                      <span className={cn("mt-0.5 text-[10px]", selected ? "opacity-80" : "text-muted-foreground")}>
                        {employeeName(slot.slot_employee_id)}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </section>
      )}

      {/* Passo 4: dados do cliente e campos do segmento. */}
      {chosenSlot && (
        <section className="flex flex-col gap-4">
          <StepLabel n={4} label="Seus dados" active={step === 4} done={false} />
          <form onSubmit={confirm} className="grid gap-4 md:grid-cols-2">
            <Field label="Nome completo">
              <input value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" className={inputClass} />
            </Field>
            <Field label="Telefone / WhatsApp">
              <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="(11) 99999-0000" autoComplete="tel" className={inputClass} />
            </Field>
            <Field label="E-mail (opcional)">
              <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" autoComplete="email" className={inputClass} />
            </Field>
            {/* Campos da oficina: veículo. */}
            {info.segment === "oficina" && (
              <>
                <Field label="Placa do veículo">
                  <input value={plate} onChange={(e) => setPlate(e.target.value)} placeholder="ABC1D23" className={inputClass} />
                </Field>
                <Field label="Modelo">
                  <input value={vehicle} onChange={(e) => setVehicle(e.target.value)} placeholder="Gol 1.6" className={inputClass} />
                </Field>
                <Field label="Ano (opcional)">
                  <input value={vehicleYear} onChange={(e) => setVehicleYear(e.target.value)} placeholder="2016" className={inputClass} />
                </Field>
              </>
            )}
            {/* Campo da advocacia: área do caso. */}
            {info.segment === "advocacia" && (
              <Field label="Área do caso">
                <select value={legalArea} onChange={(e) => setLegalArea(e.target.value)} className={inputClass}>
                  <option value="">Escolha</option>
                  {LEGAL_AREAS.map((area) => (
                    <option key={area} value={area}>
                      {area}
                    </option>
                  ))}
                </select>
              </Field>
            )}
            <label className="flex items-start gap-3 text-sm text-muted-foreground md:col-span-2">
              <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} className="mt-1" />
              Concordo que a empresa use meu nome e telefone para este agendamento e os avisos dele.
            </label>
            {error && (
              <p role="alert" className="flex items-center gap-2 text-sm text-destructive md:col-span-2">
                <AlertCircle className="h-4 w-4" aria-hidden />
                {error}
              </p>
            )}
            <div className="flex flex-wrap items-center gap-3 md:col-span-2">
              <button
                type="submit"
                disabled={submitting}
                className="flex h-11 items-center gap-2 rounded-full bg-accent px-6 text-sm font-medium text-accent-foreground transition-colors hover:bg-accent/90 disabled:opacity-50"
              >
                {submitting && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
                Confirmar agendamento
              </button>
              <button type="button" onClick={() => setChosenSlot(null)} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
                <ArrowLeft className="h-4 w-4" aria-hidden />
                Trocar horário
              </button>
            </div>
          </form>
        </section>
      )}

      {/* Erro de carregamento de horários, quando não há horário escolhido. */}
      {!chosenSlot && error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}

// Classe comum aos campos deste fluxo.
const inputClass =
  "h-11 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground transition-colors focus:border-accent focus:outline-none";

// Campo com rótulo acima. Entrada: texto do rótulo e o campo. Saída: a caixa com rótulo.
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-2 text-sm">
      <span className="text-muted-foreground">{label}</span>
      {children}
    </label>
  );
}

// Botão tipo "chip" usado para profissional e dia. Entrada: se está ativo, ação e conteúdo.
function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex min-w-[64px] shrink-0 flex-col items-center rounded-xl border px-4 py-2 text-sm transition-all duration-200",
        active ? "border-accent bg-accent text-accent-foreground" : "border-border bg-background hover:border-accent/50",
      )}
    >
      {children}
    </button>
  );
}

// Título de cada passo, com número ou check quando concluído.
function StepLabel({ n, label, active, done }: { n: number; label: string; active: boolean; done: boolean }) {
  return (
    <p className={cn("flex items-center gap-2 text-xs uppercase tracking-[0.18em]", active || done ? "text-foreground" : "text-muted-foreground")}>
      <span className={cn("flex h-5 w-5 items-center justify-center rounded-full border text-[10px]", done ? "border-accent bg-accent text-accent-foreground" : "border-border")}>
        {done ? <Check className="h-3 w-3" aria-hidden /> : n}
      </span>
      {label}
    </p>
  );
}
