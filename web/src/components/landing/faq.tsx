// Perguntas frequentes da landing, em sanfona. Cada pergunta abre e fecha com <details>, sem JavaScript.
import { ChevronDown } from "lucide-react"; // seta que gira ao abrir
import { Reveal } from "@/components/motion/reveal"; // entrada animada
import { SectionHeading } from "./section-heading"; // cabeçalho da seção

// Perguntas e respostas.
const questions = [
  {
    q: "O cliente precisa criar conta?",
    a: "Não. Ele escolhe o serviço, o profissional e o horário, e informa nome e telefone.",
  },
  {
    q: "E se dois clientes escolherem o mesmo horário?",
    a: "Só um confirma. A regra de conflito fica no banco de dados, não só na tela.",
  },
  {
    q: "Cada profissional vê a agenda de todo mundo?",
    a: "Não. Cada pessoa vê a própria agenda. O dono ou o administrador vê todas.",
  },
  {
    q: "Os dados de cada empresa ficam separados?",
    a: "Sim. Cada empresa acessa somente os próprios dados, e isso é garantido pelo banco.",
  },
  {
    q: "Preciso instalar alguma coisa?",
    a: "Não. O painel funciona no navegador, e a página de agendamento é um link que você compartilha.",
  },
  {
    q: "O cliente pode cancelar ou remarcar sozinho?",
    a: "Pode, pelo mesmo link que recebeu na confirmação. Você define até quantas horas antes isso é permitido.",
  },
  {
    q: "Consigo exportar meus dados?",
    a: "Sim. Clientes e atendimentos saem em planilha (CSV), e o relatório do mês sai em PDF.",
  },
  {
    q: "Como fica a exclusão de dados de um cliente?",
    a: "Quem administra pode apagar os dados de um cliente. Os horários futuros são cancelados e os dados pessoais saem do sistema.",
  },
];

// Monta a seção. Não recebe nada.
export function Faq() {
  return (
    <section id="perguntas" className="border-t border-border px-6 py-28 md:px-12 lg:px-20">
      <div className="mx-auto grid max-w-6xl gap-16 lg:grid-cols-[1fr_1.4fr] lg:gap-24">
        <SectionHeading
          eyebrow="Dúvidas"
          title="Perguntas frequentes"
          description="Se a sua não estiver aqui, a gente responde pelo e-mail de contato."
        />

        <div className="divide-y divide-border border-y border-border">
          {questions.map((item, index) => (
            <Reveal key={item.q} delay={index * 0.05}>
              {/* details/summary: abre e fecha nativamente. A seta gira com o estado "open" (group-open). */}
              <details className="group py-6">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-6 font-body text-base font-medium text-foreground">
                  {item.q}
                  <ChevronDown
                    className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-open:rotate-180"
                    aria-hidden
                  />
                </summary>
                <p className="mt-3 max-w-prose font-body text-sm leading-relaxed text-muted-foreground">{item.a}</p>
              </details>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
