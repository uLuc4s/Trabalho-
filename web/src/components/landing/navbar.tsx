import Link from "next/link";
import { CalendarCheck } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";

const links = [
  { label: "Início", href: "#" },
  { label: "Planos", href: "#planos" },
  { label: "Sobre", href: "#sobre" },
  { label: "Contato", href: "#contato" },
];

export function Navbar() {
  return (
    <nav className="flex items-center justify-between px-6 py-5 font-body md:px-12 lg:px-20">
      <Link href="/" className="flex items-center gap-2 text-xl font-semibold tracking-tight text-foreground">
        <CalendarCheck className="h-5 w-5 text-accent" aria-hidden />
        Agendfix
      </Link>

      <div className="hidden items-center gap-8 md:flex">
        {links.map((link) => (
          <a
            key={link.label}
            href={link.href}
            className="text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            {link.label}
          </a>
        ))}
      </div>

      <Link
        href="/login"
        className={buttonVariants({
          className: "rounded-full bg-primary px-5 text-sm font-medium text-primary-foreground hover:bg-primary/90",
        })}
      >
        Entrar
      </Link>
    </nav>
  );
}
