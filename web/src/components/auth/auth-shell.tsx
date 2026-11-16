// Moldura das telas de acesso (entrar, cadastrar, criar empresa): fundo com brilho, logo e cartão central.
// Usada por login, cadastro e onboarding para manter o mesmo visual.
import Image from "next/image"; // imagem otimizada do Next (aqui sem otimização, pois é SVG)
import Link from "next/link"; // link interno
import { ArrowLeft } from "lucide-react"; // seta de voltar
import { Reveal } from "@/components/motion/reveal"; // entrada animada

// Entrada: título, descrição curta e o conteúdo (o formulário).
// Saída: a tela inteira de acesso, com o formulário dentro do cartão.
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
    <main className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-background px-6 py-12">
      {/* Brilho de fundo decorativo, escondido de leitores de tela. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(60% 45% at 50% 0%, hsl(var(--accent) / 0.14) 0%, transparent 70%), radial-gradient(35% 30% at 90% 100%, hsl(var(--accent) / 0.08) 0%, transparent 70%)",
        }}
      />

      {/* Botão "Voltar para o início" no canto superior. */}
      <Link
        href="/"
        className="group absolute left-6 top-6 z-10 flex items-center gap-2 rounded-full border border-border bg-background px-4 py-2 text-sm text-muted-foreground transition-colors hover:text-foreground md:left-12 md:top-8"
      >
        <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" aria-hidden />
        Voltar para o início
      </Link>

      {/* Logo que também funciona como atalho de volta: a seta aparece ao passar o mouse. */}
      <Reveal y={16} className="relative z-10 mb-8">
        <Link
          href="/"
          aria-label="Voltar para o início"
          className="group flex items-center gap-2 rounded-lg transition-transform duration-300 hover:scale-[1.03] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <ArrowLeft
            className="h-5 w-5 -translate-x-3 text-muted-foreground opacity-0 transition-all duration-300 group-hover:translate-x-0 group-hover:opacity-100"
            aria-hidden
          />
          {/* alt vazio: a logo é decorativa, o link já tem aria-label. */}
          <Image src="/brand/agendfix-principal.svg" alt="" width={180} height={40} priority unoptimized />
        </Link>
      </Reveal>

      {/* Cartão central com título, descrição e o formulário. */}
      <Reveal delay={0.1} y={24} className="relative z-10 w-full max-w-md">
        <div className="rounded-2xl border border-border bg-background p-8 shadow-dashboard">
          <h1 className="font-display text-4xl leading-tight tracking-tight">{title}</h1>
          <p className="mt-2 text-sm text-muted-foreground">{description}</p>
          <div className="mt-6">{children}</div>
        </div>
      </Reveal>
    </main>
  );
}
