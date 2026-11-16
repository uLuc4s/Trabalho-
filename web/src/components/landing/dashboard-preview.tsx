import {
  Bell,
  BarChart3,
  Calendar,
  ChevronDown,
  Command,
  Home,
  Link2,
  ListTodo,
  Plus,
  Search,
  Send,
  Settings,
  Users,
  Wrench,
  Clock,
  CalendarPlus,
  Ban,
  ClipboardList,
} from "lucide-react";

const sidebar = [
  { label: "Início", icon: Home, active: true },
  { label: "Agenda", icon: Calendar },
  { label: "Atendimentos", icon: ClipboardList, badge: "10" },
  { label: "Clientes", icon: Users },
  { label: "Serviços", icon: Wrench },
  { label: "Relatórios", icon: BarChart3 },
];

const workflows = [
  { label: "Tarefas", icon: ListTodo },
  { label: "Notificações", icon: Bell },
  { label: "Configurações", icon: Settings },
];

const actions = [
  { label: "Novo agendamento", icon: CalendarPlus, primary: true },
  { label: "Solicitação", icon: Send },
  { label: "Bloquear horário", icon: Ban },
  { label: "Nova ordem", icon: Plus },
  { label: "Link público", icon: Link2 },
];

const team = [
  { name: "Carlos", value: "R$ 3.240,00", detail: "12 atendimentos" },
  { name: "Mariana", value: "R$ 2.180,50", detail: "8 atendimentos" },
  { name: "João", value: "R$ 1.590,00", detail: "6 atendimentos" },
];

const recent = [
  { client: "Maria Silva", service: "Corte e barba", time: "09:00", status: "Confirmado", tone: "text-emerald-600" },
  { client: "Lucas Almeida", service: "Visita técnica", time: "10:30", status: "Pendente", tone: "text-amber-600" },
  { client: "Ana Paula", service: "Instalação de ar", time: "13:00", status: "Concluído", tone: "text-emerald-600" },
  { client: "Pedro Costa", service: "Manutenção", time: "15:30", status: "Concluído", tone: "text-emerald-600" },
];

const chartPath =
  "M0 58 C 40 52, 60 28, 100 36 S 170 60, 210 40 S 280 12, 320 22 S 380 38, 400 16";

export function DashboardPreview() {
  return (
    <div
      className="w-full max-w-5xl overflow-hidden rounded-2xl p-3 md:p-4"
      style={{
        background: "rgba(255, 255, 255, 0.4)",
        border: "1px solid rgba(255, 255, 255, 0.5)",
        boxShadow: "var(--shadow-dashboard)",
      }}
    >
      <div className="pointer-events-none flex select-none flex-col rounded-xl bg-background text-[11px] text-foreground">
        <div className="flex items-center justify-between border-b border-border px-4 py-2.5">
          <div className="flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded-md bg-accent text-accent-foreground">
              <Calendar className="h-3.5 w-3.5" aria-hidden />
            </div>
            <span className="text-xs font-semibold">Agendfix</span>
            <ChevronDown className="h-3 w-3 text-muted-foreground" aria-hidden />
          </div>
          <div className="hidden w-64 items-center gap-2 rounded-md border border-border bg-secondary/40 px-2.5 py-1.5 text-muted-foreground md:flex">
            <Search className="h-3 w-3" aria-hidden />
            <span className="flex-1">Buscar cliente ou agendamento</span>
            <span className="flex items-center gap-0.5 rounded border border-border px-1 text-[10px]">
              <Command className="h-2.5 w-2.5" aria-hidden />K
            </span>
          </div>
          <div className="flex items-center gap-3">
            <Bell className="h-3.5 w-3.5 text-muted-foreground" aria-hidden />
            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-secondary text-[10px] font-semibold">
              MB
            </div>
          </div>
        </div>

        <div className="flex min-h-[340px]">
          <aside className="hidden w-40 shrink-0 flex-col gap-0.5 border-r border-border p-2.5 md:flex">
            {sidebar.map((item) => (
              <div
                key={item.label}
                className={`flex items-center gap-2 rounded-md px-2 py-1.5 ${
                  item.active ? "bg-secondary font-semibold" : "text-muted-foreground"
                }`}
              >
                <item.icon className="h-3.5 w-3.5" aria-hidden />
                <span className="flex-1">{item.label}</span>
                {item.badge && (
                  <span className="rounded bg-accent/15 px-1.5 text-[10px] text-accent">{item.badge}</span>
                )}
              </div>
            ))}
            <p className="mt-3 px-2 text-[10px] uppercase tracking-wide text-muted-foreground">Operação</p>
            {workflows.map((item) => (
              <div key={item.label} className="flex items-center gap-2 px-2 py-1.5 text-muted-foreground">
                <item.icon className="h-3.5 w-3.5" aria-hidden />
                {item.label}
              </div>
            ))}
          </aside>

          <main className="flex flex-1 flex-col gap-3 bg-secondary/30 p-4">
            <div className="flex flex-wrap items-center gap-2">
              <p className="mr-auto text-sm font-semibold">Olá, Matheus</p>
              {actions.map((action) => (
                <span
                  key={action.label}
                  className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[10px] ${
                    action.primary
                      ? "bg-accent font-medium text-accent-foreground"
                      : "border border-border bg-background"
                  }`}
                >
                  <action.icon className="h-3 w-3" aria-hidden />
                  {action.label}
                </span>
              ))}
            </div>

            <div className="flex gap-3">
              <div className="flex flex-1 basis-0 flex-col gap-3 rounded-xl border border-border bg-background p-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium">Faturamento do mês</span>
                  <span className="text-muted-foreground">Últimos 30 dias</span>
                </div>
                <div>
                  <p className="text-xl font-semibold">
                    R$ 7.010<span className="text-xs text-muted-foreground">,50</span>
                  </p>
                  <div className="mt-1 flex gap-3 text-[10px]">
                    <span className="text-emerald-600">+R$ 1.240</span>
                    <span className="text-muted-foreground">vs. mês anterior</span>
                  </div>
                </div>
                <svg viewBox="0 0 400 80" className="h-20 w-full" preserveAspectRatio="none" aria-hidden>
                  <defs>
                    <linearGradient id="chart-fill" x1="0" x2="0" y1="0" y2="1">
                      <stop offset="0%" stopColor="hsl(var(--accent))" stopOpacity="0.15" />
                      <stop offset="100%" stopColor="hsl(var(--accent))" stopOpacity="0" />
                    </linearGradient>
                  </defs>
                  <path d={`${chartPath} L400 80 L0 80 Z`} fill="url(#chart-fill)" />
                  <path d={chartPath} fill="none" stroke="hsl(var(--accent))" strokeWidth="1.5" />
                </svg>
              </div>

              <div className="flex flex-1 basis-0 flex-col rounded-xl border border-border bg-background p-4">
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-xs font-medium">Equipe</span>
                  <span className="text-muted-foreground">Este mês</span>
                </div>
                {team.map((member, index) => (
                  <div
                    key={member.name}
                    className={`flex items-center justify-between py-2.5 text-xs ${
                      index > 0 ? "border-t border-border/60" : ""
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <div className="flex h-6 w-6 items-center justify-center rounded-full bg-secondary text-[10px] font-semibold">
                        {member.name[0]}
                      </div>
                      <div>
                        <p className="font-medium">{member.name}</p>
                        <p className="text-[10px] text-muted-foreground">{member.detail}</p>
                      </div>
                    </div>
                    <span className="font-medium">{member.value}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex-1 rounded-xl border border-border bg-background p-4">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-xs font-medium">Próximos atendimentos</span>
                <Clock className="h-3.5 w-3.5 text-muted-foreground" aria-hidden />
              </div>
              <div className="grid grid-cols-[1.2fr_1.2fr_0.6fr_0.8fr] gap-x-3 border-b border-border pb-1.5 text-[10px] uppercase tracking-wide text-muted-foreground">
                <span>Cliente</span>
                <span>Serviço</span>
                <span>Horário</span>
                <span>Status</span>
              </div>
              {recent.map((row) => (
                <div
                  key={row.client}
                  className="grid grid-cols-[1.2fr_1.2fr_0.6fr_0.8fr] gap-x-3 border-b border-border/60 py-2 last:border-0"
                >
                  <span className="font-medium">{row.client}</span>
                  <span className="text-muted-foreground">{row.service}</span>
                  <span>{row.time}</span>
                  <span className={row.tone}>{row.status}</span>
                </div>
              ))}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
