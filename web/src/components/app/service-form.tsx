"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Loader2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/client";

export function ServiceForm({ companyId }: { companyId: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    const name = String(data.get("name") ?? "").trim();
    const duration = Number(data.get("duration"));
    const priceRaw = String(data.get("price") ?? "").replace(",", ".").trim();
    const price = priceRaw === "" ? null : Number(priceRaw);

    setError(null);
    if (name.length < 2) return setError("Informe o nome do serviço.");
    if (!Number.isInteger(duration) || duration <= 0) return setError("A duração precisa ser em minutos.");
    if (price !== null && (Number.isNaN(price) || price < 0)) return setError("Preço inválido.");

    startTransition(async () => {
      const supabase = createClient();
      const { error: insertError } = await supabase.from("services").insert({
        company_id: companyId,
        name,
        duration_minutes: duration,
        price,
      });
      if (insertError) {
        setError("Não foi possível salvar o serviço.");
        return;
      }
      form.reset();
      router.refresh();
    });
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-4 rounded-2xl border border-border bg-background p-6 md:grid-cols-[2fr_1fr_1fr_auto] md:items-end">
      <div className="flex flex-col gap-2">
        <Label htmlFor="service-name">Nome</Label>
        <Input id="service-name" name="name" placeholder="Corte masculino" />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="service-duration">Duração (min)</Label>
        <Input id="service-duration" name="duration" type="number" min={5} step={5} defaultValue={30} />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="service-price">Preço (opcional)</Label>
        <Input id="service-price" name="price" placeholder="45,00" />
      </div>
      <Button type="submit" disabled={pending} className="h-10 rounded-full bg-accent px-5 text-accent-foreground hover:bg-accent/90">
        {pending ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <Plus className="h-4 w-4" aria-hidden />}
        Adicionar
      </Button>
      {error && <p className="text-sm text-destructive md:col-span-4">{error}</p>}
    </form>
  );
}
