// Gera um convite para entrar na equipe. O token é criado no navegador, e só o hash SHA-256 vai para o banco.
// O link com o token é mostrado uma vez, para a equipe copiar e enviar.
// Roda no navegador porque gera o token, calcula o hash e chama o Supabase.
"use client";

import { useState, useTransition } from "react"; // estado e transição de envio
import { Check, Copy, Loader2, Send } from "lucide-react"; // ícones
import { Button } from "@/components/ui/button"; // botão padrão
import { Input } from "@/components/ui/input"; // campo padrão
import { Label } from "@/components/ui/label"; // rótulo padrão
import { createClient } from "@/lib/supabase/client"; // cliente do navegador

// Calcula o SHA-256 de um texto e devolve em hexadecimal.
// Entrada: texto. Saída: 64 caracteres hexadecimais. O banco guarda este valor, nunca o texto original.
async function sha256Hex(value: string) {
  const bytes = new TextEncoder().encode(value); // texto para bytes
  const digest = await crypto.subtle.digest("SHA-256", bytes); // hash
  return Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, "0")).join(""); // bytes para hexadecimal
}

// Cria um token aleatório de 48 caracteres hexadecimais (24 bytes), com gerador criptográfico.
function randomToken() {
  const bytes = crypto.getRandomValues(new Uint8Array(24));
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

// Entrada: id da empresa que convida.
// Saída: formulário de convite e, depois de gerar, o link para copiar.
export function InviteForm({ companyId }: { companyId: string }) {
  const [pending, startTransition] = useTransition(); // true enquanto gera
  const [error, setError] = useState<string | null>(null);
  const [link, setLink] = useState<string | null>(null); // link gerado, para mostrar e copiar
  const [copied, setCopied] = useState(false);

  // Gera o convite: valida o e-mail, cria o token, guarda o hash e monta o link.
  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const email = String(data.get("email") ?? "").trim().toLowerCase(); // o banco exige minúsculo
    const role = String(data.get("role") ?? "member");

    setError(null);
    setLink(null);
    if (!email.includes("@")) return setError("Informe um e-mail válido.");

    startTransition(async () => {
      const supabase = createClient();
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) return setError("Sua sessão expirou. Entre novamente.");

      const token = randomToken(); // segredo que vai só no link
      const tokenHash = await sha256Hex(token); // o que o banco guarda
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(); // válido por 7 dias

      const { error: insertError } = await supabase.from("invitations").insert({
        company_id: companyId,
        email,
        role,
        token_hash: tokenHash,
        expires_at: expiresAt,
        created_by: userData.user.id,
      });

      // Falha comum: já existe convite ativo para este e-mail nesta empresa.
      if (insertError) {
        setError("Não foi possível criar o convite. Verifique se o e-mail já tem um convite ativo.");
        return;
      }

      setLink(`${window.location.origin}/convite?token=${token}`);
    });
  }

  // Copia o link para a área de transferência e mostra "Copiado" por 1,8 segundo.
  async function copy() {
    if (!link) return;
    await navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  }

  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-border bg-background p-6">
      <form onSubmit={handleSubmit} className="grid gap-4 md:grid-cols-[2fr_1fr_auto] md:items-end">
        <div className="flex flex-col gap-2">
          <Label htmlFor="invite-email">E-mail da pessoa</Label>
          <Input id="invite-email" name="email" type="email" placeholder="pessoa@email.com" />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="invite-role">Acesso</Label>
          {/* Papéis que um convite pode dar. Dono não é convidado: só quem cria a empresa é dono. */}
          <select
            id="invite-role"
            name="role"
            defaultValue="member"
            className="h-10 rounded-md border border-input bg-background px-3 text-sm"
          >
            <option value="member">Equipe</option>
            <option value="admin">Administrador</option>
            <option value="viewer">Somente leitura</option>
          </select>
        </div>
        <Button type="submit" disabled={pending} className="h-10 rounded-full bg-accent px-5 text-accent-foreground hover:bg-accent/90">
          {pending ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <Send className="h-4 w-4" aria-hidden />}
          Gerar convite
        </Button>
      </form>

      {error && <p className="text-sm text-destructive">{error}</p>}

      {/* Link gerado: aparece uma vez, para copiar e enviar. Vale por 7 dias e só para o e-mail convidado. */}
      {link && (
        <div className="flex flex-col gap-2 rounded-xl bg-secondary/60 p-4">
          <p className="text-sm text-muted-foreground">Envie este link. Ele vale por 7 dias e só funciona para o e-mail convidado.</p>
          <div className="flex items-center gap-2">
            <code className="min-w-0 flex-1 truncate rounded-md bg-background px-3 py-2 text-xs">{link}</code>
            <button
              type="button"
              onClick={copy}
              className="flex h-9 shrink-0 items-center gap-1.5 rounded-full border border-border bg-background px-4 text-xs transition-colors hover:bg-secondary"
            >
              {copied ? <Check className="h-3.5 w-3.5" aria-hidden /> : <Copy className="h-3.5 w-3.5" aria-hidden />}
              {copied ? "Copiado" : "Copiar"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
