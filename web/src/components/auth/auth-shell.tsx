import Image from "next/image";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Reveal } from "@/components/motion/reveal";

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
            "radial-gradient(60% 45% at 50% 0%, hsl(var(--accent) / 0.14) 0%, transparent 70%), radial-gradient(35% 30% at 90% 100%, hsl(var(--accent) / 0.08) 0%, transparent 70%)",
        }}
      />

      <Link
        href="/"
        className="group absolute left-6 top-6 z-10 flex items-center gap-2 rounded-full border border-border bg-background px-4 py-2 text-sm text-muted-foreground transition-colors hover:text-foreground md:left-12 md:top-8"
      >
        <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" aria-hidden />
        Voltar para o início
      </Link>

      <Reveal y={16} className="relative z-10 mb-8">
        <Link href="/" className="flex items-center">
          <Image src="/brand/agendfix-principal.svg" alt="agendfix" width={150} height={34} priority unoptimized />
        </Link>
      </Reveal>

      <Reveal delay={0.1} y={24} className="relative z-10 w-full max-w-md">
        <div className="rounded-2xl border border-border bg-background p-8 shadow-dashboard">
          <h1 className="font-display text-4xl leading-tight tracking-tight">{title}</h1>
          <p className="mt-2 text-sm text-muted-foreground">{description}</p>
          <div className="mt-6">{children}</div>
        </div>
      </Reveal>
    </main>
  );
}
