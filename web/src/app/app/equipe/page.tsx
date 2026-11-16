// Página de equipe: cadastra quem atende, define serviços e horários de cada um, convida pessoas e lista quem tem acesso ao painel.
// Só dono e admin alteram; os outros papéis veem a lista.
import { EmployeeForm } from "@/components/app/employee-form"; // cadastro de profissional
import { EmployeeSetup } from "@/components/app/employee-setup"; // serviços e horários de cada profissional
import { InviteForm } from "@/components/app/invite-form"; // gera convite para o painel
import { getCurrentCompany } from "@/lib/company";

// Relação do Supabase: objeto ou lista.
type Pick<T> = T | T[] | null;

// Monta a página de equipe.
export default async function EquipePage() {
  const { supabase, company, role } = await getCurrentCompany();
  const canManage = role === "owner" || role === "admin"; // só dono e admin alteram

  // Oito consultas em paralelo: profissionais, membros, convites pendentes, serviços, ligações, horários.
  const [{ data: employees }, { data: members }, { data: invites }, { data: services }, { data: links }, { data: hours }] =
    await Promise.all([
      supabase.from("employees").select("id, display_name, active").order("display_name"),
      // Nome dos membros vem da tabela de perfis. Ver a observação no fim do arquivo.
      supabase.from("company_members").select("id, role, status, profiles(full_name)").order("created_at"),
      // Convites ainda não aceitos e dentro do prazo.
      supabase
        .from("invitations")
        .select("id, email, role, expires_at, accepted_at")
        .is("accepted_at", null)
        .gt("expires_at", new Date().toISOString())
        .order("expires_at"),
      supabase.from("services").select("id, name").eq("active", true).order("name"),
      supabase.from("employee_services").select("employee_id, service_id"),
      supabase.from("working_hours").select("id, employee_id, weekday, start_time, end_time").order("weekday"),
    ]);

  // Texto de cada papel na lista de acessos.
  const roleLabel: Record<string, string> = { owner: "Dono", admin: "Administrador", member: "Equipe", viewer: "Leitura" };
  // Pega o nome do perfil, que pode vir como objeto ou lista.
  const memberName = (value: Pick<{ full_name: string }>) => (Array.isArray(value) ? value[0]?.full_name : value?.full_name);

  return (
    <div className="flex flex-col gap-10">
      <header>
        <h1 className="font-display text-5xl tracking-tight">Equipe</h1>
        <p className="mt-2 text-sm text-muted-foreground">Quem atende, em quais serviços e em quais horários.</p>
      </header>

      {/* Profissionais: cadastro e, em cada um, serviços e horários. */}
      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-medium text-muted-foreground">Profissionais na agenda</h2>
        {canManage && <EmployeeForm companyId={company.id} />}

        {!employees || employees.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
            Nenhum profissional cadastrado. Cadastre quem atende para cada um ter a própria agenda.
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {employees.map((employee) => {
              // Serviços e horários só deste profissional.
              const linkedServiceIds = (links ?? []).filter((l) => l.employee_id === employee.id).map((l) => l.service_id);
              const employeeHours = (hours ?? []).filter((h) => h.employee_id === employee.id);
              return (
                // Cada profissional é um bloco recolhível. Fica fechado para quem pode editar, aberto para os outros.
                <details key={employee.id} className="group rounded-2xl border border-border bg-background p-6" open={!canManage ? undefined : false}>
                  <summary className="flex cursor-pointer list-none items-center justify-between">
                    <span className="font-medium">{employee.display_name}</span>
                    <span className="text-xs text-muted-foreground">
                      {linkedServiceIds.length} serviços · {employeeHours.length} horários
                    </span>
                  </summary>
                  <div className="mt-6">
                    {canManage ? (
                      <EmployeeSetup
                        companyId={company.id}
                        employeeId={employee.id}
                        services={services ?? []}
                        linkedServiceIds={linkedServiceIds}
                        hours={employeeHours}
                      />
                    ) : (
                      <p className="text-sm text-muted-foreground">Somente o dono ou administrador altera a configuração.</p>
                    )}
                  </div>
                </details>
              );
            })}
          </div>
        )}
      </section>

      {/* Convites: formulário e lista dos convites pendentes. Só dono e admin. */}
      {canManage && (
        <section className="flex flex-col gap-3">
          <h2 className="text-sm font-medium text-muted-foreground">Convidar pessoa para o painel</h2>
          <InviteForm companyId={company.id} />
          {invites && invites.length > 0 && (
            <p className="text-xs text-muted-foreground">Convites pendentes: {invites.map((i) => i.email).join(", ")}</p>
          )}
        </section>
      )}

      {/* Quem tem acesso ao painel e qual o papel de cada um. */}
      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-medium text-muted-foreground">Acessos ao painel · {members?.length ?? 0}</h2>
        <ul className="divide-y divide-border overflow-hidden rounded-2xl border border-border bg-background">
          {(members ?? []).map((member) => (
            <li key={member.id} className="flex items-center justify-between gap-4 p-5">
              <span className="font-medium">{memberName(member.profiles as Pick<{ full_name: string }>) ?? "Sem nome"}</span>
              <span className="rounded-full bg-secondary px-3 py-1 text-xs">{roleLabel[member.role] ?? member.role}</span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

// OBSERVAÇÃO (pendência conhecida): a política da tabela profiles deixa cada usuário ler só o próprio perfil.
// Por isso, para outros membros, o nome aparece como "Sem nome". Correção prevista: uma função que devolva
// nome e e-mail de membros da mesma empresa, ou uma política de leitura entre membros.
