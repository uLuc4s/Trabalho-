import { Hammer, Scissors, Stethoscope, Wrench } from "lucide-react";
import { StaggerGroup, StaggerItem } from "@/components/motion/reveal";
import { SectionHeading } from "./section-heading";

const segments = [
  {
    icon: Scissors,
    name: "Barbearias e salões",
    text: "Horário a cada 30 minutos, vários profissionais e cancelamento pelo próprio link.",
  },
  {
    icon: Stethoscope,
    name: "Clínicas",
    text: "Agenda por profissional, bloqueio de horário e lista do dia para a recepção.",
  },
  {
    icon: Wrench,
    name: "Assistência técnica",
    text: "Visitas marcadas, ordem de serviço com responsável e histórico do atendimento.",
  },
  {
    icon: Hammer,
    name: "Instalação e manutenção",
    text: "Pedido de orçamento, visita técnica agendada e acompanhamento até o fim.",
  },
];

export function Segments() {
  return (
    <section id="segmentos" className="px-6 py-28 md:px-12 lg:px-20">
      <div className="mx-auto max-w-6xl">
        <SectionHeading
          eyebrow="Para quem é"
          title="Serve para quem marca horário"
          description="Cada empresa configura os próprios serviços e a forma de atender."
        />

        <StaggerGroup className="mt-14 grid gap-px overflow-hidden rounded-2xl border border-border bg-border md:grid-cols-2">
          {segments.map((segment) => (
            <StaggerItem
              key={segment.name}
              className="group flex gap-5 bg-background p-7 transition-colors hover:bg-secondary/40"
            >
              <segment.icon className="mt-0.5 h-5 w-5 shrink-0 text-muted-foreground transition-colors group-hover:text-accent" aria-hidden />
              <div>
                <h3 className="font-body text-base font-semibold text-foreground">{segment.name}</h3>
                <p className="mt-1.5 font-body text-sm leading-relaxed text-muted-foreground">{segment.text}</p>
              </div>
            </StaggerItem>
          ))}
        </StaggerGroup>
      </div>
    </section>
  );
}
