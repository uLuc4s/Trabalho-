"use client";

import { useState } from "react";
import { motion, useMotionValueEvent, useScroll, useSpring } from "framer-motion";

export function ScrollProgress() {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 140, damping: 30, restDelta: 0.001 });

  return (
    <motion.div
      aria-hidden
      style={{ scaleX }}
      className="fixed inset-x-0 top-0 z-[60] h-0.5 origin-left bg-accent"
    />
  );
}

export function ScrollHeader({ children }: { children: React.ReactNode }) {
  const { scrollY } = useScroll();
  const [scrolled, setScrolled] = useState(false);

  useMotionValueEvent(scrollY, "change", (value) => {
    setScrolled(value > 16);
  });

  return (
    <motion.header
      animate={{
        backgroundColor: scrolled ? "rgba(255, 255, 255, 0.82)" : "rgba(255, 255, 255, 0)",
        borderBottomColor: scrolled ? "rgba(0, 0, 0, 0.06)" : "rgba(0, 0, 0, 0)",
      }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      className="fixed inset-x-0 top-0 z-40 border-b backdrop-blur-md"
      style={{ WebkitBackdropFilter: scrolled ? "blur(12px)" : "blur(0px)" }}
    >
      {children}
    </motion.header>
  );
}
