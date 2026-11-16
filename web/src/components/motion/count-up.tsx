// Contador animado: um número sobe de zero até o valor final, como um marcador.
// Aceita texto com prefixo e sufixo (ex.: "R$ 1.500,00" ou "12 atendimentos").
// Roda no navegador porque anima com o tempo.
"use client";

import { useEffect, useState } from "react"; // estado e efeito colateral
import { animate } from "framer-motion"; // animação de um número de A até B

// Quebra o texto em partes: o número, o que vem antes e o que vem depois.
// Entrada: texto, ex.: "R$ 1.500,00".
// Saída: número, prefixo, sufixo e casas decimais; null se não houver número.
function parse(value: string) {
  // Acha o primeiro trecho numérico (aceita sinal, ponto de milhar e vírgula decimal).
  const match = value.match(/-?[\d.]*\d(,\d+)?/);
  if (!match) return null;
  // Converte para número: tira os pontos de milhar e troca a vírgula por ponto.
  const numeric = Number(match[0].replace(/\./g, "").replace(",", "."));
  const start = value.indexOf(match[0]); // posição onde o número começa
  const prefix = value.slice(0, start); // texto antes do número
  const suffix = value.slice(start + match[0].length); // texto depois do número
  const decimals = match[0].includes(",") ? 2 : 0; // se tem vírgula, mostra 2 casas
  return { numeric, prefix, suffix, decimals };
}

// Entrada: texto com número, ex.: "R$ 1.500,00", e classe opcional.
// Saída: o número animado do zero até o valor, com o prefixo e o sufixo preservados.
export function CountUp({ value, className }: { value: string; className?: string }) {
  const parsed = parse(value);
  const [current, setCurrent] = useState(0); // valor exibido agora, muda a cada quadro

  const target = parsed?.numeric ?? null; // valor final da animação

  // Roda a animação sempre que o valor final muda. Para a animação ao sair da tela.
  useEffect(() => {
    if (target === null) return;
    const controls = animate(0, target, {
      duration: 1.1, // 1,1 segundo
      ease: [0.22, 1, 0.36, 1], // mesma curva das outras animações
      onUpdate: (v) => setCurrent(v), // cada quadro atualiza o número mostrado
    });
    return () => controls.stop();
  }, [target]);

  // Sem número reconhecível, mostra o texto original sem animação.
  if (!parsed) return <span className={className}>{value}</span>;

  // Formata o número atual no padrão brasileiro, com as mesmas casas decimais do original.
  const formatted = current.toLocaleString("pt-BR", {
    minimumFractionDigits: parsed.decimals,
    maximumFractionDigits: parsed.decimals,
  });

  return (
    <span className={className}>
      {parsed.prefix}
      {formatted}
      {parsed.suffix}
    </span>
  );
}
