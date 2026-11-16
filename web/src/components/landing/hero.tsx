"use client";

import { motion } from "framer-motion";
import { Play, Sparkles } from "lucide-react";
import Link from "next/link";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { DashboardPreview } from "./dashboard-preview";

const fadeUp = (y: number, delay: number, duration: number) => ({
  initial: { opacity: 0, y },
  animate: { opacity: 1, y: 0 },
  transition: { duration, delay, ease: "easeOut" as const },
});

export function Hero() {
  return (
    <section className="relative flex flex-1 items-center justify-center overflow-hidden">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 z-0"
        style={{
          background:
            "radial-gradient(60% 50% at 50% 0%, hsl(var(--accent) / 0.14) 0%, transparent 70%), radial-gradient(40% 35% at 85% 20%, hsl(var(--accent) / 0.08) 0%, transparent 70%)",
        }}
      />

      <div className="relative z-10 flex w-full flex-col items-center px-6">
        <motion.div {...fadeUp(10, 0, 0.5)}>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background px-4 py-1.5 font-body text-sm text-muted-foreground">
            <Sparkles className="h-3.5 w-3.5 text-accent" aria-hidden />
            Agenda online para barbearias, clínicas e serviços em campo
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
            aria-label="Ver demonstração"
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
    </section>
  );
}
