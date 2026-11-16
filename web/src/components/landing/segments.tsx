import { Hammer, Scissors, Stethoscope, Wrench } from "lucide-react";
import { SectionHeading } from "./section-heading";

const segments = [
  {
    icon: Scissors,
    name: "Barbearias e salões",
    text: "Horários livres a cada 30 minutos, vários profissionais e clientes que cancelam pelo próprio link.",
  },
  {
    icon: Stethoscope,
    name: "Clínicas e consultórios",
    text: "Agenda por profissional, bloqueio de horários e confirmação antes do atendimento.",
  },
  {
    icon: Wrench,
    name: "Assistência técnica",
    text: "Visitas agendadas, ordem de serviço com responsável e histórico de cada atendimento.",
  },
  {
    icon: Hammer,
    name: "Instalação e manutenção",
    text: "Solicitações de orçamento, visita técnica marcada e acompanhamento do serviço até a conclusão.",
  },
];

export function Segments() {
  return (
    <section id="segmentos" className="px-6 py-24 md:px-12 lg:px-20">
      <SectionHeading
        eyebrow="Para quem é"
        title={
          <>
            Um sistema, <em className="italic">vários</em> tipos de negócio
          </>
        }
        description="Cada empresa configura os próprios serviços e a própria forma de atender. Não existe um sistema diferente para cada segmento."
      />

      <div className="mx-auto mt-16 grid max-w-6xl gap-4 md:grid-cols-2">
        {segments.map((segment) => (
          <div
            key={segment.name}
            className="flex items-start gap-5 rounded-2xl border border-border p-6 transition-colors hover:border-accent/40"
          >
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-secondary text-foreground">
              <segment.icon className="h-5 w-5" aria-hidden />
            </div>
            <div className="flex flex-col gap-2">
              <h3 className="font-body text-lg font-semibold tracking-tight">{segment.name}</h3>
              <p className="font-body text-sm leading-relaxed text-muted-foreground">{segment.text}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
