// Cabeçalho fixo da landing: logo que leva ao topo, links das seções, "Entrar", "Criar conta" e menu do celular.
// Os links usam âncoras (#recursos etc.) para rolar até cada seção.
import Image from "next/image"; // logo
import Link from "next/link"; // navegação interna
import { BackToTop } from "@/components/motion/back-to-top"; // logo que rola suavemente até o topo
import { buttonVariants } from "@/components/ui/button"; // classes do botão, para aplicar em um link
import { cn } from "@/lib/utils"; // junta classes CSS
import { ScrollHeader } from "@/components/motion/page-chrome"; // cabeçalho que ganha fundo ao rolar
import { Magnetic } from "@/components/motion/interactive"; // botão que segue levemente o cursor
import { MobileMenu } from "./mobile-menu"; // menu do celular

// Links de navegação interna da landing. Cada href aponta para o id de uma seção.
const links = [
  { label: "Recursos", href: "#recursos" },
  { label: "Como funciona", href: "#como-funciona" },
  { label: "Segmentos", href: "#segmentos" },
  { label: "Perguntas", href: "#perguntas" },
];

// Cabeçalho completo. Não recebe nada.
export function Navbar() {
  return (
    <ScrollHeader>
      <div className="flex items-center justify-between px-6 py-5 font-body md:px-12 lg:px-20">
      {/* Logo: clique rola para o topo, com animação. */}
      <BackToTop>
        <Image src="/brand/agendfix-principal.svg" alt="" width={180} height={40} priority unoptimized />
      </BackToTop>

      {/* Links de seção: só aparecem em telas médias ou maiores. No celular, ficam no menu. */}
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
        {/* "Entrar" some no celular muito pequeno (só aparece a partir de sm). */}
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
