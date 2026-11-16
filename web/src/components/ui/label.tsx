// Rótulo de campo. Associa o texto ao campo pelo htmlFor, para leitores de tela e para clicar no texto focar o campo.
// Roda no navegador por causa do "use client" exigido pelo componente base.
"use client"

import * as React from "react" // tipos de componentes React
import { cn } from "cn" // junta classes e resolve conflitos

// Entrada: htmlFor (id do campo) e props de um label HTML.
// Saída: o rótulo com o estilo padrão, esmaecido quando o campo está desabilitado.
function Label({ className, ...props }: React.ComponentProps<"label">) {
  return (
    <label
      data-slot="label"
      className={cn(
        "flex items-center gap-2 text-sm leading-none font-medium select-none group-data-[disabled=true]:pointer-events-none group-data-[disabled=true]:opacity-50 peer-disabled:cursor-not-allowed peer-disabled:opacity-50",
        className
      )}
      {...props}
    />
  )
}

export { Label }
