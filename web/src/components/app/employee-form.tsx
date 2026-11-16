// Formulário para cadastrar um profissional (quem atende). Só pede o nome; serviços e horários vêm depois.
// Roda no navegador porque tem envio e chamada ao Supabase.
"use client";

import { useRouter } from "next/navigation"; // atualiza a lista depois de cadastrar
import { useState, useTransition } from "react"; // estado e transição de envio
import { Loader2, Plus } from "lucide-react"; // ícones
import { Button } from "@/components/ui/button"; // botão padrão
import { Input } from "@/components/ui/input"; // campo padrão
import { Label } from "@/components/ui/label"; // rótulo padrão
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/components/ui/toast"; // cliente do navegador

// Entrada: id da empresa.
// Saída: formulário de cadastro. Limpa o campo e atualiza a lista depois de salvar.
export function EmployeeForm({ companyId }: { companyId: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition(); // true enquanto grava
  const [error, setError] = useState<string | null>(null);
  const { notify } = useToast();

  // Valida o nome (2+ caracteres) e grava o profissional.
  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget; // guarda o formulário para limpar depois
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
      notify("Profissional cadastrado");
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
