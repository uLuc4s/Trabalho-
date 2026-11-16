// Formulário para criar a empresa: nome e endereço público. O endereço é sugerido pelo nome, até o usuário editar.
// Roda no navegador porque tem estado, digitação e chamada ao Supabase.
"use client";

import { useRouter } from "next/navigation"; // navegação após criar a empresa
import { useState } from "react"; // estado dos campos
import { AlertCircle, Building2, Link2, Loader2 } from "lucide-react"; // ícones
import { Button } from "@/components/ui/button"; // botão padrão
import { Input } from "@/components/ui/input"; // campo padrão
import { Label } from "@/components/ui/label"; // rótulo padrão
import { createClient } from "@/lib/supabase/client"; // cliente do navegador
import { toSlug } from "@/lib/slug"; // transforma o nome em endereço

// Entrada: nada além do estado da tela.
// Saída: formulário que cria a empresa e leva ao escolher o modelo.
export function OnboardingForm() {
  const router = useRouter();
  const [name, setName] = useState(""); // nome da empresa
  const [slug, setSlug] = useState(""); // endereço público
  const [slugTouched, setSlugTouched] = useState(false); // true quando o usuário editou o endereço à mão
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Atualiza o nome e, se o endereço ainda não foi editado, gera o endereço a partir do nome.
  function handleNameChange(value: string) {
    setName(value);
    if (!slugTouched) setSlug(toSlug(value));
  }

  // Cria a empresa pelo banco. Regra: endereço com pelo menos 3 caracteres.
  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (slug.length < 3) {
      setError("O endereço público precisa ter pelo menos 3 caracteres.");
      return;
    }

    setLoading(true);
    const supabase = createClient();
    const { error: rpcError } = await supabase.rpc("create_company", {
      p_name: name.trim(),
      p_slug: slug,
      p_timezone: "America/Sao_Paulo",
    });

    // Endereço repetido: o banco recusa com erro 23505 (chave única). Mostra mensagem clara.
    if (rpcError) {
      setError(
        rpcError.message.includes("companies_slug_key") || rpcError.code === "23505"
          ? "Este endereço já está em uso. Escolha outro."
          : "Não foi possível criar a empresa. Tente novamente.",
      );
      setLoading(false);
      return;
    }

    router.push("/onboarding/modelo");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      {/* Nome da empresa, com ícone de prédio. */}
      <div className="flex flex-col gap-2">
        <Label htmlFor="company-name">Nome da empresa</Label>
        <div className="relative">
          <Building2 className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
          <Input
            id="company-name"
            required
            value={name}
            onChange={(e) => handleNameChange(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {/* Endereço público. Ao digitar aqui, marca como editado e para de seguir o nome. */}
      <div className="flex flex-col gap-2">
        <Label htmlFor="company-slug">Endereço público</Label>
        <div className="relative">
          <Link2 className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
          <Input
            id="company-slug"
            required
            value={slug}
            onChange={(e) => {
              setSlugTouched(true);
              setSlug(toSlug(e.target.value)); // sempre limpa para o formato válido
            }}
            className="pl-9"
          />
        </div>
        <p className="text-xs text-muted-foreground">Seus clientes agendam em /e/{slug || "sua-empresa"}</p>
      </div>

      {error && (
        <p role="alert" className="flex items-center gap-2 text-sm text-destructive">
          <AlertCircle className="h-4 w-4" aria-hidden />
          {error}
        </p>
      )}

      <Button
        type="submit"
        disabled={loading}
        className="h-11 rounded-full bg-accent text-accent-foreground hover:bg-accent/90"
      >
        {loading && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
        Criar empresa
      </Button>
    </form>
  );
}
