// Enquanto uma página do painel carrega, mostra blocos cinza no formato do conteúdo (esqueleto).
// Evita a tela branca e dá sensação de rapidez.

// Entrada: nada. Saída: esqueleto de cabeçalho, cartões e lista.
export default function AppLoading() {
  return (
    <div className="flex animate-pulse flex-col gap-8" aria-busy="true" aria-label="Carregando">
      <div className="flex flex-col gap-3">
        <div className="h-3 w-24 rounded bg-secondary" />
        <div className="h-12 w-72 rounded bg-secondary" />
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }, (_, i) => (
          <div key={i} className="h-32 rounded-2xl border border-border bg-background" />
        ))}
      </div>
      <div className="flex flex-col gap-3 rounded-2xl border border-border bg-background p-6">
        {Array.from({ length: 5 }, (_, i) => (
          <div key={i} className="h-12 rounded-xl bg-secondary/60" />
        ))}
      </div>
    </div>
  );
}
