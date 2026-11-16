// Seção de recursos da landing: lista de benefícios com ícone, título e texto.
// Os itens entram em sequência ao rolar, e cada um tem o brilho que acompanha o cursor.
import {
  BellRing,
  CalendarClock,
  ClipboardList,
  Kanban,
  Link2,
  RefreshCw,
  Users,
} from "lucide-react"; // ícones de cada recurso
import { StaggerGroup, StaggerItem } from "@/components/motion/reveal"; // entrada em sequência
import { Spotlight } from "@/components/motion/interactive"; // brilho que segue o cursor
import { SectionHeading } from "./section-heading"; // cabeçalho da seção

// Lista de recursos apresentados ao visitante.
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
    title: "Remarcação pelo cliente",
    text: "Quem agendou remarca ou cancela pelo próprio link, dentro do prazo que você definir.",
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
    title: "Relatórios do mês",
    text: "Receita recebida, formas de pagamento, faltas e os serviços mais feitos, sem planilha.",
  },
];

// Monta a seção. Não recebe nada.
export function Features() {
  return (
    <section id="recursos" className="px-6 py-28 md:px-12 lg:px-20">
      <div className="mx-auto grid max-w-6xl gap-16 lg:grid-cols-[1fr_1.4fr] lg:gap-24">
        {/* Título fixo ao rolar, no computador. */}
        <div className="lg:sticky lg:top-24 lg:self-start">
          <SectionHeading
            eyebrow="Recursos"
            title="O que muda no seu dia"
            description="Menos mensagem perguntando horário, menos conflito na agenda e mais tempo para o atendimento."
          />
        </div>

        {/* Lista de recursos, com um fio separador entre cada um. */}
        <StaggerGroup className="divide-y divide-border border-y border-border">
          {features.map((feature) => (
            <StaggerItem key={feature.title}>
              <Spotlight className="grid grid-cols-[2.5rem_1fr] gap-5 py-7 md:px-4">
                <feature.icon className="mt-1 h-5 w-5 text-accent transition-transform duration-500 group-hover:translate-x-1" aria-hidden />
                <div>
                  <h3 className="font-body text-base font-semibold text-foreground">{feature.title}</h3>
                  <p className="mt-1.5 font-body text-sm leading-relaxed text-muted-foreground">{feature.text}</p>
                </div>
              </Spotlight>
            </StaggerItem>
          ))}
        </StaggerGroup>
      </div>
    </section>
  );
}
