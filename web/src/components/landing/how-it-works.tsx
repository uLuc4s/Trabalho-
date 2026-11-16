import { Building2, LayoutDashboard, Share2 } from "lucide-react";
import { SectionHeading } from "./section-heading";

const steps = [
  {
    icon: Building2,
    title: "Cadastre sua empresa",
    text: "Informe o nome, escolha o endereço público e cadastre os serviços e a duração de cada um.",
  },
  {
    icon: Share2,
    title: "Compartilhe o link",
    text: "Coloque o link na bio, no Google ou no WhatsApp. Seus clientes agendam sozinhos, a qualquer hora.",
  },
  {
    icon: LayoutDashboard,
    title: "Acompanhe o dia",
    text: "A agenda, a equipe e as tarefas ficam no painel. Cada atendimento aparece na agenda de quem vai executar.",
  },
];

export function HowItWorks() {
  return (
    <section id="como-funciona" className="bg-secondary/40 px-6 py-24 md:px-12 lg:px-20">
      <SectionHeading
        eyebrow="Como funciona"
        title={
          <>
            Três passos para <em className="italic">começar</em>
          </>
        }
        description="Você não precisa de instalação nem de treinamento longo. Em minutos a agenda já está pronta para receber clientes."
      />

      <ol className="mx-auto mt-16 grid max-w-5xl gap-6 md:grid-cols-3">
        {steps.map((step, index) => (
          <li key={step.title} className="flex flex-col gap-5 rounded-2xl bg-background p-8 shadow-dashboard">
            <div className="flex items-center justify-between">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-accent text-accent-foreground">
                <step.icon className="h-5 w-5" aria-hidden />
              </div>
              <span className="font-display text-3xl text-muted-foreground">0{index + 1}</span>
            </div>
            <h3 className="font-body text-lg font-semibold tracking-tight">{step.title}</h3>
            <p className="font-body text-sm leading-relaxed text-muted-foreground">{step.text}</p>
          </li>
        ))}
      </ol>
    </section>
  );
}
