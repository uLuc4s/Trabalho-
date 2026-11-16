"use client";

import { useState } from "react";
import { motion } from "framer-motion";

export type Point = { label: string; value: number };

export function BarChart({ data, height = 180, color = "hsl(var(--accent))" }: { data: Point[]; height?: number; color?: string }) {
  const [hover, setHover] = useState<number | null>(null);
  const max = Math.max(1, ...data.map((d) => d.value));
  const barW = 100 / Math.max(1, data.length);

  return (
    <div className="relative w-full" style={{ height }}>
      <svg viewBox={`0 0 100 ${height}`} preserveAspectRatio="none" className="h-full w-full overflow-visible">
        {data.map((d, i) => {
          const h = (d.value / max) * (height - 22);
          const x = i * barW + barW * 0.18;
          return (
            <g key={d.label + i} onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)}>
              <rect x={i * barW} y={0} width={barW} height={height} fill="transparent" />
              <motion.rect
                x={x}
                width={barW * 0.64}
                rx={1}
                initial={{ y: height - 22, height: 0 }}
                animate={{ y: height - 22 - h, height: h }}
                transition={{ duration: 0.7, delay: i * 0.03, ease: [0.22, 1, 0.36, 1] }}
                fill={color}
                opacity={hover === null || hover === i ? 1 : 0.35}
              />
            </g>
          );
        })}
      </svg>
      <div className="pointer-events-none absolute inset-x-0 bottom-0 flex text-[10px] text-muted-foreground">
        {data.map((d, i) => (
          <span key={d.label + i} className="flex-1 truncate text-center">
            {i % Math.ceil(data.length / 7) === 0 ? d.label : ""}
          </span>
        ))}
      </div>
      {hover !== null && (
        <div
          className="pointer-events-none absolute -top-2 rounded-md bg-foreground px-2 py-1 text-[11px] text-background shadow-dashboard"
          style={{ left: `${(hover + 0.5) * barW}%`, transform: "translateX(-50%)" }}
        >
          {data[hover].label}: {data[hover].value}
        </div>
      )}
    </div>
  );
}

export function Donut({ data, size = 140 }: { data: Point[]; size?: number }) {
  const total = data.reduce((acc, d) => acc + d.value, 0);
  const palette = ["hsl(var(--accent))", "#0F172A", "#94A3B8", "#C7D2FE", "#64748B"];
  const r = 46;
  const circumference = 2 * Math.PI * r;
  let offset = 0;

  return (
    <div className="flex items-center gap-6">
      <svg viewBox="0 0 120 120" width={size} height={size} className="shrink-0 -rotate-90">
        <circle cx="60" cy="60" r={r} fill="none" stroke="hsl(var(--secondary))" strokeWidth="14" />
        {total > 0 &&
          data.map((d, i) => {
            const length = (d.value / total) * circumference;
            const segment = (
              <motion.circle
                key={d.label}
                cx="60"
                cy="60"
                r={r}
                fill="none"
                stroke={palette[i % palette.length]}
                strokeWidth="14"
                strokeDasharray={`${length} ${circumference - length}`}
                strokeDashoffset={-offset}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.6, delay: i * 0.08 }}
              />
            );
            offset += length;
            return segment;
          })}
      </svg>
      <ul className="flex flex-col gap-2 text-sm">
        {data.map((d, i) => (
          <li key={d.label} className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full" style={{ background: palette[i % palette.length] }} aria-hidden />
            <span className="text-muted-foreground">{d.label}</span>
            <span className="ml-auto pl-4 font-medium tabular-nums">{d.value}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
