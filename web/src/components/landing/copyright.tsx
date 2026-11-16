// Ano do direito autoral no rodapé. Mostra o ano só no navegador, para não divergir entre servidor e cliente.
"use client";

import { useSyncExternalStore } from "react"; // lê um valor externo sem causar diferença entre servidor e navegador

// Não há o que assinar: o ano não muda durante a visita.
const subscribe = () => () => {};

// Entrada: nada.
// Saída: "© 2026 Agendfix". No servidor, sai vazio e aparece o ano só no navegador.
export function Copyright() {
  const year = useSyncExternalStore(
    subscribe,
    () => new Date().getFullYear(), // valor no navegador
    () => null, // valor no servidor: sem ano, para não gerar página com data fixa
  );

  return <p className="text-sm text-muted-foreground">© {year ?? ""} Agendfix</p>;
}
