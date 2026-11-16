"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Play, X } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { DashboardPreview } from "./dashboard-preview";

const fadeUp = (y: number, delay: number, duration: number) => ({
  initial: { opacity: 0, y },
  animate: { opacity: 1, y: 0 },
  transition: { duration, delay, ease: "easeOut" as const },
});

export function Hero() {
  const [demoOpen, setDemoOpen] = useState(false);

  useEffect(() => {
    if (!demoOpen) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setDemoOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [demoOpen]);

  return (
    <section className="relative flex flex-1 items-start justify-center pb-16 pt-28 md:pt-32">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 z-0 h-px bg-border"
      />

      <div className="relative z-10 flex w-full flex-col items-center px-6">
        <motion.div {...fadeUp(10, 0, 0.5)}>
          <span className="inline-flex items-center gap-2 rounded-full border border-border px-3.5 py-1 font-body text-xs text-muted-foreground">
            <span className="h-1.5 w-1.5 rounded-full bg-accent" aria-hidden />
            Para barbearias, clínicas e serviços em campo
          </span>
        </motion.div>

        <motion.h1
          {...fadeUp(16, 0.1, 0.6)}
          className="mt-6 max-w-xl text-center font-display text-5xl leading-[0.95] tracking-tight text-foreground md:text-6xl lg:text-[5rem]"
        >
          Agendar ficou simples. Gerenciar fica <em className="italic">inteligente</em>.
        </motion.h1>

        <motion.p
          {...fadeUp(16, 0.2, 0.6)}
          className="mt-4 max-w-[650px] text-center font-body text-base leading-relaxed text-muted-foreground md:text-lg"
        >
          Seus clientes escolhem o horário sem criar conta. Sua equipe organiza a agenda, as ordens de serviço e as tarefas em um só lugar.
        </motion.p>

        <motion.div {...fadeUp(16, 0.3, 0.6)} className="mt-5 flex items-center gap-3">
          <Link
            href="/cadastro"
            className={cn(
              buttonVariants(),
              "rounded-full bg-accent px-6 py-5 font-body text-sm font-medium text-accent-foreground hover:bg-accent/90",
            )}
          >
            Criar conta grátis
          </Link>
          <Button
            variant="ghost"
            aria-label="Ver demonstração do painel"
            onClick={() => setDemoOpen(true)}
            className="h-11 w-11 rounded-full border-0 bg-background shadow-[0_2px_12px_rgba(0,0,0,0.08)] hover:bg-background/80"
          >
            <Play className="h-4 w-4 fill-foreground text-foreground" aria-hidden />
          </Button>
        </motion.div>

        <motion.div {...fadeUp(30, 0.5, 0.8)} className="mt-8 flex w-full justify-center">
          <motion.div
            animate={{ y: [0, -8, 0] }}
            transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
            className="w-full max-w-5xl"
          >
            <DashboardPreview />
          </motion.div>
        </motion.div>
      </div>

      <AnimatePresence>
        {demoOpen && (
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label="Demonstração do painel"
            onClick={() => setDemoOpen(false)}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 p-4 backdrop-blur-sm"
          >
            <motion.div
              onClick={(event) => event.stopPropagation()}
              initial={{ opacity: 0, scale: 0.96, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 16 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              className="relative w-full max-w-5xl"
            >
              <button
                type="button"
                aria-label="Fechar demonstração"
                onClick={() => setDemoOpen(false)}
                className="absolute -top-12 right-0 flex h-10 w-10 items-center justify-center rounded-full bg-background shadow-dashboard transition-transform hover:scale-105"
              >
                <X className="h-4 w-4" aria-hidden />
              </button>
              <DashboardPreview />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
