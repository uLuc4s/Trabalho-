"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  CalendarDays,
  ClipboardList,
  Home,
  Inbox,
  LogOut,
  Scissors,
  Users,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

const items = [
  { href: "/app", label: "Início", icon: Home },
  { href: "/app/agenda", label: "Agenda", icon: CalendarDays },
  { href: "/app/solicitacoes", label: "Solicitações", icon: Inbox },
  { href: "/app/ordens", label: "Ordens de serviço", icon: ClipboardList },
  { href: "/app/servicos", label: "Serviços", icon: Scissors },
  { href: "/app/equipe", label: "Equipe", icon: Users },
];

export function AppSidebar({ companyName }: { companyName: string }) {
  const pathname = usePathname();
  const router = useRouter();

  async function signOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col gap-8 border-r border-border bg-background p-6 md:flex">
      <Link href="/app" className="flex items-center">
        <Image src="/brand/agendfix-principal.svg" alt="agendfix" width={150} height={33} priority unoptimized />
      </Link>

      <div>
        <p className="truncate text-xs uppercase tracking-[0.18em] text-muted-foreground">Empresa</p>
        <p className="mt-1 truncate font-body text-sm font-semibold">{companyName}</p>
      </div>

      <nav aria-label="Painel" className="flex flex-col gap-1">
        {items.map((item) => {
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
        className="mt-auto flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
      >
        <LogOut className="h-4 w-4" aria-hidden />
        Sair
      </button>
    </aside>
  );
}
