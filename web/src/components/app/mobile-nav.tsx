"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { LogOut, Menu, X, type LucideIcon } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

export function MobileNav({
  items,
}: {
  items: { href: string; label: string; icon: LucideIcon }[];
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);

  async function signOut() {
    await createClient().auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <div className="md:hidden">
      <header className="sticky top-0 z-40 flex items-center justify-between border-b border-border bg-background/90 px-5 py-3 backdrop-blur-md">
        <Link href="/app" aria-label="Início">
          <Image src="/brand/agendfix-principal.svg" alt="agendfix" width={130} height={29} unoptimized />
        </Link>
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-label={open ? "Fechar menu" : "Abrir menu"}
          aria-expanded={open}
          className="flex h-10 w-10 items-center justify-center rounded-full border border-border bg-background"
        >
          {open ? <X className="h-4 w-4" aria-hidden /> : <Menu className="h-4 w-4" aria-hidden />}
        </button>
      </header>

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
              const active = item.href === "/app" ? pathname === "/app" : pathname.startsWith(item.href);
              return (
                <motion.div key={item.href} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: index * 0.03 }}>
                  <Link
                    href={item.href}
                    onClick={() => setOpen(false)}
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
