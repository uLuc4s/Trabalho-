import { notFound } from "next/navigation";
import { BookingFlow } from "@/components/booking/booking-flow";
import { ServiceRequestForm } from "@/components/booking/service-request-form";
import { createClient } from "@/lib/supabase/server";

type Info = {
  name: string;
  timezone: string;
  services: { id: string; name: string; duration_minutes: number; price: number | null }[];
  employees: { id: string; display_name: string }[];
};

export default async function PublicBookingPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("public_company_info", { p_slug: slug });

  if (error || !data) notFound();
  const info = data as Info;

  return (
    <main className="min-h-screen bg-background px-6 py-16 md:px-12">
      <div className="mx-auto flex max-w-4xl flex-col gap-12">
        <header className="flex flex-col gap-3">
          <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Agendamento online</p>
          <h1 className="font-display text-5xl tracking-tight md:text-6xl">{info.name}</h1>
          <p className="text-sm text-muted-foreground">Escolha o serviço, o dia e o horário. Não precisa criar conta.</p>
        </header>
        <BookingFlow slug={slug} info={info} />

        {info.services.length > 0 && (
          <section className="flex flex-col gap-4 border-t border-border pt-12">
            <div>
              <h2 className="font-display text-3xl tracking-tight">Não achou o que precisa?</h2>
              <p className="mt-2 text-sm text-muted-foreground">Peça um orçamento ou uma visita. A empresa responde pelo seu contato.</p>
            </div>
            <ServiceRequestForm slug={slug} services={info.services} />
          </section>
        )}
      </div>
    </main>
  );
}
