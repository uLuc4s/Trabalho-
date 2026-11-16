import { ChevronDown } from "lucide-react";
import { Reveal } from "@/components/motion/reveal";
import { SectionHeading } from "./section-heading";

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
];

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
