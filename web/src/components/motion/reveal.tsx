// Animações de entrada: elementos aparecem ao entrar na tela, e listas aparecem em sequência.
// Roda no navegador porque depende da posição de rolagem.
"use client";

import { motion } from "framer-motion"; // componente animado do framer

// Curva de aceleração suave, usada em todas as entradas para manter o mesmo ritmo.
const ease = [0.22, 1, 0.36, 1] as const;

// Faz um bloco subir e aparecer quando entra na tela. Só anima uma vez.
// Entrada: conteúdo, atraso em segundos, distância inicial vertical e classe.
// Saída: o conteúdo com a animação de entrada.
export function Reveal({
  children,
  delay = 0, // atraso antes de começar
  y = 24, // quantos pixels abaixo ele começa
  className,
}: {
  children: React.ReactNode;
  delay?: number;
  y?: number;
  className?: string;
}) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y }} // começa invisível e deslocado
      whileInView={{ opacity: 1, y: 0 }} // ao aparecer na tela, vai para o lugar
      viewport={{ once: true, amount: 0.2 }} // dispara quando 20% estiver visível, e só uma vez
      transition={{ duration: 0.7, delay, ease }}
    >
      {children}
    </motion.div>
  );
}

// Coordenação da lista: cada filho entra com um pequeno atraso em relação ao anterior.
const containerVariants = {
  hidden: {}, // estado inicial do grupo: nada a fazer
  show: { transition: { staggerChildren: 0.09, delayChildren: 0.05 } }, // 90 ms entre cada filho
};

// Animação de cada item do grupo: sobe e aparece.
const itemVariants = {
  hidden: { opacity: 0, y: 28 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6, ease } },
};

// Grupo de itens que entram em sequência.
// Entrada: itens, classe e a tag HTML (div, ol ou ul).
// Saída: o grupo animado.
export function StaggerGroup({
  children,
  className,
  as = "div", // tag HTML do grupo; ol e ul mantêm a semântica de lista
}: {
  children: React.ReactNode;
  className?: string;
  as?: "div" | "ol" | "ul";
}) {
  const Component = motion[as]; // escolhe o componente animado da tag pedida
  return (
    <Component
      className={className}
      variants={containerVariants}
      initial="hidden"
      whileInView="show" // quando o grupo aparece, anima os filhos em sequência
      viewport={{ once: true, amount: 0.15 }}
    >
      {children}
    </Component>
  );
}

// Item de um StaggerGroup. Precisa estar dentro de um grupo para herdar o atraso.
export function StaggerItem({
  children,
  className,
  as = "div", // tag HTML do item; li combina com ul e ol
}: {
  children: React.ReactNode;
  className?: string;
  as?: "div" | "li";
}) {
  const Component = motion[as];
  return (
    <Component className={className} variants={itemVariants}>
      {children}
    </Component>
  );
}
