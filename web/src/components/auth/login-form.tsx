// Formulário de entrada: e-mail e senha. Ao entrar, leva para o caminho pedido (?next=) ou para o painel.
// Roda no navegador porque tem estado, envio e chamada ao Supabase.
"use client";

import Link from "next/link"; // navegação interna sem recarregar a página
import { useRouter, useSearchParams } from "next/navigation"; // navegação e leitura da URL
import { useState } from "react"; // estado dos campos e da tela
import { AlertCircle, Loader2, Lock, Mail } from "lucide-react"; // ícones
import { Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button"; // botão padrão
import { Input } from "@/components/ui/input"; // campo padrão
import { Label } from "@/components/ui/label"; // rótulo padrão
import { createClient } from "@/lib/supabase/client"; // cliente do navegador

// Entrada: nada além do estado da tela. Lê ?next= da URL, se houver.
// Saída: formulário de entrada com link para o cadastro.
export function LoginForm() {
  const router = useRouter();
  const next = useSearchParams().get("next"); // caminho para onde voltar depois do login
  const [email, setEmail] = useState(""); // valor do campo de e-mail
  const [password, setPassword] = useState(""); // valor do campo de senha
  const [error, setError] = useState<string | null>(null); // mensagem de erro
  const [loading, setLoading] = useState(false); // true enquanto tenta entrar
  const [showPassword, setShowPassword] = useState(false); // mostra ou esconde a senha

  // Envia o formulário: tenta entrar e redireciona.
  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); // não recarrega a página
    setError(null);
    setLoading(true);

    const supabase = createClient();
    const { error: authError } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(), // e-mail sem espaços e em minúsculo
      password,
    });

    // Mensagem genérica de propósito: não revela se o e-mail existe.
    if (authError) {
      setError("E-mail ou senha incorretos.");
      setLoading(false);
      return;
    }

    // Só aceita caminho interno que comece com / (evita mandar para site externo).
    const target = next && next.startsWith("/") && !next.startsWith("//") ? next : "/app";
    router.push(target);
    router.refresh(); // atualiza os dados do servidor com a nova sessão
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      {/* Campo de e-mail, com ícone de envelope dentro. */}
      <div className="flex flex-col gap-2">
        <Label htmlFor="email">E-mail</Label>
        <div className="relative">
          <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
          <Input
            id="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="pl-9" // espaço para o ícone
          />
        </div>
      </div>

      {/* Campo de senha, com ícone de cadeado dentro. */}
      <div className="flex flex-col gap-2">
        <Label htmlFor="password">Senha</Label>
        <div className="relative">
          <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
          <Input
            id="password"
            type={showPassword ? "text" : "password"}
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="pl-9 pr-10"
          />
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            aria-label={showPassword ? "Esconder senha" : "Mostrar senha"}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
          >
            {showPassword ? <EyeOff className="h-4 w-4" aria-hidden /> : <Eye className="h-4 w-4" aria-hidden />}
          </button>
        </div>
      </div>

      {/* Erro para leitores de tela (role="alert") e para quem vê. */}
      {error && (
        <p role="alert" className="flex items-center gap-2 text-sm text-destructive">
          <AlertCircle className="h-4 w-4" aria-hidden />
          {error}
        </p>
      )}

      <Button
        type="submit"
        disabled={loading} // evita enviar duas vezes
        className="h-11 rounded-full bg-accent text-accent-foreground hover:bg-accent/90"
      >
        {loading && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
        Entrar
      </Button>

      <p className="text-center text-sm text-muted-foreground">
        Ainda não tem conta?{" "}
        <Link href="/cadastro" className="font-medium text-accent hover:underline">
          Criar conta
        </Link>
      </p>
    </form>
  );
}
