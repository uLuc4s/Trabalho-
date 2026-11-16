// Cartão padrão: um bloco com borda, fundo e espaçamento. Vem em partes: cabeçalho, título, descrição, conteúdo e rodapé.
// Uso: <Card><CardHeader><CardTitle>...</CardTitle></CardHeader><CardContent>...</CardContent></Card>.
import * as React from "react" // tipos de componentes React
import { cn } from "cn" // junta classes e resolve conflitos

// Cartão principal. size="sm" deixa o espaçamento menor.
// Entrada: className extra, size e as props de uma div.
// Saída: a div do cartão com borda e fundo.
function Card({
  className,
  size = "default", // "default" ou "sm", controla o espaçamento interno
  ...props
}: React.ComponentProps<"div"> & { size?: "default" | "sm" }) {
  return (
    <div
      data-slot="card" // marcador para estilos de grupo
      data-size={size} // lido pelas partes filhas para ajustar o espaçamento
      className={cn(
        // Base: coluna, borda sutil em anel, fundo, cantos arredondados e espaçamento por variável.
        "group/card flex flex-col gap-(--card-spacing) overflow-hidden rounded-xl bg-card py-(--card-spacing) text-sm text-card-foreground ring-1 ring-foreground/10 [--card-spacing:--spacing(4)] has-data-[slot=card-footer]:pb-0 has-[>img:first-child]:pt-0 data-[size=sm]:[--card-spacing:--spacing(3)] data-[size=sm]:has-data-[slot=card-footer]:pb-0 *:[img:first-child]:rounded-t-xl *:[img:last-child]:rounded-b-xl",
        className
      )}
      {...props}
    />
  )
}

// Topo do cartão. Pode ter título e ação na mesma linha.
function CardHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-header"
      className={cn(
        "group/card-header @container/card-header grid auto-rows-min items-start gap-1 rounded-t-xl px-(--card-spacing) has-data-[slot=card-action]:grid-cols-[1fr_auto] has-data-[slot=card-description]:grid-rows-[auto_auto] [.border-b]:pb-(--card-spacing)",
        className
      )}
      {...props}
    />
  )
}

// Título do cartão.
function CardTitle({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-title"
      className={cn(
        "text-base leading-snug font-medium group-data-[size=sm]/card:text-sm", // no tamanho pequeno, fonte menor
        className
      )}
      {...props}
    />
  )
}

// Texto de apoio abaixo do título, em cinza.
function CardDescription({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-description"
      className={cn("text-sm text-muted-foreground", className)}
      {...props}
    />
  )
}

// Ação no canto superior direito do cabeçalho (ex.: um botão).
function CardAction({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-action"
      className={cn(
        "col-start-2 row-span-2 row-start-1 self-start justify-self-end",
        className
      )}
      {...props}
    />
  )
}

// Corpo do cartão, com o espaçamento lateral padrão.
function CardContent({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-content"
      className={cn("px-(--card-spacing)", className)}
      {...props}
    />
  )
}

// Rodapé do cartão, com linha separadora em cima e fundo levemente cinza.
function CardFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-footer"
      className={cn(
        "flex items-center rounded-b-xl border-t bg-muted/50 p-(--card-spacing)",
        className
      )}
      {...props}
    />
  )
}

export {
  Card,
  CardHeader,
  CardFooter,
  CardTitle,
  CardAction,
  CardDescription,
  CardContent,
}
