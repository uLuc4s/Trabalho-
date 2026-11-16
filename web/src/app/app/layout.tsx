// Layout do painel: confere se a empresa já escolheu o modelo e monta o menu lateral ao lado do conteúdo.
// Todas as páginas em /app passam por aqui.
import { AppSidebar } from "@/components/app/app-sidebar"; // menu lateral e menu do celular
import { redirect } from "next/navigation"; // redireciona para outra rota no servidor
import { getCurrentCompany } from "@/lib/company"; // descobre a empresa e o papel do usuário logado

// Entrada: a página filha (children) que está sendo acessada.
// Saída: a página dentro da moldura do painel.
// Área logada: depende da sessão do usuário, então bloqueia no servidor em vez de pré-renderizar.
export const instant = false;

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const { company, role } = await getCurrentCompany();
  // Dono ou admin sem modelo de negócio é levado para escolher. Outros papéis seguem sem redirecionar.
  if (!company.business_model && (role === "owner" || role === "admin")) redirect("/onboarding/modelo");

  return (
    <div className="flex min-h-screen bg-secondary/30 text-foreground">
      {/* Menu lateral com o nome da empresa, o modelo (para esconder itens) e o link público. */}
      <AppSidebar companyName={company.name} slug={company.slug} model={company.business_model} />
      {/* Área principal: o conteúdo da página atual. min-w-0 deixa a tabela encolher sem estourar a tela. */}
      <main className="min-w-0 flex-1 p-6 md:p-10">{children}</main>
    </div>
  );
}
