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
    title: "Horário não se repete",
    text: "Quando dois clientes tentam o mesmo horário, só um confirma. A regra fica no banco.",
  },
  {
    icon: Link2,
    title: "Link na bio",
    text: "O cliente escolhe serviço, profissional e horário sem criar conta.",
  },
  {
    icon: Users,
    title: "Agenda de cada pessoa",
    text: "Cada profissional vê a própria agenda. Você vê todas juntas.",
  },
  {
    icon: RefreshCw,
    title: "Google Agenda",
    text: "Cada pessoa conecta a própria conta e o atendimento aparece na agenda dela.",
  },
  {
    icon: ClipboardList,
    title: "Ordem de serviço",
    text: "Visita, instalação ou manutenção com responsável, status e histórico.",
  },
  {
    icon: Kanban,
    title: "Tarefas do dia",
    text: "Quadro com colunas e checklist, para a equipe ver o que falta.",
  },
  {
    icon: BellRing,
    title: "Confirmação por e-mail",
    text: "O cliente recebe o horário confirmado e um arquivo para salvar na agenda.",
  },
];

export function Features() {
  return (
    <section id="recursos" className="px-6 py-28 md:px-12 lg:px-20">
      <div className="mx-auto grid max-w-6xl gap-16 lg:grid-cols-[1fr_1.4fr] lg:gap-24">
        <div className="lg:sticky lg:top-24 lg:self-start">
          <SectionHeading
            eyebrow="Recursos"
            title="O que muda no seu dia"
            description="Menos mensagem perguntando horário, menos conflito na agenda e mais tempo para o atendimento."
          />
        </div>

        <StaggerGroup className="divide-y divide-border border-y border-border">
          {features.map((feature) => (
            <StaggerItem
              key={feature.title}
              className="group grid grid-cols-[2.5rem_1fr] gap-5 py-7 transition-colors hover:bg-secondary/40 md:px-4"
            >
              <feature.icon className="mt-1 h-5 w-5 text-accent transition-transform duration-300 group-hover:translate-x-0.5" aria-hidden />
              <div>
                <h3 className="font-body text-base font-semibold text-foreground">{feature.title}</h3>
                <p className="mt-1.5 font-body text-sm leading-relaxed text-muted-foreground">{feature.text}</p>
              </div>
            </StaggerItem>
          ))}
        </StaggerGroup>
      </div>
    </section>
  );
}
