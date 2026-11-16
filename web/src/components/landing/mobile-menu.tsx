// Menu do celular da landing: botão com ícone que gira ao abrir, e uma lista de links de seção que desce.
// Só aparece em telas pequenas (md:hidden). Roda no navegador porque abre e fecha.
"use client";

import { useState } from "react"; // estado de aberto ou fechado
import { AnimatePresence, motion } from "framer-motion"; // animações de abrir, fechar e trocar ícone
import { Menu, X } from "lucide-react"; // ícones de abrir e fechar

// Links de seção, iguais aos do menu do computador.
const links = [
  { label: "Recursos", href: "#recursos" },
  { label: "Como funciona", href: "#como-funciona" },
  { label: "Segmentos", href: "#segmentos" },
  { label: "Perguntas", href: "#perguntas" },
];

// Botão de menu e lista de links. Não recebe nada.
export function MobileMenu() {
  const [open, setOpen] = useState(false); // true quando a lista está aberta

  return (
    <div className="md:hidden">
      {/* Botão que alterna entre o ícone de menu e o de fechar, com giro. */}
      <motion.button
        type="button"
        aria-label={open ? "Fechar menu" : "Abrir menu"}
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
        whileTap={{ scale: 0.92 }} // leve encolhimento ao tocar
        className="flex h-10 w-10 items-center justify-center rounded-full border border-border bg-background"
      >
        <AnimatePresence mode="wait" initial={false}>
          <motion.span
            key={open ? "close" : "open"} // a chave muda o ícone e dispara a animação
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

      {/* Lista de links que desce abaixo do cabeçalho. Cada link entra com um pequeno atraso. */}
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
                onClick={() => setOpen(false)} // fecha o menu ao escolher uma seção
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
