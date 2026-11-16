"use client";

// Aviso rápido no canto da tela: confirma que uma ação deu certo ou mostra o erro.
// Uso: const { notify } = useToast(); notify("Atendimento concluído");

import { createContext, useCallback, useContext, useState } from "react"; // contexto e estado global do aviso
import { CheckCircle2, AlertCircle } from "lucide-react"; // ícones de sucesso e erro

type Tone = "success" | "error";
type ToastItem = { id: number; message: string; tone: Tone };

const ToastContext = createContext<{ notify: (message: string, tone?: Tone) => void } | null>(null);

// Envolve o painel. Entrada: conteúdo. Saída: o conteúdo e a pilha de avisos no canto.
export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);

  // Adiciona um aviso e o remove sozinho depois de 3,5 segundos.
  const notify = useCallback((message: string, tone: Tone = "success") => {
    const id = Date.now() + Math.random();
    setItems((current) => [...current, { id, message, tone }]);
    setTimeout(() => setItems((current) => current.filter((item) => item.id !== id)), 3500);
  }, []);

  return (
    <ToastContext.Provider value={{ notify }}>
      {children}
      {/* Região que os leitores de tela anunciam. */}
      <div aria-live="polite" className="pointer-events-none fixed bottom-6 right-6 z-[70] flex flex-col gap-2">
        {items.map((item) => (
          <div
            key={item.id}
            className="pointer-events-auto flex items-center gap-2 rounded-xl border border-border bg-background px-4 py-3 text-sm shadow-dashboard"
          >
            {item.tone === "success" ? (
              <CheckCircle2 className="h-4 w-4 text-accent" aria-hidden />
            ) : (
              <AlertCircle className="h-4 w-4 text-destructive" aria-hidden />
            )}
            {item.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

// Acesso ao aviso dentro de qualquer componente do painel.
export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast precisa estar dentro de ToastProvider");
  return ctx;
}
