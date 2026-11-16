import { AppSidebar } from "@/components/app/app-sidebar";
import { getCurrentCompany } from "@/lib/company";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const { company } = await getCurrentCompany();

  return (
    <div className="flex min-h-screen bg-secondary/30 text-foreground">
      <AppSidebar companyName={company.name} />
      <main className="min-w-0 flex-1 p-6 md:p-10">{children}</main>
    </div>
  );
}
