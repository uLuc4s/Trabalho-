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
const SITE_URL = "https://agendfix.vercel.app";
const TITLE = "Agendfix | Agenda online para o seu negócio";
const DESCRIPTION = "Seus clientes agendam pelo seu link, sem criar conta. Agenda, equipe, ordens de serviço e relatórios em um só lugar.";

// Título, descrição e prévia de compartilhamento (WhatsApp, Google e redes sociais).
export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: TITLE,
  description: DESCRIPTION,
  applicationName: "Agendfix",
  alternates: { canonical: "/" },
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    url: SITE_URL,
    siteName: "Agendfix",
    locale: "pt_BR",
    type: "website",
  },
  twitter: { card: "summary", title: TITLE, description: DESCRIPTION },
  robots: { index: true, follow: true },
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
