import Link from "next/link";
import { ArrowRight, CalendarCheck } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Reveal } from "@/components/motion/reveal";
import { Copyright } from "./copyright";

const footerLinks = [
  { label: "Recursos", href: "#recursos" },
  { label: "Como funciona", href: "#como-funciona" },
  { label: "Segmentos", href: "#segmentos" },
  { label: "Perguntas", href: "#perguntas" },
];

export function CtaFooter() {
  return (
    <>
      <section className="px-6 py-24 md:px-12 lg:px-20">
        <Reveal className="mx-auto flex max-w-4xl flex-col items-center gap-6 overflow-hidden rounded-3xl bg-primary px-8 py-16 text-center text-primary-foreground">
          <h2 className="font-display text-4xl leading-tight tracking-tight md:text-5xl">
            Sua agenda <em className="italic">organizada</em> a partir de hoje
          </h2>
          <p className="max-w-xl font-body text-base leading-relaxed text-primary-foreground/75">
            Crie a conta, cadastre a sua empresa e compartilhe o link. O seu cliente já pode agendar.
          </p>
          <Link
            href="/cadastro"
            className={cn(
              buttonVariants(),
              "rounded-full bg-accent px-6 py-5 font-body text-sm font-medium text-accent-foreground hover:bg-accent/90",
            )}
          >
            Criar conta grátis
            <ArrowRight className="h-4 w-4" aria-hidden />
          </Link>
        </Reveal>
      </section>

      <footer className="border-t border-border px-6 py-10 md:px-12 lg:px-20">
        <div className="mx-auto flex max-w-6xl flex-col gap-8 md:flex-row md:items-center md:justify-between">
          <Link href="/" className="flex items-center gap-2 text-lg font-semibold tracking-tight">
            <CalendarCheck className="h-5 w-5 text-accent" aria-hidden />
            Agendfix
          </Link>

          <nav aria-label="Rodapé" className="flex flex-wrap items-center gap-6">
            {footerLinks.map((link) => (
              <a key={link.label} href={link.href} className="text-sm text-muted-foreground transition-colors hover:text-foreground">
                {link.label}
              </a>
            ))}
            <Link href="/login" className="text-sm text-muted-foreground transition-colors hover:text-foreground">
              Entrar
            </Link>
          </nav>

          <Copyright />
        </div>
      </footer>
    </>
  );
}
