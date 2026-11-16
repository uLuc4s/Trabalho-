"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Menu, X } from "lucide-react";

const links = [
  { label: "Recursos", href: "#recursos" },
  { label: "Como funciona", href: "#como-funciona" },
  { label: "Segmentos", href: "#segmentos" },
  { label: "Perguntas", href: "#perguntas" },
];

export function MobileMenu() {
  const [open, setOpen] = useState(false);

  return (
    <div className="md:hidden">
      <motion.button
        type="button"
        aria-label={open ? "Fechar menu" : "Abrir menu"}
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
        whileTap={{ scale: 0.92 }}
        className="flex h-10 w-10 items-center justify-center rounded-full border border-border bg-background"
      >
        <AnimatePresence mode="wait" initial={false}>
          <motion.span
            key={open ? "close" : "open"}
            initial={{ opacity: 0, rotate: -90 }}
            animate={{ opacity: 1, rotate: 0 }}
            exit={{ opacity: 0, rotate: 90 }}
            transition={{ duration: 0.2 }}
            className="flex"
          >
            {open ? <X className="h-4 w-4" aria-hidden /> : <Menu className="h-4 w-4" aria-hidden />}
          </motion.span>
        </AnimatePresence>
      </motion.button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="absolute left-0 right-0 top-full z-50 flex flex-col gap-1 border-b border-border bg-background/95 px-6 py-4 shadow-dashboard backdrop-blur-md"
          >
            {links.map((link, index) => (
              <motion.a
                key={link.label}
                href={link.href}
                onClick={() => setOpen(false)}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.04 * index, duration: 0.3 }}
                className="rounded-lg px-3 py-3 text-sm text-foreground transition-colors hover:bg-secondary"
              >
                {link.label}
              </motion.a>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
