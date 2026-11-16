import {
  BellRing,
  CalendarClock,
  ClipboardList,
  Kanban,
  Link2,
  RefreshCw,
  Users,
} from "lucide-react";
import { StaggerGroup, StaggerItem } from "@/components/motion/reveal";
import { SectionHeading } from "./section-heading";

const features = [
  {
    icon: CalendarClock,
    title: "Agenda que não repete horário",
    text: "O sistema bloqueia horários já ocupados, mesmo quando duas pessoas tentam marcar ao mesmo tempo.",
  },
  {
    icon: Link2,
    title: "Link para divulgar",
    text: "Seu cliente escolhe serviço, profissional e horário, sem criar conta. Cole o link na bio ou no WhatsApp.",
  },
  {
    icon: Users,
    title: "Agenda por profissional",
    text: "Cada pessoa da equipe tem a própria agenda. Você acompanha tudo em uma visão consolidada.",
  },
  {
    icon: RefreshCw,
    title: "Google Agenda",
    text: "Cada profissional conecta a própria conta e os atendimentos aparecem direto na agenda dele.",
  },
  {
    icon: ClipboardList,
    title: "Ordens de serviço",
    text: "Visitas, instalações e manutenções com responsável, status e histórico de cada etapa.",
  },
  {
    icon: Kanban,
    title: "Tarefas e checklist",
    text: "Um quadro Kanban para organizar a operação do dia e a equipe, com checklist em cada tarefa.",
  },
  {
    icon: BellRing,
    title: "Confirmações automáticas",
    text: "O cliente recebe a confirmação do horário por e-mail, com o arquivo para adicionar à agenda.",
  },
];

export function Features() {
  return (
    <section id="recursos" className="px-6 py-24 md:px-12 lg:px-20">
      <SectionHeading
        eyebrow="Recursos"
        title={
          <>
            Tudo para atender bem, <em className="italic">sem</em> planilha
          </>
        }
        description="Uma ferramenta só para agendamento, equipe e operação, pensada para quem atende no balcão e também em campo."
      />

      <StaggerGroup className="mx-auto mt-16 grid max-w-6xl gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {features.map((feature) => (
          <StaggerItem
            key={feature.title}
            className="group flex flex-col gap-4 rounded-2xl border border-border bg-background p-6 transition-[box-shadow,transform,border-color] duration-300 hover:-translate-y-1 hover:border-accent/40 hover:shadow-dashboard"
          >
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-accent/10 text-accent transition-transform duration-300 group-hover:scale-110">
              <feature.icon className="h-5 w-5" aria-hidden />
            </div>
            <h3 className="font-body text-lg font-semibold tracking-tight text-foreground">{feature.title}</h3>
            <p className="font-body text-sm leading-relaxed text-muted-foreground">{feature.text}</p>
          </StaggerItem>
        ))}
      </StaggerGroup>
    </section>
  );
}
