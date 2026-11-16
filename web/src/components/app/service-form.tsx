// Formulário para cadastrar um serviço: nome, categoria, descrição, duração e preço opcional.
// Lê os campos pelo FormData, valida no navegador e grava na tabela services.
"use client";

import { useRouter } from "next/navigation"; // atualiza a lista depois de gravar
import { useState, useTransition } from "react"; // estado e transição de envio
import { Loader2, Plus } from "lucide-react"; // ícones
import { Button } from "@/components/ui/button"; // botão padrão
import { Input } from "@/components/ui/input"; // campo padrão
import { Label } from "@/components/ui/label"; // rótulo padrão
import { createClient } from "@/lib/supabase/client"; // cliente do navegador
import { useToast } from "@/components/ui/toast";

// Entrada: id da empresa dona do serviço.
// Saída: formulário de cadastro. Limpa os campos e atualiza a lista depois de salvar.
export function ServiceForm({ companyId }: { companyId: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition(); // true enquanto grava
  const [error, setError] = useState<string | null>(null);
  const { notify } = useToast();

  // Valida os campos e grava. Regras: nome com 2+ caracteres, duração inteira positiva, preço não negativo.
  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget; // guarda o formulário para limpar depois
    const data = new FormData(form);
    const name = String(data.get("name") ?? "").trim();
    const category = String(data.get("category") ?? "").trim() || null; // vazio vira null
    const description = String(data.get("description") ?? "").trim() || null;
    const duration = Number(data.get("duration"));
    // Aceita vírgula como separador decimal. Campo vazio significa sem preço (sob consulta).
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
        category,
        description,
        duration_minutes: duration,
        price,
      });
      if (insertError) {
        setError("Não foi possível salvar o serviço.");
        return;
      }
      notify("Serviço cadastrado");
      form.reset(); // limpa os campos
      router.refresh(); // mostra o novo serviço na lista
    });
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-4 rounded-2xl border border-border bg-background p-6 md:grid-cols-[2fr_1fr_1fr_auto] md:items-end">
      <div className="flex flex-col gap-2">
        <Label htmlFor="service-name">Nome</Label>
        <Input id="service-name" name="name" placeholder="Corte masculino" />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="service-category">Categoria</Label>
        <Input id="service-category" name="category" placeholder="Cabelo, Barba, Instalação" />
      </div>
      {/* Descrição ocupa as três colunas de cima no computador. */}
      <div className="flex flex-col gap-2 md:col-span-3">
        <Label htmlFor="service-description">Descrição (o que está incluso)</Label>
        <Input id="service-description" name="description" placeholder="Corte na tesoura ou máquina, finalização com pomada" />
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
