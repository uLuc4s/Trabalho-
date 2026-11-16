// Página inicial (landing). Monta as seções na ordem: topo com menu e destaque, recursos, como funciona,
// segmentos, perguntas e chamada final com rodapé. Não busca dados: é conteúdo estático.
import { ScrollProgress } from "@/components/motion/page-chrome"; // barra de progresso da rolagem
import { CtaFooter } from "@/components/landing/cta-footer"; // chamada final e rodapé
import { Faq } from "@/components/landing/faq"; // perguntas frequentes
import { Features } from "@/components/landing/features"; // recursos
import { Hero } from "@/components/landing/hero"; // destaque com demonstração
import { HowItWorks } from "@/components/landing/how-it-works"; // passos de uso
import { Navbar } from "@/components/landing/navbar"; // cabeçalho fixo
import { Segments } from "@/components/landing/segments"; // ramos atendidos

// Monta a landing inteira. id="topo" é o alvo do botão de voltar ao topo.
export default function Home() {
  return (
    <main id="topo" className="bg-background text-foreground">
      <ScrollProgress />
      {/* Primeira dobra: menu e destaque ocupam a altura da tela no computador. */}
      <div className="relative flex min-h-[100svh] flex-col md:h-[100svh] md:overflow-hidden">
        <Navbar />
        <Hero />
      </div>

      <Features />
      <HowItWorks />
      <Segments />
      <Faq />
      <CtaFooter />
    </main>
  );
}
