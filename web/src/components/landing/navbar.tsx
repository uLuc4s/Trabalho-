import Link from "next/link";
import { CalendarCheck } from "lucide-react";
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
      <Link href="/" className="flex items-center gap-2 text-xl font-semibold tracking-tight text-foreground">
        <CalendarCheck className="h-5 w-5 text-accent" aria-hidden />
        Agendfix
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
