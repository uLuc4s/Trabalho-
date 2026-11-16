import { notFound } from "next/navigation";
import { MapPin, Phone } from "lucide-react";
import { BookingFlow } from "@/components/booking/booking-flow";
import { ServiceRequestForm } from "@/components/booking/service-request-form";
import { createClient } from "@/lib/supabase/server";

type Info = {
  name: string;
  description: string | null;
  address: string | null;
  phone: string | null;
  payment_methods: string[];
  timezone: string;
  services: {
    id: string;
    name: string;
    description: string | null;
    category: string | null;
    duration_minutes: number;
    price: number | null;
  }[];
  employees: { id: string; display_name: string }[];
};

const PAYMENT_LABEL: Record<string, string> = { pix: "Pix", cartao: "Cartão", dinheiro: "Dinheiro" };

export default async function PublicBookingPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("public_company_info", { p_slug: slug });

  if (error || !data) notFound();
  const info = data as Info;

  return (
    <main className="min-h-screen bg-background px-6 py-16 md:px-12">
      <div className="mx-auto flex max-w-4xl flex-col gap-12">
        <header className="flex flex-col gap-4">
          <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Agendamento online</p>
          <h1 className="font-display text-5xl tracking-tight md:text-6xl">{info.name}</h1>
          {info.description && <p className="max-w-2xl text-base leading-relaxed text-muted-foreground">{info.description}</p>}

          <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted-foreground">
            {info.address && (
              <span className="flex items-center gap-2">
                <MapPin className="h-4 w-4" aria-hidden />
                {info.address}
              </span>
            )}
            {info.phone && (
              <span className="flex items-center gap-2">
                <Phone className="h-4 w-4" aria-hidden />
                {info.phone}
              </span>
            )}
          </div>

          {info.payment_methods.length > 0 && (
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Pagamento</span>
              {info.payment_methods.map((method) => (
                <span key={method} className="rounded-full border border-border px-3 py-1 text-xs">
                  {PAYMENT_LABEL[method] ?? method}
                </span>
              ))}
            </div>
          )}
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
