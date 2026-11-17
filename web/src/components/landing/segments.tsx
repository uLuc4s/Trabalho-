// Seção de segmentos: os tipos de negócio atendidos, em uma grade de quatro cartões.
// Cada cartão entra em sequência e tem o brilho que segue o cursor.
import { Hammer, Scissors, Stethoscope, Wrench } from "lucide-react"; // ícones de cada segmento
import { StaggerGroup, StaggerItem } from "@/components/motion/reveal"; // entrada em sequência
import { Spotlight } from "@/components/motion/interactive"; // brilho que segue o cursor
import { SectionHeading } from "./section-heading"; // cabeçalho da seção

// Segmentos apresentados na landing. Não são os mesmos da escolha do onboarding (que tem mais opções).
const segments = [
  {
    icon: Scissors,
    name: "Barbearias e salões",
    text: "Horário a cada 30 minutos, vários profissionais e cancelamento pelo próprio link.",
  },
  {
    icon: Stethoscope,
    name: "Clínicas",
    text: "Agenda por profissional, lista do dia para a recepção e sigilo: a agenda não mostra o serviço nem o telefone.",
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

// Monta a seção. Não recebe nada.
export function Segments() {
  return (
    <section id="segmentos" className="px-6 py-28 md:px-12 lg:px-20">
      <div className="mx-auto max-w-6xl">
        <SectionHeading
          eyebrow="Para quem é"
          title="Serve para quem marca horário"
          description="Cada empresa configura os próprios serviços e a forma de atender."
        />

        {/* Grade de cartões. O fundo cinza da grade vira a linha entre eles (gap-px). */}
        <StaggerGroup className="mt-14 grid gap-px overflow-hidden rounded-2xl border border-border bg-border md:grid-cols-2">
          {segments.map((segment) => (
            <StaggerItem key={segment.name} className="bg-background">
              <Spotlight className="flex gap-5 p-7">
                <segment.icon className="mt-0.5 h-5 w-5 shrink-0 text-muted-foreground transition-colors duration-500 group-hover:text-accent" aria-hidden />
                <div>
                  <h3 className="font-body text-base font-semibold text-foreground">{segment.name}</h3>
                  <p className="mt-1.5 font-body text-sm leading-relaxed text-muted-foreground">{segment.text}</p>
                </div>
              </Spotlight>
            </StaggerItem>
          ))}
        </StaggerGroup>
      </div>
    </section>
  );
}
