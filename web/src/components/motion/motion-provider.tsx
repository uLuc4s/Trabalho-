// Configuração global das animações: respeita a preferência de "reduzir movimento" do sistema operacional.
// Envolve a aplicação inteira no layout.
"use client";

import { MotionConfig } from "framer-motion";

// Entrada: conteúdo da aplicação.
// Saída: o mesmo conteúdo, com animações desligadas para quem pediu menos movimento no sistema.
export function MotionProvider({ children }: { children: React.ReactNode }) {
  return <MotionConfig reducedMotion="user">{children}</MotionConfig>;
}
