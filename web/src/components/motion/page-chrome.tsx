// Elementos fixos da página que reagem à rolagem: barra de progresso no topo e cabeçalho que ganha fundo.
// Roda no navegador porque observa a posição da rolagem.
"use client";

import { useState } from "react"; // estado do cabeçalho (rolado ou não)
import { motion, useMotionValueEvent, useScroll, useSpring } from "framer-motion"; // rolagem e animações

// Barra fina no topo que cresce conforme a página é rolada.
// Saída: uma linha de 2 pixels que enche da esquerda para a direita.
export function ScrollProgress() {
  const { scrollYProgress } = useScroll(); // progresso da rolagem, de 0 a 1
  // Suaviza o progresso para a barra não tremer.
  const scaleX = useSpring(scrollYProgress, { stiffness: 140, damping: 30, restDelta: 0.001 });

  return (
    <motion.div
      aria-hidden // decorativa, leitor de tela ignora
      style={{ scaleX }}
      className="fixed inset-x-0 top-0 z-[60] h-0.5 origin-left bg-accent"
    />
  );
}

// Cabeçalho fixo que ganha fundo translúcido e borda depois de 16 pixels de rolagem.
// Entrada: conteúdo do cabeçalho.
// Saída: o cabeçalho com a transição de fundo.
export function ScrollHeader({ children }: { children: React.ReactNode }) {
  const { scrollY } = useScroll(); // posição vertical da rolagem em pixels
  const [scrolled, setScrolled] = useState(false); // true depois de rolar um pouco

  // A cada mudança de posição, decide se já passou do limite de 16 pixels.
  useMotionValueEvent(scrollY, "change", (value) => {
    setScrolled(value > 16);
  });

  return (
    <motion.header
      animate={{
        backgroundColor: scrolled ? "rgba(255, 255, 255, 0.82)" : "rgba(255, 255, 255, 0)", // fundo some no topo
        borderBottomColor: scrolled ? "rgba(0, 0, 0, 0.06)" : "rgba(0, 0, 0, 0)", // borda aparece ao rolar
      }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      className="fixed inset-x-0 top-0 z-40 border-b backdrop-blur-md"
      // Desfoque do fundo, só quando rolado. WebkitBackdropFilter cobre navegadores mais antigos.
      style={{ WebkitBackdropFilter: scrolled ? "blur(12px)" : "blur(0px)" }}
    >
      {children}
    </motion.header>
  );
}
