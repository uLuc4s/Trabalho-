"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { motion } from "framer-motion";
import {
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
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { MobileNav } from "@/components/app/mobile-nav";
import { cn } from "@/lib/utils";

const items = [
  { href: "/app", label: "Início", icon: Home },
  { href: "/app/agenda", label: "Agenda", icon: CalendarDays },
  { href: "/app/solicitacoes", label: "Solicitações", icon: Inbox },
  { href: "/app/ordens", label: "Ordens de serviço", icon: ClipboardList },
  { href: "/app/clientes", label: "Clientes", icon: UserRound },
  { href: "/app/servicos", label: "Serviços", icon: Scissors },
  { href: "/app/tarefas", label: "Tarefas", icon: ListTodo },
  { href: "/app/equipe", label: "Equipe", icon: Users },
  { href: "/app/configuracoes", label: "Configurações", icon: Settings },
];

const HIDDEN_BY_MODEL: Record<string, string[]> = {
  balcao: ["/app/solicitacoes", "/app/ordens"],
  campo: [],
  orcamento: [],
  recorrente: ["/app/ordens"],
};

function CopyLink({ slug }: { slug: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    await navigator.clipboard.writeText(`${window.location.origin}/e/${slug}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
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

export function AppSidebar({ companyName, slug, model }: { companyName: string; slug: string; model: string | null }) {
  const pathname = usePathname();
  const router = useRouter();
  const hidden = HIDDEN_BY_MODEL[model ?? ""] ?? [];
  const visibleItems = items.filter((item) => !hidden.includes(item.href));

  async function signOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <>
    <MobileNav items={visibleItems} />
    <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col gap-8 border-r border-border bg-background p-6 md:flex">
      <Link href="/app" className="flex items-center">
        <Image src="/brand/agendfix-principal.svg" alt="agendfix" width={150} height={33} priority unoptimized />
      </Link>

      <div>
        <p className="truncate text-xs uppercase tracking-[0.18em] text-muted-foreground">Empresa</p>
        <p className="mt-1 truncate font-body text-sm font-semibold">{companyName}</p>
      </div>

      <nav aria-label="Painel" className="flex flex-col gap-1">
        {visibleItems.map((item) => {
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

      <div className="mt-auto flex flex-col gap-2 rounded-xl border border-border bg-secondary/50 p-4">
        <p className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">Sua página de agendamento</p>
        <p className="truncate text-xs text-foreground">/e/{slug}</p>
        <CopyLink slug={slug} />
      </div>
    </aside>
    </>
  );
}
