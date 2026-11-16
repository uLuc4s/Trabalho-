// Link "voltar ao topo" com rolagem suave e seta que aparece ao passar o mouse.
// Se o usuário preferir menos movimento, pula direto ao topo.
// Roda no navegador porque controla a rolagem.
"use client";

import { useRef } from "react"; // guarda o id do quadro de animação em andamento
import { ArrowUp } from "lucide-react"; // ícone da seta

const DURATION = 1100; // duração da rolagem em milissegundos

// Curva de aceleração e desaceleração: começa devagar, acelera, freia no fim.
function easeInOutCubic(t: number) {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

// Entrada: conteúdo do link e classe opcional.
// Saída: link que rola até o topo com animação.
export function BackToTop({ children, className }: { children: React.ReactNode; className?: string }) {
  const frame = useRef<number | null>(null); // id do quadro atual, para poder cancelar

  // Intercepta o clique e rola sozinho, em vez de deixar o navegador pular.
  function scrollToTop(event: React.MouseEvent<HTMLAnchorElement>) {
    event.preventDefault();

    // Quem prefere menos movimento: vai direto, sem animação.
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      window.scrollTo(0, 0);
      return;
    }

    // Se já havia uma rolagem em andamento, cancela para não brigar com a nova.
    if (frame.current) cancelAnimationFrame(frame.current);

    const start = window.scrollY; // posição de onde parte
    const startTime = performance.now(); // momento do início

    // Um passo da animação, chamado a cada quadro do navegador.
    const step = (now: number) => {
      const progress = Math.min((now - startTime) / DURATION, 1); // de 0 a 1
      window.scrollTo(0, start * (1 - easeInOutCubic(progress))); // posição diminui até zero
      if (progress < 1) {
        frame.current = requestAnimationFrame(step); // continua no próximo quadro
      } else {
        frame.current = null; // terminou
      }
    };

    frame.current = requestAnimationFrame(step);
  }

  return (
    <a
      href="#topo" // âncora de fallback se o JavaScript não rodar
      aria-label="Voltar ao topo"
      onClick={scrollToTop}
      className={`group flex items-center gap-2 rounded-lg transition-transform duration-300 hover:scale-[1.03] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${className ?? ""}`}
    >
      {/* A seta começa escondida e sobe ao passar o mouse. */}
      <ArrowUp
        className="h-5 w-5 -translate-y-3 text-muted-foreground opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100"
        aria-hidden
      />
      {children}
    </a>
  );
}
