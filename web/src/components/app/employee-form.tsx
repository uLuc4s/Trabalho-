"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Loader2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/client";

export function EmployeeForm({ companyId }: { companyId: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const name = String(new FormData(form).get("name") ?? "").trim();
    setError(null);
    if (name.length < 2) return setError("Informe o nome da pessoa.");

    startTransition(async () => {
      const supabase = createClient();
      const { error: insertError } = await supabase
        .from("employees")
        .insert({ company_id: companyId, display_name: name });
      if (insertError) {
        setError("Não foi possível cadastrar.");
        return;
      }
      form.reset();
      router.refresh();
    });
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-4 rounded-2xl border border-border bg-background p-6 md:grid-cols-[1fr_auto] md:items-end">
      <div className="flex flex-col gap-2">
        <Label htmlFor="employee-name">Nome de quem atende</Label>
        <Input id="employee-name" name="name" placeholder="Carlos" />
      </div>
      <Button type="submit" disabled={pending} className="h-10 rounded-full bg-accent px-5 text-accent-foreground hover:bg-accent/90">
        {pending ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <Plus className="h-4 w-4" aria-hidden />}
        Adicionar
      </Button>
      {error && <p className="text-sm text-destructive md:col-span-2">{error}</p>}
    </form>
  );
}
