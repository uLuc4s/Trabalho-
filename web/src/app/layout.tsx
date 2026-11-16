// Layout raiz: vale para todas as páginas. Define fontes, idioma, título e a configuração de animações.
import type { Metadata } from "next"; // tipo dos metadados (título, descrição)
import { Inter, Instrument_Serif } from "next/font/google"; // fontes baixadas e servidas pelo próprio Next
import "./globals.css"; // estilos globais e tokens de cor
import { MotionProvider } from "@/components/motion/motion-provider"; // respeita "reduzir movimento"

// Fonte de títulos. Só o peso 400, em normal e itálico.
const display = Instrument_Serif({
  variable: "--font-instrument", // variável CSS usada nos títulos
  subsets: ["latin"], // só caracteres latinos, para o arquivo ficar pequeno
  weight: "400",
  style: ["normal", "italic"],
});

// Fonte do corpo do texto. Pesos 400, 500 e 600.
const body = Inter({
  variable: "--font-inter", // variável CSS usada no texto
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

// Título e descrição que aparecem na aba do navegador e nos buscadores.
export const metadata: Metadata = {
  title: "Agendfix | Agenda online para o seu negócio",
  description: "Agendamentos, equipe e operação em um só lugar.",
};

// Entrada: a página atual (children).
// Saída: o documento HTML completo, com idioma pt-BR e as duas fontes ligadas em variáveis CSS.
export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="pt-BR" // idioma para leitores de tela e tradutores
      className={`${display.variable} ${body.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-background text-foreground font-body">
        <MotionProvider>{children}</MotionProvider>
      </body>
    </html>
  );
}
