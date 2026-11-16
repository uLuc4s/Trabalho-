import { ScrollProgress } from "@/components/motion/page-chrome";
import { CtaFooter } from "@/components/landing/cta-footer";
import { Faq } from "@/components/landing/faq";
import { Features } from "@/components/landing/features";
import { Hero } from "@/components/landing/hero";
import { HowItWorks } from "@/components/landing/how-it-works";
import { Navbar } from "@/components/landing/navbar";
import { Segments } from "@/components/landing/segments";

export default function Home() {
  return (
    <main id="topo" className="bg-background text-foreground">
      <ScrollProgress />
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
