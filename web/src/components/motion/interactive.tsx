// Efeitos interativos com o mouse: botão que segue o cursor, cartão que inclina e luz que acompanha o cursor.
// Roda no navegador porque depende de eventos do ponteiro.
"use client";

import { useRef } from "react"; // referência ao elemento DOM
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion"; // animações

// Configuração de mola: rigidez, amortecimento e massa. Dá a sensação de movimento natural.
const spring = { stiffness: 220, damping: 22, mass: 0.6 };

// Faz o conteúdo seguir levemente o cursor (efeito ímã), e encolhe ao clicar.
// Entrada: conteúdo, força do seguimento (0 a 1) e classe opcional.
// Saída: o conteúdo com o movimento aplicado.
export function Magnetic({
  children,
  strength = 0.25, // quanto do deslocamento do cursor é aplicado ao conteúdo
  className,
}: {
  children: React.ReactNode;
  strength?: number;
  className?: string;
}) {
  const x = useSpring(0, spring); // deslocamento horizontal animado
  const y = useSpring(0, spring); // deslocamento vertical animado

  // Calcula a distância do cursor ao centro do elemento e aplica a força.
  function handleMove(event: React.PointerEvent<HTMLDivElement>) {
    const rect = event.currentTarget.getBoundingClientRect();
    x.set((event.clientX - (rect.left + rect.width / 2)) * strength);
    y.set((event.clientY - (rect.top + rect.height / 2)) * strength);
  }

  // Ao sair do elemento, volta para o centro.
  function handleLeave() {
    x.set(0);
    y.set(0);
  }

  return (
    <motion.div
      style={{ x, y }}
      onPointerMove={handleMove}
      onPointerLeave={handleLeave}
      whileTap={{ scale: 0.96 }} // leve encolhimento ao clicar
      className={className ?? "inline-flex"}
    >
      {children}
    </motion.div>
  );
}

// Inclina o conteúdo em 3D conforme a posição do cursor.
// Entrada: conteúdo e inclinação máxima em graus.
// Saída: o conteúdo com efeito de profundidade.
export function Tilt({
  children,
  max = 6, // inclinação máxima em graus
  className,
}: {
  children: React.ReactNode;
  max?: number;
  className?: string;
}) {
  const rotateX = useSpring(0, spring); // rotação em torno do eixo horizontal
  const rotateY = useSpring(0, spring); // rotação em torno do eixo vertical

  // Converte a posição do cursor em -0.5 a 0.5 dentro do elemento e transforma em rotação.
  function handleMove(event: React.PointerEvent<HTMLDivElement>) {
    const rect = event.currentTarget.getBoundingClientRect();
    const px = (event.clientX - rect.left) / rect.width - 0.5;
    const py = (event.clientY - rect.top) / rect.height - 0.5;
    rotateY.set(px * max * 2);
    rotateX.set(-py * max * 2); // sinal invertido: sobe o cursor, o cartão inclina para trás
  }

  // Ao sair, volta reto.
  function handleLeave() {
    rotateX.set(0);
    rotateY.set(0);
  }

  return (
    <div style={{ perspective: 1200 }} onPointerMove={handleMove} onPointerLeave={handleLeave} className={className}>
      <motion.div style={{ rotateX, rotateY, transformStyle: "preserve-3d" }}>{children}</motion.div>
    </div>
  );
}

// Desenha um brilho radial que acompanha o cursor, visível só ao passar o mouse.
// Entrada: conteúdo, classe e cor do brilho.
// Saída: o conteúdo com o brilho por cima do fundo.
export function Spotlight({
  children,
  className,
  color = "hsl(var(--accent) / 0.12)", // cor do brilho, usa o tom de destaque com pouca opacidade
}: {
  children: React.ReactNode;
  className?: string;
  color?: string;
}) {
  const ref = useRef<HTMLDivElement>(null); // referência para medir o elemento
  const mx = useMotionValue(50); // posição horizontal do brilho, em porcentagem
  const my = useMotionValue(50); // posição vertical do brilho, em porcentagem
  // Monta o gradiente radial com a posição atual.
  const background = useTransform(
    [mx, my],
    ([x, y]) => `radial-gradient(260px circle at ${x}% ${y}%, ${color}, transparent 70%)`,
  );

  // Converte a posição do cursor em porcentagem do elemento.
  function handleMove(event: React.PointerEvent<HTMLDivElement>) {
    const rect = ref.current?.getBoundingClientRect();
    if (!rect) return;
    mx.set(((event.clientX - rect.left) / rect.width) * 100);
    my.set(((event.clientY - rect.top) / rect.height) * 100);
  }

  return (
    <div ref={ref} onPointerMove={handleMove} className="group relative overflow-hidden">
      {/* Camada do brilho: invisível até o mouse entrar no grupo. aria-hidden porque é só decorativa. */}
      <motion.div
        aria-hidden
        style={{ background }}
        className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100"
      />
      {/* O conteúdo fica por cima do brilho. A classe recebida vai aqui dentro, não no wrapper. */}
      <div className={`relative ${className ?? ""}`}>{children}</div>
    </div>
  );
}
