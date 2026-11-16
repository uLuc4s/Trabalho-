"use client";

import { useRef } from "react";
import { ArrowUp } from "lucide-react";

const DURATION = 1100;

function easeInOutCubic(t: number) {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

export function BackToTop({ children, className }: { children: React.ReactNode; className?: string }) {
  const frame = useRef<number | null>(null);

  function scrollToTop(event: React.MouseEvent<HTMLAnchorElement>) {
    event.preventDefault();

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      window.scrollTo(0, 0);
      return;
    }

    if (frame.current) cancelAnimationFrame(frame.current);

    const start = window.scrollY;
    const startTime = performance.now();

    const step = (now: number) => {
      const progress = Math.min((now - startTime) / DURATION, 1);
      window.scrollTo(0, start * (1 - easeInOutCubic(progress)));
      if (progress < 1) {
        frame.current = requestAnimationFrame(step);
      } else {
        frame.current = null;
      }
    };

    frame.current = requestAnimationFrame(step);
  }

  return (
    <a
      href="#topo"
      aria-label="Voltar ao topo"
      onClick={scrollToTop}
      className={`group flex items-center gap-2 rounded-lg transition-transform duration-300 hover:scale-[1.03] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${className ?? ""}`}
    >
      <ArrowUp
        className="h-5 w-5 -translate-y-3 text-muted-foreground opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100"
        aria-hidden
      />
      {children}
    </a>
  );
}
