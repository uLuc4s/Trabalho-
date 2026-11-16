// Campo de texto padrão do sistema. Repassa todas as props de um <input> comum.
// Uso: <Input id="email" type="email" />.
import * as React from "react" // tipos de componentes React
import { Input as InputPrimitive } from "@base-ui/react/input" // campo sem estilo, com acessibilidade pronta
import { cn } from "cn" // junta classes e resolve conflitos

// Entrada: as props de um input HTML, mais className extra.
// Saída: o campo com o estilo padrão. className recebida vence em caso de conflito.
function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <InputPrimitive
      type={type}
      data-slot="input" // marcador para estilos de grupo
      className={cn(
        // Base: altura 32px, borda, foco com anel, placeholder cinza e estados de erro e desabilitado.
        "h-8 w-full min-w-0 rounded-lg border border-input bg-transparent px-2.5 py-1 text-base transition-colors outline-none file:inline-flex file:h-6 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-input/50 disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 md:text-sm dark:bg-input/30 dark:disabled:bg-input/80 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40",
        className
      )}
      {...props}
    />
  )
}

export { Input }
