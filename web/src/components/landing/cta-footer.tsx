import Image from "next/image";
import Link from "next/link";
import { Reveal } from "@/components/motion/reveal";
import { Magnetic } from "@/components/motion/interactive";
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
      <section className="border-t border-border px-6 py-24 md:px-12 lg:px-20">
        <Reveal className="mx-auto flex max-w-6xl flex-col gap-8 md:flex-row md:items-end md:justify-between">
          <h2 className="max-w-lg font-display text-4xl leading-tight tracking-tight md:text-5xl">
            Crie a conta e mande o link para o seu cliente hoje
          </h2>
          <Magnetic>
            <Link
              href="/cadastro"
              className="inline-flex h-12 items-center justify-center rounded-full bg-accent px-7 font-body text-sm font-medium text-accent-foreground transition-colors hover:bg-accent/90"
            >
              Criar conta
            </Link>
          </Magnetic>
        </Reveal>
      </section>

      <footer className="border-t border-border px-6 py-10 md:px-12 lg:px-20">
        <div className="mx-auto flex max-w-6xl flex-col gap-8 md:flex-row md:items-center md:justify-between">
          <Link href="/" className="flex items-center">
            <Image src="/brand/agendfix-principal.svg" alt="agendfix" width={110} height={25} unoptimized />
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
