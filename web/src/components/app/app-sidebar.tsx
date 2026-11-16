// Menu lateral do painel (versão de computador). Mostra só os itens do modelo de negócio da empresa.
// Traz o botão de sair e o bloco com o link público da empresa, com cópia.
"use client";

import Link from "next/link"; // navegação interna
import Image from "next/image"; // logo
import { usePathname, useRouter } from "next/navigation"; // caminho atual e navegação
import { useState } from "react"; // estado do botão de copiar
import { motion } from "framer-motion"; // animação do destaque do item ativo
import {
  BarChart3,
  CalendarDays,
  Check,
  ClipboardList,
  Copy,
  Home,
  Inbox,
  LogOut,
  Scissors,
  ListTodo,
  Settings,
  Users,
  UserRound,
} from "lucide-react"; // ícones dos itens
import { createClient } from "@/lib/supabase/client"; // cliente do navegador, para sair
import { MobileNav } from "@/components/app/mobile-nav"; // menu do celular
import { cn } from "@/lib/utils"; // junta classes CSS

// Todos os itens do painel, na ordem em que aparecem.
const items = [
  { href: "/app", label: "Início", icon: Home },
  { href: "/app/agenda", label: "Agenda", icon: CalendarDays },
  { href: "/app/solicitacoes", label: "Solicitações", icon: Inbox },
  { href: "/app/ordens", label: "Ordens de serviço", icon: ClipboardList },
  { href: "/app/clientes", label: "Clientes", icon: UserRound },
  { href: "/app/servicos", label: "Serviços", icon: Scissors },
  { href: "/app/tarefas", label: "Tarefas", icon: ListTodo },
  { href: "/app/equipe", label: "Equipe", icon: Users },
  { href: "/app/relatorios", label: "Relatórios", icon: BarChart3 },
  { href: "/app/configuracoes", label: "Configurações", icon: Settings },
];

// Itens escondidos por modelo de negócio. Ex.: balcão não usa solicitações nem ordens de serviço.
const HIDDEN_BY_MODEL: Record<string, string[]> = {
  balcao: ["/app/solicitacoes", "/app/ordens"],
  campo: [],
  orcamento: [],
  recorrente: ["/app/ordens"],
};

// Botão que copia o link público da empresa para a área de transferência.
// Entrada: slug da empresa. Saída: botão que mostra "Link copiado" por 1,6 segundo.
function CopyLink({ slug }: { slug: string }) {
  const [copied, setCopied] = useState(false);

  // Copia o endereço completo, ex.: https://site/e/oficina-norte.
  async function copy() {
    try {
      await navigator.clipboard.writeText(`${window.location.origin}/e/${slug}`);
    } catch {
      return; // navegador recusou a área de transferência: não mostra "copiado"
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 1600); // volta ao texto normal depois de 1,6 s
  }

  return (
    <button
      type="button"
      onClick={copy}
      className="flex h-8 items-center justify-center gap-2 rounded-full bg-foreground text-xs font-medium text-background transition-opacity hover:opacity-90"
    >
      {copied ? <Check className="h-3.5 w-3.5" aria-hidden /> : <Copy className="h-3.5 w-3.5" aria-hidden />}
      {copied ? "Link copiado" : "Copiar link"}
    </button>
  );
}

// Entrada: nome da empresa, slug e modelo de negócio.
// Saída: menu lateral (computador) e o menu do celular.
export function AppSidebar({ companyName, slug, model }: { companyName: string; slug: string; model: string | null }) {
  const pathname = usePathname(); // caminho atual, para destacar o item ativo
  const router = useRouter();
  const hidden = HIDDEN_BY_MODEL[model ?? ""] ?? []; // itens que este modelo não usa
  const visibleItems = items.filter((item) => !hidden.includes(item.href));

  // Encerra a sessão e volta para o login.
  async function signOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <>
    {/* Menu do celular: aparece só em telas pequenas. */}
    <MobileNav items={visibleItems} />
    {/* Menu lateral: aparece só em telas médias ou maiores (hidden no celular). */}
    <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col gap-8 border-r border-border bg-background p-6 md:flex">
      <Link href="/app" className="flex items-center">
        <Image src="/brand/agendfix-principal.svg" alt="agendfix" width={150} height={33} priority unoptimized />
      </Link>

      <div>
        <p className="truncate text-xs uppercase tracking-[0.18em] text-muted-foreground">Empresa</p>
        <p className="mt-1 truncate font-body text-sm font-semibold">{companyName}</p>
      </div>

      {/* Busca global: leva para a página de busca com o termo digitado. */}
      <form action="/app/busca" className="relative">
        <input
          name="q"
          type="search"
          placeholder="Buscar cliente ou serviço"
          aria-label="Buscar cliente ou serviço"
          className="h-9 w-full rounded-lg border border-input bg-background px-3 text-sm focus:border-accent focus:outline-none"
        />
      </form>

      <nav aria-label="Painel" className="flex flex-col gap-1">
        {visibleItems.map((item) => {
          // Início só fica ativo na página exata; os outros ficam ativos em suas subpáginas também.
          const active = item.href === "/app" ? pathname === "/app" : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors duration-200",
                active ? "text-foreground" : "text-muted-foreground hover:bg-secondary hover:text-foreground",
              )}
            >
              {/* Fundo do item ativo: uma mesma camada que desliza entre os itens (layoutId). */}
              {active && (
                <motion.span
                  layoutId="sidebar-active"
                  className="absolute inset-0 rounded-lg bg-secondary"
                  transition={{ type: "spring", stiffness: 380, damping: 32 }}
                />
              )}
              <item.icon className="relative h-4 w-4" aria-hidden />
              <span className="relative">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <button
        type="button"
        onClick={signOut}
        className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
      >
        <LogOut className="h-4 w-4" aria-hidden />
        Sair
      </button>

      {/* Bloco com o link público da empresa, empurrado para o pé da barra. */}
      <div className="mt-auto flex flex-col gap-2 rounded-xl border border-border bg-secondary/50 p-4">
        <p className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">Sua página de agendamento</p>
        <p className="truncate text-xs text-foreground">/e/{slug}</p>
        <CopyLink slug={slug} />
      </div>
    </aside>
    </>
  );
}
