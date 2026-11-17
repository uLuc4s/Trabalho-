// Página de equipe: cadastra quem atende, define serviços e horários de cada um, convida pessoas e lista quem tem acesso ao painel.
// Só dono e admin alteram; os outros papéis veem a lista.
import { EmployeeForm } from "@/components/app/forms/employee-form"; // cadastro de profissional
import { EmployeeSetup } from "@/components/app/equipe/employee-setup"; // serviços e horários de cada profissional
import { InviteForm } from "@/components/app/forms/invite-form"; // gera convite para o painel
import { getCurrentCompany } from "@/lib/company";
import { getEquipeData } from "@/services/equipe.service";

// Monta a página de equipe.
export default async function EquipePage() {
  const { supabase, company, role } = await getCurrentCompany();
  const canManage = role === "owner" || role === "admin"; // só dono e admin alteram

  // Todas as consultas da tela vêm do service de equipe.
  const { employees, members, invites, services, links, hours, nameRows } = await getEquipeData(supabase, company.id);
  // Texto de cada papel na lista de acessos.
  const roleLabel: Record<string, string> = { owner: "Dono", admin: "Administrador", member: "Equipe", viewer: "Leitura" };
  const nameById = new Map<string, string>(nameRows.map((r) => [r.member_id, r.full_name]));

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
              <span className="font-medium">{nameById.get(member.id) ?? "Sem nome"}</span>
              <span className="rounded-full bg-secondary px-3 py-1 text-xs">{roleLabel[member.role] ?? member.role}</span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

