// Seletor do onboarding: escolhe o modelo de negócio e o ramo, e cria os serviços de exemplo.
// Roda no navegador porque tem seleção, clique e chamada ao banco.
"use client";

import { useRouter } from "next/navigation"; // para ir ao painel depois de salvar
import { useState, useTransition } from "react"; // estado e transição de carregamento
import { Loader2, Repeat, Ruler, Scissors, Truck, type LucideIcon } from "lucide-react"; // ícones
import { BUSINESS_MODELS } from "@/lib/business-models"; // modelos e serviços de exemplo
import { SEGMENTS, type Segment } from "@/lib/business-segments"; // ramos e serviços de exemplo
import type { BusinessModel } from "@/lib/company"; // tipo do modelo
import { createClient } from "@/lib/supabase/client"; // cliente do navegador
import { cn } from "@/lib/utils"; // junta classes CSS

// Ícone de cada modelo. Liga o identificador ao componente de ícone.
const ICONS: Record<BusinessModel, LucideIcon> = {
  balcao: Scissors,
  campo: Truck,
  orcamento: Ruler,
  recorrente: Repeat,
};

// Entrada: id da empresa e se ela já tem serviços (se tiver, não cria exemplos).
// Saída: cartões de modelo, botões de ramo e o botão "Continuar".
export function ModelPicker({ companyId, hasServices }: { companyId: string; hasServices: boolean }) {
  const router = useRouter();
  const [selected, setSelected] = useState<BusinessModel | null>(null); // modelo escolhido
  const [segment, setSegment] = useState<Segment | null>(null); // ramo escolhido
  const [error, setError] = useState<string | null>(null);
  const [servicesFailed, setServicesFailed] = useState(false); // true quando os exemplos não foram criados
  const [pending, startTransition] = useTransition(); // true enquanto salva

  // Salva o modelo e o ramo, cria os serviços de exemplo se preciso e vai ao painel.
  // Regra: se a criação dos exemplos falhar, a tela fica aberta com o aviso (não redireciona).
  function confirm() {
    if (!selected) return;
    setError(null);
    startTransition(async () => {
      const supabase = createClient();
      // Grava o modelo e o ramo na empresa.
      const { error: updateError } = await supabase
        .from("companies")
        .update({ business_model: selected, segment })
        .eq("id", companyId);
      if (updateError) {
        setError("Não foi possível salvar. Tente de novo.");
        return;
      }

      // Só cria exemplos se a empresa ainda não tem serviços.
      if (!hasServices) {
        // Prefere os exemplos do ramo. Se o ramo não tiver, usa os do modelo.
        const segmentServices = SEGMENTS.find((s) => s.id === segment)?.services ?? [];
        const model = BUSINESS_MODELS.find((m) => m.id === selected);
        const examples = segmentServices.length > 0 ? segmentServices : (model?.services ?? []);
        if (examples.length > 0) {
          const { error: servicesError } = await supabase.from("services").insert(examples.map((s) => ({ ...s, company_id: companyId })));
          if (servicesError) {
            setError("Empresa configurada, mas os serviços de exemplo não foram criados.");
            setServicesFailed(true); // mostra o link para cadastrar manualmente
            return;
          }
        }
      }

      router.push("/app");
      router.refresh();
    });
  }

  return (
    <div className="flex flex-col gap-8">
      {/* Cartões dos modelos. O escolhido recebe destaque. */}
      <div className="grid gap-4 md:grid-cols-2">
        {BUSINESS_MODELS.map((model) => {
          const Icon = ICONS[model.id];
          const active = selected === model.id;
          return (
            <button
              key={model.id}
              type="button"
              onClick={() => setSelected(model.id)}
              aria-pressed={active} // leitor de tela sabe que está selecionado
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
      {/* Atalho para cadastrar os serviços à mão, quando os exemplos falham. */}
      {servicesFailed && (
        <button
          type="button"
          onClick={() => {
            router.push("/app/servicos");
            router.refresh();
          }}
          className="self-start text-sm font-medium text-accent underline underline-offset-4"
        >
          Cadastrar serviços agora
        </button>
      )}

      {/* Botões dos ramos de negócio. */}
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
        {/* Só libera quando há modelo e ramo escolhidos e nada está salvando. */}
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
