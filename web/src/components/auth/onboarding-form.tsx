"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { AlertCircle, Building2, Link2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/client";
import { toSlug } from "@/lib/slug";

export function OnboardingForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [slugTouched, setSlugTouched] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function handleNameChange(value: string) {
    setName(value);
    if (!slugTouched) setSlug(toSlug(value));
  }

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
              setSlug(toSlug(e.target.value));
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
