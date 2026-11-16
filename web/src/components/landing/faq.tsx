import { ChevronDown } from "lucide-react";
import { SectionHeading } from "./section-heading";

const questions = [
  {
    q: "Meu cliente precisa criar conta para agendar?",
    a: "Não. Ele escolhe o serviço, o profissional e o horário e informa nome e telefone. Não existe cadastro nem aplicativo para instalar.",
  },
  {
    q: "Como a agenda evita horários repetidos?",
    a: "A regra de conflito fica no próprio banco de dados. Mesmo que duas pessoas tentem o mesmo horário ao mesmo tempo, só uma consegue confirmar.",
  },
  {
    q: "Cada profissional vê só a própria agenda?",
    a: "Sim. Cada pessoa vê a agenda dela, e o dono ou o administrador vê todas as agendas juntas.",
  },
  {
    q: "Meus dados e os dos meus clientes estão protegidos?",
    a: "Cada empresa acessa somente os próprios dados. Essa separação é aplicada pelo banco de dados, e não só pela tela.",
  },
];

export function Faq() {
  return (
    <section id="perguntas" className="bg-secondary/40 px-6 py-24 md:px-12 lg:px-20">
      <SectionHeading
        eyebrow="Perguntas frequentes"
        title={
          <>
            Antes de <em className="italic">começar</em>
          </>
        }
        description="As dúvidas mais comuns de quem está pensando em organizar a agenda."
      />

      <div className="mx-auto mt-12 flex max-w-3xl flex-col gap-3">
        {questions.map((item) => (
          <details
            key={item.q}
            className="group rounded-2xl border border-border bg-background p-6 open:shadow-dashboard"
          >
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-body text-base font-semibold text-foreground">
              {item.q}
              <ChevronDown
                className="h-5 w-5 shrink-0 text-muted-foreground transition-transform group-open:rotate-180"
                aria-hidden
              />
            </summary>
            <p className="mt-3 font-body text-sm leading-relaxed text-muted-foreground">{item.a}</p>
          </details>
        ))}
      </div>
    </section>
  );
}
