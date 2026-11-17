// Edição de nome e telefone de um cliente, em linha. Telefone é normalizado do mesmo jeito do agendamento.
// Roda no navegador porque tem formulário e chamada ao banco. A RLS e as restrições do banco validam de novo.
"use client";

import { useRouter } from "next/navigation"; // atualiza a lista depois de salvar
import { useState, useTransition } from "react"; // estado e transição de envio
import { Loader2, Pencil } from "lucide-react"; // ícones
import { createClient } from "@/lib/supabase/client"; // cliente do navegador
import { useToast } from "@/components/ui/toast"; // aviso de sucesso ou erro

// Deixa o telefone só com dígitos e no formato +55..., igual ao agendamento público.
// Entrada: texto digitado. Saída: telefone normalizado, ou null se não tiver 10 a 13 dígitos.
function normalizePhone(raw: string): string | null {
  let digits = raw.replace(/\D/g, "");
  if (digits.length === 10 || digits.length === 11) digits = "55" + digits;
  if (digits.length < 12 || digits.length > 13) return null;
  return "+" + digits;
}

// Entrada: id, nome e telefone atuais do cliente.
// Saída: botão "Editar". Ao abrir, mostra os campos para corrigir e salvar.
export function EditCustomer({ customerId, name, phone }: { customerId: string; name: string; phone: string }) {
  const router = useRouter();
  const { notify } = useToast();
  const [editing, setEditing] = useState(false);
  const [draftName, setDraftName] = useState(name);
  const [draftPhone, setDraftPhone] = useState(phone);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  // Valida e grava. Nome com 2+ caracteres e telefone válido. Erro de telefone repetido vem do banco.
  function save() {
    setError(null);
    if (draftName.trim().length < 2) return setError("Informe o nome.");
    const normalized = normalizePhone(draftPhone);
    if (!normalized) return setError("Telefone inválido. Use DDD e número.");

    startTransition(async () => {
      const { error: updateError } = await createClient()
        .from("customers")
        .update({ name: draftName.trim(), phone: normalized })
        .eq("id", customerId);
      if (updateError) {
        const duplicate = updateError.code === "23505";
        setError(duplicate ? "Já existe um cliente com este telefone." : "Não foi possível salvar.");
        notify("Não foi possível salvar o cliente.", "error");
        return;
      }
      notify("Cliente atualizado");
      setEditing(false);
      router.refresh();
    });
  }

  if (!editing) {
    return (
      <button
        type="button"
        onClick={() => {
          setDraftName(name);
          setDraftPhone(phone);
          setError(null);
          setEditing(true);
        }}
        className="flex h-9 items-center gap-1.5 rounded-full border border-border px-3 text-xs text-muted-foreground transition-colors hover:text-foreground"
      >
        <Pencil className="h-3.5 w-3.5" aria-hidden />
        Editar
      </button>
    );
  }

  return (
    <div className="flex w-full flex-col gap-2 text-xs md:w-auto">
      <div className="flex flex-wrap gap-2">
        <input
          value={draftName}
          onChange={(e) => setDraftName(e.target.value)}
          aria-label="Nome do cliente"
          className="h-9 min-w-0 flex-1 rounded-md border border-input bg-background px-2 text-sm focus:border-accent focus:outline-none md:w-44"
        />
        <input
          value={draftPhone}
          onChange={(e) => setDraftPhone(e.target.value)}
          aria-label="Telefone do cliente"
          className="h-9 min-w-0 flex-1 rounded-md border border-input bg-background px-2 text-sm focus:border-accent focus:outline-none md:w-40"
        />
      </div>
      <div className="flex items-center gap-2">
        <button type="button" onClick={() => setEditing(false)} className="h-8 rounded-full px-3 text-muted-foreground hover:text-foreground">
          Cancelar
        </button>
        <button
          type="button"
          onClick={save}
          disabled={pending}
          className="flex h-8 items-center gap-1.5 rounded-full bg-accent px-3 font-medium text-accent-foreground disabled:opacity-50"
        >
          {pending && <Loader2 className="h-3 w-3 animate-spin" aria-hidden />}
          Salvar
        </button>
      </div>
      {error && <span className="text-destructive">{error}</span>}
    </div>
  );
}
