// Cabeçalho padrão das seções da landing: pequeno rótulo, título grande e um parágrafo.
// Entra com a animação de aparecer ao rolar.
import { Reveal } from "@/components/motion/reveal"; // entrada animada

// Entrada: rótulo pequeno (eyebrow), título e descrição.
// Saída: bloco de cabeçalho da seção.
export function SectionHeading({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <Reveal className="max-w-md">
      <p className="font-body text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">{eyebrow}</p>
      <h2 className="mt-4 font-display text-4xl leading-tight tracking-tight text-foreground md:text-5xl">
        {title}
      </h2>
      <p className="mt-4 font-body text-base leading-relaxed text-muted-foreground">{description}</p>
    </Reveal>
  );
}
