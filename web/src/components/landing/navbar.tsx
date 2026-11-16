import Image from "next/image";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { MobileMenu } from "./mobile-menu";

const links = [
  { label: "Recursos", href: "#recursos" },
  { label: "Como funciona", href: "#como-funciona" },
  { label: "Segmentos", href: "#segmentos" },
  { label: "Perguntas", href: "#perguntas" },
];

export function Navbar() {
  return (
    <header className="relative z-40 flex items-center justify-between px-6 py-5 font-body md:px-12 lg:px-20">
      <Link
        href="/"
        aria-label="Voltar para o início"
        className="flex items-center rounded-lg transition-transform duration-300 hover:scale-[1.03] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <Image src="/brand/agendfix-principal.svg" alt="" width={180} height={40} priority unoptimized />
      </Link>

      <nav aria-label="Principal" className="hidden items-center gap-8 md:flex">
        {links.map((link) => (
          <a
            key={link.label}
            href={link.href}
            className="text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            {link.label}
          </a>
        ))}
      </nav>

      <div className="flex items-center gap-3">
        <Link
          href="/login"
          className="hidden text-sm text-muted-foreground transition-colors hover:text-foreground sm:inline-block"
        >
          Entrar
        </Link>
        <Link
          href="/cadastro"
          className={cn(
            buttonVariants(),
            "rounded-full bg-primary px-5 text-sm font-medium text-primary-foreground hover:bg-primary/90",
          )}
        >
          Criar conta
        </Link>
        <MobileMenu />
      </div>
    </header>
  );
}
