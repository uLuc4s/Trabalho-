// Template: a cada troca de página, o conteúdo entra com um pequeno movimento de subida e fade.
// Diferente do layout, o template é recriado em cada navegação, por isso a animação roda de novo.
"use client";

import { motion } from "framer-motion"; // componente animado

// Entrada: a página atual (children).
// Saída: a mesma página, entrando com fade e subida de 8 pixels em 0,45 segundo.
export default function Template({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }} // começa invisível e 8 pixels abaixo
      animate={{ opacity: 1, y: 0 }} // termina visível e no lugar
      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }} // curva suave, a mesma do resto do site
    >
      {children}
    </motion.div>
  );
}
