// Moldura das telas de acesso (entrar, cadastrar, criar empresa).
// No computador: painel de marca à esquerda com benefícios e o cartão do formulário à direita.
// No celular: o cartão ocupa a tela toda, com a logo no topo.
import Image from "next/image"; // logo (SVG, sem otimização)
import Link from "next/link"; // link interno
import { ArrowLeft, CalendarCheck, Clock3, Users } from "lucide-react"; // ícones
import { Reveal } from "@/components/motion/reveal"; // entrada animada

// Benefícios mostrados no painel da marca.
const BENEFITS = [
  { icon: CalendarCheck, title: "Agenda que não se repete", text: "Dois clientes não marcam o mesmo horário." },
  { icon: Clock3, title: "Seu cliente agenda sozinho", text: "Pelo seu link, sem criar conta." },
  { icon: Users, title: "Equipe organizada", text: "Cada pessoa vê a própria agenda." },
];

// Entrada: título, descrição e o formulário (children).
// Saída: a tela de acesso completa.
export function AuthShell({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <main className="relative grid min-h-screen bg-background lg:grid-cols-[1.05fr_1fr]">
      {/* Painel da marca: só no computador. */}
      <aside className="relative hidden overflow-hidden lg:flex lg:flex-col lg:justify-between lg:p-12">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(70% 55% at 20% 0%, hsl(var(--accent) / 0.22) 0%, transparent 70%), radial-gradient(60% 50% at 100% 100%, hsl(var(--accent) / 0.14) 0%, transparent 70%), linear-gradient(180deg, hsl(var(--secondary)) 0%, hsl(var(--background)) 100%)",
          }}
        />
        <div className="relative">
          <Link href="/" aria-label="Voltar para o início" className="inline-flex rounded-lg transition-transform hover:scale-[1.02]">
            <Image src="/brand/agendfix-principal.svg" alt="" width={180} height={40} priority unoptimized />
          </Link>
        </div>

        <Reveal className="relative max-w-md">
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">Para quem marca horário</p>
          <h2 className="mt-4 font-display text-5xl leading-[1.02] tracking-tight">
            Agendar ficou simples. <em className="italic">Gerenciar</em> também.
          </h2>
          <ul className="mt-10 flex flex-col gap-6">
            {BENEFITS.map((b) => (
              <li key={b.title} className="flex gap-4">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-background text-accent shadow-dashboard">
                  <b.icon className="h-5 w-5" aria-hidden />
                </span>
                <div>
                  <p className="font-body text-sm font-semibold">{b.title}</p>
                  <p className="mt-1 font-body text-sm text-muted-foreground">{b.text}</p>
                </div>
              </li>
            ))}
          </ul>
        </Reveal>

        <p className="relative text-xs text-muted-foreground">Agendfix · agenda online para o seu negócio</p>
      </aside>

      {/* Lado do formulário. */}
      <section className="relative flex min-h-screen flex-col items-center justify-center px-6 py-12 sm:px-10">
        <Link
          href="/"
          className="group absolute left-6 top-6 flex items-center gap-2 rounded-full border border-border bg-background px-4 py-2 text-sm text-muted-foreground transition-colors hover:text-foreground md:left-10 md:top-8"
        >
          <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" aria-hidden />
          Início
        </Link>

        <div className="mb-8 lg:hidden">
          <Image src="/brand/agendfix-principal.svg" alt="agendfix" width={160} height={36} priority unoptimized />
        </div>

        <Reveal delay={0.05} y={20} className="w-full max-w-md">
          <div className="rounded-3xl border border-border bg-background p-8 shadow-dashboard sm:p-10">
            <h1 className="font-display text-4xl leading-tight tracking-tight">{title}</h1>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{description}</p>
            <div className="mt-8">{children}</div>
          </div>
        </Reveal>
      </section>
    </main>
  );
}
