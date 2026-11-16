"use client";

import { useRef } from "react";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";

const spring = { stiffness: 220, damping: 22, mass: 0.6 };

export function Magnetic({
  children,
  strength = 0.25,
  className,
}: {
  children: React.ReactNode;
  strength?: number;
  className?: string;
}) {
  const x = useSpring(0, spring);
  const y = useSpring(0, spring);

  function handleMove(event: React.PointerEvent<HTMLDivElement>) {
    const rect = event.currentTarget.getBoundingClientRect();
    x.set((event.clientX - (rect.left + rect.width / 2)) * strength);
    y.set((event.clientY - (rect.top + rect.height / 2)) * strength);
  }

  function handleLeave() {
    x.set(0);
    y.set(0);
  }

  return (
    <motion.div
      style={{ x, y }}
      onPointerMove={handleMove}
      onPointerLeave={handleLeave}
      whileTap={{ scale: 0.96 }}
      className={className ?? "inline-flex"}
    >
      {children}
    </motion.div>
  );
}

export function Tilt({
  children,
  max = 6,
  className,
}: {
  children: React.ReactNode;
  max?: number;
  className?: string;
}) {
  const rotateX = useSpring(0, spring);
  const rotateY = useSpring(0, spring);

  function handleMove(event: React.PointerEvent<HTMLDivElement>) {
    const rect = event.currentTarget.getBoundingClientRect();
    const px = (event.clientX - rect.left) / rect.width - 0.5;
    const py = (event.clientY - rect.top) / rect.height - 0.5;
    rotateY.set(px * max * 2);
    rotateX.set(-py * max * 2);
  }

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

export function Spotlight({
  children,
  className,
  color = "hsl(var(--accent) / 0.12)",
}: {
  children: React.ReactNode;
  className?: string;
  color?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const mx = useMotionValue(50);
  const my = useMotionValue(50);
  const background = useTransform(
    [mx, my],
    ([x, y]) => `radial-gradient(260px circle at ${x}% ${y}%, ${color}, transparent 70%)`,
  );

  function handleMove(event: React.PointerEvent<HTMLDivElement>) {
    const rect = ref.current?.getBoundingClientRect();
    if (!rect) return;
    mx.set(((event.clientX - rect.left) / rect.width) * 100);
    my.set(((event.clientY - rect.top) / rect.height) * 100);
  }

  return (
    <div ref={ref} onPointerMove={handleMove} className={`group relative overflow-hidden ${className ?? ""}`}>
      <motion.div
        aria-hidden
        style={{ background }}
        className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100"
      />
      <div className="relative">{children}</div>
    </div>
  );
}
