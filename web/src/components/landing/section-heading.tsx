export function SectionHeading({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: React.ReactNode;
  description: string;
}) {
  return (
    <div className="mx-auto max-w-2xl text-center">
      <p className="font-body text-sm font-medium uppercase tracking-wider text-accent">{eyebrow}</p>
      <h2 className="mt-3 font-display text-4xl leading-tight tracking-tight text-foreground md:text-5xl">
        {title}
      </h2>
      <p className="mt-4 font-body text-base leading-relaxed text-muted-foreground md:text-lg">{description}</p>
    </div>
  );
}
