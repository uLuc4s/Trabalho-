// Página do convite: a pessoa convidada aceita o convite pelo link (?token=).
// Se não estiver logada, é mandada para o login e volta para cá depois.
"use client";

import Link from "next/link"; // navegação interna
import Image from "next/image"; // logo
import { useRouter, useSearchParams } from "next/navigation"; // lê a URL e navega
import { Suspense, useState, useTransition } from "react"; // estado e transição
import { AlertCircle, Loader2 } from "lucide-react"; // ícones
import { Button } from "@/components/ui/button"; // botão padrão
import { createClient } from "@/lib/supabase/client"; // cliente do navegador

// Botão de aceitar o convite. Precisa de Suspense porque lê os parâmetros da URL.
function AcceptInvite() {
  const router = useRouter();
  const params = useSearchParams();
  const token = params.get("token") ?? ""; // token do link, ou vazio
  const [pending, startTransition] = useTransition(); // true enquanto aceita
  const [error, setError] = useState<string | null>(null);

  // Aceita o convite. Se não houver login, manda para o login com retorno para esta página.
  function accept() {
    setError(null);
    startTransition(async () => {
      const supabase = createClient();
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) {
        router.push(`/login?next=${encodeURIComponent(`/convite?token=${token}`)}`);
        return;
      }
      const { error: rpcError } = await supabase.rpc("accept_invitation", { p_token: token });
      if (rpcError) {
        setError(rpcError.message); // ex.: convite expirado ou de outro e-mail
        return;
      }
      router.push("/app");
      router.refresh();
    });
  }

  return (
    <div className="flex flex-col gap-6">
      <p className="text-sm text-muted-foreground">
        Você foi convidado para uma empresa no Agendfix. Entre com o e-mail que recebeu o convite para aceitar.
      </p>
      {!token && <p className="text-sm text-destructive">Link incompleto. Peça um novo convite.</p>}
      {error && (
        <p role="alert" className="flex items-center gap-2 text-sm text-destructive">
          <AlertCircle className="h-4 w-4" aria-hidden />
          {error}
        </p>
      )}
      <Button
        type="button"
        onClick={accept}
        disabled={pending || !token}
        className="h-11 rounded-full bg-accent text-accent-foreground hover:bg-accent/90"
      >
        {pending && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
        Aceitar convite
      </Button>
      <Link href="/" className="text-center text-sm text-muted-foreground hover:text-foreground">
        Voltar para o início
      </Link>
    </div>
  );
}

// Página da rota: logo, título e o botão de aceitar.
export default function ConvitePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-background px-6 py-12">
      <Link href="/" className="mb-8">
        <Image src="/brand/agendfix-principal.svg" alt="agendfix" width={180} height={40} unoptimized />
      </Link>
      <div className="w-full max-w-md rounded-2xl border border-border p-8 shadow-dashboard">
        <h1 className="font-display text-4xl tracking-tight">Convite</h1>
        <div className="mt-6">
          <Suspense fallback={null}>
            <AcceptInvite />
          </Suspense>
        </div>
      </div>
    </main>
  );
}
