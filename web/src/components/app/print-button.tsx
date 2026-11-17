"use client";

// Botão que abre a janela de impressão do navegador, onde o usuário escolhe "Salvar como PDF".
// Entrada: nada. Saída: botão "Salvar em PDF".

// Entrada: nada. Saída: botão que chama a impressão do navegador.
export function PrintButton() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="rounded-full bg-neutral-900 px-5 py-2 text-xs font-medium text-white transition-opacity hover:opacity-90"
    >
      Salvar em PDF
    </button>
  );
}
