// Página pública da empresa (/e/[slug]): apresentação, agendamento online e pedido de orçamento. Não exige login.
// Se a empresa não existir ou estiver desligada, mostra a página 404.
import { notFound } from "next/navigation"; // mostra a página 404
import { MapPin, Phone } from "lucide-react"; // ícones de endereço e telefone
import { BookingFlow } from "@/components/booking/booking-flow"; // fluxo de agendamento
import { ServiceRequestForm } from "@/components/booking/service-request-form"; // pedido de orçamento
import { createClient } from "@/lib/supabase/server"; // cliente do servidor (sem login, usa só funções públicas)

// Dados públicos da empresa, como a função public_company_info devolve.
type Info = {
  name: string;
  description: string | null;
  address: string | null;
  phone: string | null;
  segment: string | null;
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

// Nome em português de cada forma de pagamento.
const PAYMENT_LABEL: Record<string, string> = { pix: "Pix", cartao: "Cartão", dinheiro: "Dinheiro" };

// Entrada: slug da empresa, vindo da URL.
// Saída: a página pública, ou 404 se a empresa não for encontrada.
export default async function PublicBookingPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params; // a URL chega como promessa no Next 16
  const supabase = await createClient();
  // Chama a função pública. Ela já filtra empresas desligadas.
  const { data, error } = await supabase.rpc("public_company_info", { p_slug: slug });

  if (error || !data) notFound();
  const info = data as Info;

  return (
    <main className="min-h-screen bg-background px-6 py-16 md:px-12">
      <div className="mx-auto flex max-w-4xl flex-col gap-12">
        {/* Apresentação: nome, descrição, contato e formas de pagamento. */}
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

        {/* Agendamento em passos. */}
        <BookingFlow slug={slug} info={info} />

        {/* Pedido de orçamento, para quem não achou o serviço na lista. Só aparece se houver serviços. */}
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
