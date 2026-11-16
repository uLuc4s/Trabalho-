// Formulário de cadastro: nome, e-mail e senha. Se o Supabase exigir confirmação de e-mail, mostra a tela "confira o e-mail".
// Roda no navegador porque tem estado, envio e chamada ao Supabase.
"use client";

import Link from "next/link"; // navegação interna
import { useRouter } from "next/navigation"; // navegação programática
import { useState } from "react"; // estado dos campos e da tela
import { AlertCircle, Loader2, Lock, Mail, User } from "lucide-react"; // ícones
import { Button } from "@/components/ui/button"; // botão padrão
import { Input } from "@/components/ui/input"; // campo padrão
import { Label } from "@/components/ui/label"; // rótulo padrão
import { createClient } from "@/lib/supabase/client"; // cliente do navegador

// Entrada: nada além do estado da tela.
// Saída: formulário de cadastro, ou a tela de confirmação de e-mail depois de enviar.
export function SignupForm() {
  const router = useRouter();
  const [fullName, setFullName] = useState(""); // nome do usuário
  const [email, setEmail] = useState(""); // e-mail
  const [password, setPassword] = useState(""); // senha
  const [error, setError] = useState<string | null>(null); // mensagem de erro
  const [loading, setLoading] = useState(false); // true enquanto envia
  const [checkEmail, setCheckEmail] = useState(false); // true quando falta confirmar o e-mail

  // Envia o cadastro ao Supabase.
  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    // Regra da senha: pelo menos 8 caracteres. Checa antes de chamar o servidor.
    if (password.length < 8) {
      setError("A senha precisa ter pelo menos 8 caracteres.");
      return;
    }

    setLoading(true);
    const supabase = createClient();
    const { data, error: authError } = await supabase.auth.signUp({
      email: email.trim().toLowerCase(),
      password,
      options: {
        data: { full_name: fullName.trim() }, // nome guardado no cadastro; o gatilho cria o perfil com ele
        emailRedirectTo: `${window.location.origin}/onboarding`, // link do e-mail leva para o onboarding
      },
    });

    // Traduz o erro do Supabase para uma frase clara. Qualquer outro erro vira mensagem genérica.
    if (authError) {
      setError(
        authError.message.includes("already registered")
          ? "Já existe uma conta com este e-mail."
          : "Não foi possível criar a conta. Tente novamente.",
      );
      setLoading(false);
      return;
    }

    // Se já veio sessão, o e-mail não precisa de confirmação: vai direto ao onboarding.
    if (data.session) {
      router.push("/onboarding");
      router.refresh();
      return;
    }

    // Sem sessão: o Supabase enviou um e-mail de confirmação.
    setCheckEmail(true);
    setLoading(false);
  }

  // Tela de espera: pede para abrir o link do e-mail.
  if (checkEmail) {
    return (
      <div className="flex flex-col gap-4">
        <p className="text-sm text-muted-foreground">
          Enviamos um link de confirmação para <span className="font-medium text-foreground">{email}</span>.
          Abra o link para criar a sua empresa.
        </p>
        <Link href="/login" className="text-center text-sm font-medium text-accent hover:underline">
          Já confirmei, quero entrar
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      {/* Nome do responsável. */}
      <div className="flex flex-col gap-2">
        <Label htmlFor="full-name">Seu nome</Label>
        <div className="relative">
          <User className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
          <Input
            id="full-name"
            autoComplete="name"
            required
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {/* E-mail, que vira o login. */}
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
            className="pl-9"
          />
        </div>
      </div>

      {/* Senha: mínimo de 8 caracteres, reforçado também pelo atributo minLength. */}
      <div className="flex flex-col gap-2">
        <Label htmlFor="password">Senha</Label>
        <div className="relative">
          <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
          <Input
            id="password"
            type="password"
            autoComplete="new-password"
            required
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="pl-9"
          />
        </div>
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
        Criar conta
      </Button>

      <p className="text-center text-sm text-muted-foreground">
        Já tem conta?{" "}
        <Link href="/login" className="font-medium text-accent hover:underline">
          Entrar
        </Link>
      </p>
    </form>
  );
}
