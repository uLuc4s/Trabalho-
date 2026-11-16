"use client";

import { useEffect, useState } from "react";
import { animate } from "framer-motion";

function parse(value: string) {
  const match = value.match(/-?[\d.]*\d(,\d+)?/);
  if (!match) return null;
  const numeric = Number(match[0].replace(/\./g, "").replace(",", "."));
  const start = value.indexOf(match[0]);
  const prefix = value.slice(0, start);
  const suffix = value.slice(start + match[0].length);
  const decimals = match[0].includes(",") ? 2 : 0;
  return { numeric, prefix, suffix, decimals };
}

export function CountUp({ value, className }: { value: string; className?: string }) {
  const parsed = parse(value);
  const [current, setCurrent] = useState(0);

  const target = parsed?.numeric ?? null;

  useEffect(() => {
    if (target === null) return;
    const controls = animate(0, target, {
      duration: 1.1,
      ease: [0.22, 1, 0.36, 1],
      onUpdate: (v) => setCurrent(v),
    });
    return () => controls.stop();
  }, [target]);

  if (!parsed) return <span className={className}>{value}</span>;

  const formatted = current.toLocaleString("pt-BR", {
    minimumFractionDigits: parsed.decimals,
    maximumFractionDigits: parsed.decimals,
  });

  return (
    <span className={className}>
      {parsed.prefix}
      {formatted}
      {parsed.suffix}
    </span>
  );
}
