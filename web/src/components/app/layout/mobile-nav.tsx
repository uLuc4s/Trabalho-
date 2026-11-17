// Menu do celular: cabeçalho com logo e botão, e uma lista de itens que abre e fecha.
// Só aparece em telas pequenas (classe md:hidden). Roda no navegador porque abre e fecha.
"use client";

import Link from "next/link"; // navegação interna
import Image from "next/image"; // logo
import { usePathname, useRouter } from "next/navigation"; // caminho atual e navegação
import { useState } from "react"; // estado de aberto ou fechado
import { AnimatePresence, motion } from "framer-motion"; // animação de abrir e fechar
import { LogOut, Menu, X, type LucideIcon } from "lucide-react"; // ícones
import { createClient } from "@/lib/supabase/client"; // cliente do navegador, para sair
import { cn } from "@/lib/utils"; // junta classes CSS

// Entrada: lista de itens visíveis (já filtrada pelo modelo de negócio).
// Saída: cabeçalho fixo e, quando aberto, a lista de itens em tela cheia.
export function MobileNav({
  items,
}: {
  items: { href: string; label: string; icon: LucideIcon }[];
}) {
  const pathname = usePathname(); // caminho atual, para destacar o item ativo
  const router = useRouter();
  const [open, setOpen] = useState(false); // true quando a lista está aberta

  // Encerra a sessão e volta para o login.
  async function signOut() {
    await createClient().auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <div className="md:hidden">
      {/* Cabeçalho fixo com logo e botão de abrir e fechar. */}
      <header className="sticky top-0 z-40 flex items-center justify-between border-b border-border bg-background/90 px-5 py-3 backdrop-blur-md">
        <Link href="/app" aria-label="Início">
          <Image src="/brand/agendfix-principal.svg" alt="agendfix" width={130} height={29} unoptimized />
        </Link>
        <button
          type="button"
          onClick={() => setOpen((v) => !v)} // inverte aberto e fechado
          aria-label={open ? "Fechar menu" : "Abrir menu"}
          aria-expanded={open} // leitor de tela sabe se o menu está aberto
          className="flex h-10 w-10 items-center justify-center rounded-full border border-border bg-background"
        >
          {open ? <X className="h-4 w-4" aria-hidden /> : <Menu className="h-4 w-4" aria-hidden />}
        </button>
      </header>

      {/* Lista que aparece e some com animação. */}
      <AnimatePresence>
        {open && (
          <motion.nav
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            aria-label="Painel"
            className="fixed inset-x-0 top-[57px] bottom-0 z-30 flex flex-col gap-1 overflow-y-auto bg-background p-4"
          >
            {items.map((item, index) => {
              // Início só fica ativo na página exata; os outros também nas subpáginas.
              const active = item.href === "/app" ? pathname === "/app" : pathname.startsWith(item.href);
              return (
                // Cada item entra com um pequeno atraso em sequência.
                <motion.div key={item.href} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: index * 0.03 }}>
                  <Link
                    href={item.href}
                    onClick={() => setOpen(false)} // fecha o menu ao escolher um item
                    className={cn(
                      "flex items-center gap-3 rounded-xl px-4 py-3 text-base transition-colors",
                      active ? "bg-secondary font-medium" : "text-muted-foreground hover:bg-secondary/60 hover:text-foreground",
                    )}
                  >
                    <item.icon className="h-5 w-5" aria-hidden />
                    {item.label}
                  </Link>
                </motion.div>
              );
            })}
            <button type="button" onClick={signOut} className="mt-4 flex items-center gap-3 rounded-xl px-4 py-3 text-base text-muted-foreground hover:bg-secondary/60">
              <LogOut className="h-5 w-5" aria-hidden />
              Sair
            </button>
          </motion.nav>
        )}
      </AnimatePresence>
    </div>
  );
}
