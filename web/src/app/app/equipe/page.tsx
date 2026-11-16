import { InviteForm } from "@/components/app/invite-form";
import { getCurrentCompany } from "@/lib/company";

type Pick<T> = T | T[] | null;

export default async function EquipePage() {
  const { supabase, company, role } = await getCurrentCompany();
  const canManage = role === "owner" || role === "admin";

  const [{ data: employees }, { data: members }, { data: invites }] = await Promise.all([
    supabase.from("employees").select("id, display_name, active").order("display_name"),
    supabase.from("company_members").select("id, role, status, profiles(full_name)").order("created_at"),
    supabase
      .from("invitations")
      .select("id, email, role, expires_at, accepted_at")
      .is("accepted_at", null)
      .gt("expires_at", new Date().toISOString())
      .order("expires_at"),
  ]);

  const roleLabel: Record<string, string> = { owner: "Dono", admin: "Administrador", member: "Equipe", viewer: "Leitura" };
  const memberName = (value: Pick<{ full_name: string }>) => (Array.isArray(value) ? value[0]?.full_name : value?.full_name);

  return (
    <div className="flex flex-col gap-10">
      <header>
        <h1 className="font-display text-5xl tracking-tight">Equipe</h1>
        <p className="mt-2 text-sm text-muted-foreground">Quem atende, quem gerencia e quem só acompanha.</p>
      </header>

      {canManage && (
        <section className="flex flex-col gap-3">
          <h2 className="text-sm font-medium text-muted-foreground">Convidar pessoa</h2>
          <InviteForm companyId={company.id} />
          {invites && invites.length > 0 && (
            <p className="text-xs text-muted-foreground">
              Convites pendentes: {invites.map((i) => i.email).join(", ")}
            </p>
          )}
        </section>
      )}

      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-medium text-muted-foreground">Acessos · {members?.length ?? 0}</h2>
        <ul className="divide-y divide-border overflow-hidden rounded-2xl border border-border bg-background">
          {(members ?? []).map((member) => (
            <li key={member.id} className="flex items-center justify-between gap-4 p-5">
              <span className="font-medium">{memberName(member.profiles as Pick<{ full_name: string }>) ?? "Sem nome"}</span>
              <span className="rounded-full bg-secondary px-3 py-1 text-xs">{roleLabel[member.role] ?? member.role}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-medium text-muted-foreground">Profissionais na agenda · {employees?.length ?? 0}</h2>
        {!employees || employees.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
            Nenhum profissional cadastrado. Cadastre quem atende para cada um ter a própria agenda.
          </div>
        ) : (
          <ul className="divide-y divide-border overflow-hidden rounded-2xl border border-border bg-background">
            {employees.map((employee) => (
              <li key={employee.id} className="flex items-center justify-between gap-4 p-5">
                <span className="font-medium">{employee.display_name}</span>
                <span className="text-xs text-muted-foreground">{employee.active ? "Ativo" : "Inativo"}</span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
