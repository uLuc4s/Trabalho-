import Image from "next/image";
import Link from "next/link";
import { ArrowUp } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ScrollHeader } from "@/components/motion/page-chrome";
import { Magnetic } from "@/components/motion/interactive";
import { MobileMenu } from "./mobile-menu";

const links = [
  { label: "Recursos", href: "#recursos" },
  { label: "Como funciona", href: "#como-funciona" },
  { label: "Segmentos", href: "#segmentos" },
  { label: "Perguntas", href: "#perguntas" },
];

export function Navbar() {
  return (
    <ScrollHeader>
      <div className="flex items-center justify-between px-6 py-5 font-body md:px-12 lg:px-20">
      <a
        href="#topo"
        aria-label="Voltar ao topo"
        className="group flex items-center gap-2 rounded-lg transition-transform duration-300 hover:scale-[1.03] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <ArrowUp
          className="h-5 w-5 -translate-y-3 text-muted-foreground opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100"
          aria-hidden
        />
        <Image src="/brand/agendfix-principal.svg" alt="" width={180} height={40} priority unoptimized />
      </a>

      <nav aria-label="Principal" className="hidden items-center gap-8 md:flex">
        {links.map((link) => (
          <a
            key={link.label}
            href={link.href}
            className="relative py-1 text-sm text-muted-foreground transition-colors duration-300 hover:text-foreground after:absolute after:inset-x-0 after:-bottom-0.5 after:h-px after:origin-left after:scale-x-0 after:bg-foreground after:transition-transform after:duration-500 hover:after:scale-x-100"
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
        <Magnetic>
          <Link
            href="/cadastro"
            className={cn(
              buttonVariants(),
              "rounded-full bg-primary px-5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90",
            )}
          >
            Criar conta
          </Link>
        </Magnetic>
        <MobileMenu />
      </div>
      </div>
    </ScrollHeader>
  );
}
