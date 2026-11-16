import { AppSidebar } from "@/components/app/app-sidebar";
import { redirect } from "next/navigation";
import { getCurrentCompany } from "@/lib/company";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const { company, role } = await getCurrentCompany();
  if (!company.business_model && (role === "owner" || role === "admin")) redirect("/onboarding/modelo");

  return (
    <div className="flex min-h-screen bg-secondary/30 text-foreground">
      <AppSidebar companyName={company.name} model={company.business_model} />
      <main className="min-w-0 flex-1 p-6 md:p-10">{children}</main>
    </div>
  );
}
