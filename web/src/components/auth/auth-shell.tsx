import Link from "next/link";
import { CalendarCheck } from "lucide-react";

export function AuthShell({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-background px-6 py-12">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(60% 45% at 50% 0%, hsl(var(--accent) / 0.12) 0%, transparent 70%)",
        }}
      />

      <Link href="/" className="relative z-10 mb-8 flex items-center gap-2 text-xl font-semibold tracking-tight">
        <CalendarCheck className="h-5 w-5 text-accent" aria-hidden />
        Agendfix
      </Link>

      <div className="relative z-10 w-full max-w-md rounded-2xl border border-border bg-background p-8 shadow-dashboard">
        <h1 className="font-display text-4xl leading-tight tracking-tight">{title}</h1>
        <p className="mt-2 text-sm text-muted-foreground">{description}</p>
        <div className="mt-6">{children}</div>
      </div>
    </main>
  );
}
