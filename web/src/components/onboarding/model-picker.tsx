"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Loader2, Repeat, Ruler, Scissors, Truck, type LucideIcon } from "lucide-react";
import { BUSINESS_MODELS } from "@/lib/business-models";
import { SEGMENTS, type Segment } from "@/lib/business-segments";
import type { BusinessModel } from "@/lib/company";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

const ICONS: Record<BusinessModel, LucideIcon> = {
  balcao: Scissors,
  campo: Truck,
  orcamento: Ruler,
  recorrente: Repeat,
};

export function ModelPicker({ companyId, hasServices }: { companyId: string; hasServices: boolean }) {
  const router = useRouter();
  const [selected, setSelected] = useState<BusinessModel | null>(null);
  const [segment, setSegment] = useState<Segment | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function confirm() {
    if (!selected) return;
    setError(null);
    startTransition(async () => {
      const supabase = createClient();
      const { error: updateError } = await supabase
        .from("companies")
        .update({ business_model: selected, segment })
        .eq("id", companyId);
      if (updateError) {
        setError("Não foi possível salvar. Tente de novo.");
        return;
      }

      if (!hasServices) {
        const segmentServices = SEGMENTS.find((s) => s.id === segment)?.services ?? [];
        const model = BUSINESS_MODELS.find((m) => m.id === selected);
        const examples = segmentServices.length > 0 ? segmentServices : (model?.services ?? []);
        if (examples.length > 0) {
          const { error: servicesError } = await supabase.from("services").insert(examples.map((s) => ({ ...s, company_id: companyId })));
          if (servicesError) {
            setError("Empresa configurada, mas os serviços de exemplo não foram criados. Cadastre-os em Serviços.");
          }
        }
      }

      router.push("/app");
      router.refresh();
    });
  }

  return (
    <div className="flex flex-col gap-8">
      <div className="grid gap-4 md:grid-cols-2">
        {BUSINESS_MODELS.map((model) => {
          const Icon = ICONS[model.id];
          const active = selected === model.id;
          return (
            <button
              key={model.id}
              type="button"
              onClick={() => setSelected(model.id)}
              aria-pressed={active}
              className={cn(
                "group flex flex-col gap-4 rounded-2xl border p-6 text-left transition-all duration-300 hover:-translate-y-0.5 hover:shadow-dashboard",
                active ? "border-accent bg-accent/5 shadow-dashboard" : "border-border bg-background",
              )}
            >
              <span
                className={cn(
                  "flex h-11 w-11 items-center justify-center rounded-xl transition-colors duration-300",
                  active ? "bg-accent text-accent-foreground" : "bg-secondary text-foreground",
                )}
              >
                <Icon className="h-5 w-5" aria-hidden />
              </span>
              <div>
                <p className="font-body text-lg font-semibold">{model.title}</p>
                <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{model.text}</p>
              </div>
              <p className="mt-auto text-xs text-muted-foreground">Ex.: {model.examples}</p>
            </button>
          );
        })}
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <div className="flex flex-col gap-3">
        <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Qual é o seu ramo?</p>
        <div className="flex flex-wrap gap-2">
          {SEGMENTS.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => setSegment(s.id)}
              aria-pressed={segment === s.id}
              className={cn(
                "rounded-full border px-4 py-2 text-sm transition-all duration-200",
                segment === s.id ? "border-accent bg-accent/10" : "border-border hover:bg-secondary",
              )}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex items-center justify-between gap-4">
        <p className="text-sm text-muted-foreground">Você pode trocar isso depois em Configurações.</p>
        <button
          type="button"
          onClick={confirm}
          disabled={!selected || !segment || pending}
          className="flex h-11 items-center gap-2 rounded-full bg-accent px-6 text-sm font-medium text-accent-foreground transition-colors hover:bg-accent/90 disabled:opacity-40"
        >
          {pending && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
          Continuar
        </button>
      </div>
    </div>
  );
}
