"use client";

// Tela de erro do painel: aparece quando uma página do /app falha de forma inesperada.
// Mostra uma mensagem simples e um botão para tentar de novo, sem expor detalhes técnicos.

import { useEffect } from "react"; // registra o erro no console do navegador
import { AlertCircle } from "lucide-react"; // ícone de alerta
import { Button } from "@/components/ui/button"; // botão padrão

// Entrada: o erro ocorrido e a função que tenta renderizar a página de novo.
// Saída: mensagem de erro com botão de tentar novamente.
export default function AppError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    // Detalhes técnicos vão só para o console, nunca para a tela.
    console.error(error);
  }, [error]);

  return (
    <div className="flex flex-col items-start gap-4 rounded-2xl border border-destructive/40 bg-background p-8">
      <span className="flex h-10 w-10 items-center justify-center rounded-full bg-destructive/10 text-destructive">
        <AlertCircle className="h-5 w-5" aria-hidden />
      </span>
      <div>
        <h2 className="font-display text-3xl tracking-tight">Algo não saiu como esperado</h2>
        <p className="mt-2 text-sm text-muted-foreground">Seus dados estão salvos. Tente carregar a página de novo.</p>
      </div>
      <Button type="button" onClick={reset} className="h-10 rounded-full bg-accent px-5 text-accent-foreground hover:bg-accent/90">
        Tentar de novo
      </Button>
    </div>
  );
}
