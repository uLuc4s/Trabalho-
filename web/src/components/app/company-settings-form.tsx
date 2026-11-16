// Formulário de configurações da empresa: nome, contato, descrição, formas de pagamento e prazo de cancelamento.
// Salva tudo de uma vez na tabela companies. Só dono e admin chegam a ver este formulário.
// Roda no navegador porque tem estado e envio.
"use client";

import { useRouter } from "next/navigation"; // atualiza os dados da página depois de salvar
import { useState, useTransition } from "react"; // estado e transição de envio
import { Check, Loader2 } from "lucide-react"; // ícones
import { createClient } from "@/lib/supabase/client"; // cliente do navegador
import { cn } from "@/lib/utils"; // junta classes CSS

// Formas de pagamento que a empresa pode aceitar. Os mesmos três valores que o banco aceita.
const PAYMENTS = [
  { value: "pix", label: "Pix" },
  { value: "cartao", label: "Cartão" },
  { value: "dinheiro", label: "Dinheiro" },
] as const;

// Dados da empresa que este formulário edita.
type Settings = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  address: string | null;
  phone: string | null;
  payment_methods: string[];
  cancellation_hours: number;
};

// Classe comum aos campos de texto.
const inputClass =
  "h-11 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground transition-colors focus:border-accent focus:outline-none";

// Entrada: os dados atuais da empresa.
// Saída: formulário completo. Mostra "Salvo" depois de gravar com sucesso.
export function CompanySettingsForm({ company }: { company: Settings }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition(); // true enquanto salva
  const [saved, setSaved] = useState(false); // true depois de salvar, até editar de novo
  const [error, setError] = useState<string | null>(null);
  // Um estado por campo, já com o valor atual. Texto vazio no banco vira "" aqui.
  const [name, setName] = useState(company.name);
  const [description, setDescription] = useState(company.description ?? "");
  const [address, setAddress] = useState(company.address ?? "");
  const [phone, setPhone] = useState(company.phone ?? "");
  const [hours, setHours] = useState(String(company.cancellation_hours)); // mantido como texto enquanto digita
  const [payments, setPayments] = useState<string[]>(company.payment_methods);

  // Liga ou desliga uma forma de pagamento. Qualquer alteração apaga o "Salvo".
  function togglePayment(value: string) {
    setSaved(false);
    setPayments((current) => (current.includes(value) ? current.filter((p) => p !== value) : [...current, value]));
  }

  // Valida e salva. Regras: nome com 2+ caracteres, prazo entre 0 e 168 horas (uma semana), ao menos uma forma de pagamento.
  function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSaved(false);
    if (name.trim().length < 2) return setError("O nome da empresa é obrigatório.");
    const cancelHours = Number(hours);
    if (!Number.isInteger(cancelHours) || cancelHours < 0 || cancelHours > 168) {
      return setError("O prazo de cancelamento precisa estar entre 0 e 168 horas.");
    }
    if (payments.length === 0) return setError("Escolha ao menos uma forma de pagamento.");

    startTransition(async () => {
      // Campos opcionais vazios viram null, para não gravar texto em branco.
      const { error: updateError } = await createClient()
        .from("companies")
        .update({
          name: name.trim(),
          description: description.trim() || null,
          address: address.trim() || null,
          phone: phone.trim() || null,
          cancellation_hours: cancelHours,
          payment_methods: payments,
        })
        .eq("id", company.id);

      if (updateError) {
        setError("Não foi possível salvar. Tente novamente.");
        return;
      }
      setSaved(true);
      router.refresh(); // a página pública e o menu passam a usar os dados novos
    });
  }

  return (
    <form onSubmit={save} className="flex flex-col gap-8">
      {/* Bloco de identidade: nome, contato, endereço e descrição. */}
      <section className="grid gap-5 rounded-2xl border border-border bg-background p-6 md:grid-cols-2">
        <label className="flex flex-col gap-2 text-sm">
          <span className="text-muted-foreground">Nome da empresa</span>
          <input value={name} onChange={(e) => setName(e.target.value)} className={inputClass} />
        </label>
        <label className="flex flex-col gap-2 text-sm">
          <span className="text-muted-foreground">Telefone / WhatsApp</span>
          <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="(11) 99999-0000" className={inputClass} />
        </label>
        <label className="flex flex-col gap-2 text-sm md:col-span-2">
          <span className="text-muted-foreground">Endereço</span>
          <input value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Rua, número, bairro, cidade" className={inputClass} />
        </label>
        <label className="flex flex-col gap-2 text-sm md:col-span-2">
          <span className="text-muted-foreground">Sobre a empresa</span>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            maxLength={600} // limite também gravado no banco
            rows={4}
            placeholder="Conte para o cliente o que você faz e o que o diferencia."
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground focus:border-accent focus:outline-none"
          />
          <span className="text-right text-xs text-muted-foreground">{description.length}/600</span>
        </label>
      </section>

      {/* Formas de pagamento: botões que ligam e desligam. */}
      <section className="flex flex-col gap-4 rounded-2xl border border-border bg-background p-6">
        <div>
          <h2 className="font-body text-base font-semibold">Formas de pagamento</h2>
          <p className="mt-1 text-sm text-muted-foreground">Aparecem na página de agendamento para o cliente saber como pagar.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {PAYMENTS.map((method) => {
            const active = payments.includes(method.value);
            return (
              <button
                key={method.value}
                type="button"
                onClick={() => togglePayment(method.value)}
                aria-pressed={active} // leitor de tela sabe se está ligado
                className={cn(
                  "flex items-center gap-2 rounded-full border px-4 py-2 text-sm transition-all duration-200",
                  active ? "border-accent bg-accent/10 text-foreground" : "border-border text-muted-foreground hover:bg-secondary",
                )}
              >
                {active && <Check className="h-3.5 w-3.5 text-accent" aria-hidden />}
                {method.label}
              </button>
            );
          })}
        </div>
      </section>

      {/* Regras de atendimento: prazo de cancelamento e o endereço público (só leitura). */}
      <section className="grid gap-5 rounded-2xl border border-border bg-background p-6 md:grid-cols-2">
        <label className="flex flex-col gap-2 text-sm">
          <span className="text-muted-foreground">Cancelamento pelo cliente até (horas antes)</span>
          <input type="number" min={0} max={168} value={hours} onChange={(e) => setHours(e.target.value)} className={inputClass} />
        </label>
        <div className="flex flex-col gap-2 text-sm">
          <span className="text-muted-foreground">Endereço público</span>
          <p className="flex h-11 items-center rounded-md bg-secondary px-3 text-muted-foreground">/e/{company.slug}</p>
        </div>
      </section>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <div className="flex items-center gap-4">
        <button
          type="submit"
          disabled={pending}
          className="flex h-11 items-center gap-2 rounded-full bg-accent px-6 text-sm font-medium text-accent-foreground transition-colors hover:bg-accent/90 disabled:opacity-50"
        >
          {pending && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
          Salvar alterações
        </button>
        {saved && (
          <span className="flex items-center gap-1.5 text-sm text-muted-foreground transition-opacity">
            <Check className="h-4 w-4 text-accent" aria-hidden />
            Salvo
          </span>
        )}
      </div>
    </form>
  );
}
