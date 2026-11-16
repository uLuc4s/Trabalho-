"use client";

import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { AlertCircle, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

type Request = { status: string; service: string; company: string; preferred_window: string | null };

const STATUS: Record<string, string> = {
  new: "Recebido, aguardando análise",
  under_review: "Em análise",
  approved: "Aprovado, a empresa vai entrar em contato",
  rejected: "Não foi possível atender",
  expired: "Expirado",
  cancelled: "Cancelado",
};

function Pedido() {
  const token = useSearchParams().get("token") ?? "";
  const [data, setData] = useState<Request | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;
    let active = true;
    createClient()
      .rpc("public_get_service_request", { p_token: token })
      .then(({ data: result, error: rpcError }) => {
        if (!active) return;
        if (rpcError) return setError("Pedido não encontrado. Verifique o link.");
        setData(result as Request);
      });
    return () => {
      active = false;
    };
  }, [token]);

  if (!token) return <p className="text-sm text-destructive">Link incompleto.</p>;
  if (error) return <p role="alert" className="flex items-center gap-2 text-sm text-destructive"><AlertCircle className="h-4 w-4" aria-hidden />{error}</p>;
  if (!data) return <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" aria-hidden />;

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-muted-foreground">{data.company}</p>
      <h2 className="font-display text-3xl tracking-tight">{data.service}</h2>
      {data.preferred_window && <p className="text-sm">Preferência: {data.preferred_window}</p>}
      <span className="w-fit rounded-full bg-secondary px-3 py-1 text-xs">{STATUS[data.status] ?? data.status}</span>
    </div>
  );
}

export default function SolicitacaoPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-6 py-12">
      <div className="w-full max-w-md rounded-2xl border border-border p-8 shadow-dashboard">
        <h1 className="mb-6 font-display text-4xl tracking-tight">Meu pedido</h1>
        <Suspense fallback={null}>
          <Pedido />
        </Suspense>
      </div>
    </main>
  );
}
