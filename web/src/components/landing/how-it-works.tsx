import { SectionHeading } from "./section-heading";
import { Reveal } from "@/components/motion/reveal";

const steps = [
  {
    title: "Cadastre a empresa",
    text: "Nome, endereço público e a lista de serviços com a duração de cada um.",
  },
  {
    title: "Coloque o link onde seu cliente já está",
    text: "Bio do Instagram, Google ou WhatsApp. O agendamento funciona sozinho.",
  },
  {
    title: "Acompanhe o dia no painel",
    text: "Agenda, equipe e tarefas. Cada atendimento cai na agenda de quem vai fazer.",
  },
];

export function HowItWorks() {
  return (
    <section id="como-funciona" className="border-y border-border bg-secondary/30 px-6 py-28 md:px-12 lg:px-20">
      <div className="mx-auto grid max-w-6xl gap-16 lg:grid-cols-[1fr_1.2fr] lg:gap-24">
        <SectionHeading
          eyebrow="Como funciona"
          title="Da conta ao primeiro agendamento"
          description="Não tem instalação nem treinamento. Dá para começar no mesmo dia."
        />

        <ol className="relative flex flex-col gap-10 border-l border-border pl-8">
          {steps.map((step, index) => (
            <Reveal key={step.title} delay={index * 0.08} className="relative">
              <li className="list-none">
                <span className="absolute -left-[41px] top-0 flex h-5 w-5 items-center justify-center rounded-full bg-background ring-1 ring-border">
                  <span className="h-2 w-2 rounded-full bg-accent" />
                </span>
                <p className="font-body text-xs font-medium tabular-nums text-muted-foreground">Passo {index + 1}</p>
                <h3 className="mt-2 font-body text-lg font-semibold text-foreground">{step.title}</h3>
                <p className="mt-2 max-w-md font-body text-sm leading-relaxed text-muted-foreground">{step.text}</p>
              </li>
            </Reveal>
          ))}
        </ol>
      </div>
    </section>
  );
}
