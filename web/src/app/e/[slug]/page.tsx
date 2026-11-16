import { notFound } from "next/navigation";
import { BookingFlow } from "@/components/booking/booking-flow";
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
      </div>
    </main>
  );
}
