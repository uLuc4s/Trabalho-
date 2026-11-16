-- OPERAÇÕES DO DIA A DIA
-- Cria as tabelas de ordens de serviço, solicitações, quadro de tarefas, notificações, integrações e auditoria.
-- Esta migration foi aplicada. Nada aqui é trocado depois, só são acrescentadas tabelas e regras.
-- Resultado esperado: cada tabela existe, tem sua restrição de integridade e só é acessada por quem tem papel permitido.

-- Exceções de agenda: folga, feriado ou bloqueio. Pode valer para a empresa toda ou para um profissional.
create table public.availability_exceptions (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies (id) on delete cascade, -- empresa da exceção
  employee_id uuid, -- profissional afetado; null = empresa inteira
  starts_at timestamptz not null, -- início do bloqueio
  ends_at timestamptz not null, -- fim do bloqueio
  reason text, -- motivo, ex.: "feriado"
  created_at timestamptz not null default now(),
  check (ends_at > starts_at), -- o fim vem depois do início
  foreign key (employee_id, company_id) references public.employees (id, company_id) on delete cascade -- profissional precisa ser da mesma empresa
);
create index availability_exceptions_company_starts_idx on public.availability_exceptions (company_id, starts_at); -- acelera a busca de bloqueios por data

-- Endereços de cliente, usados na ordem de serviço quando o trabalho é em campo.
create table public.customer_addresses (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null, -- empresa, para checagem de integridade
  customer_id uuid not null, -- cliente dono do endereço
  street text not null, -- rua
  number text, -- número
  district text, -- bairro
  city text not null, -- cidade
  state text not null check (char_length(state) = 2), -- sigla do estado, ex.: SP
  postal_code text, -- CEP
  is_primary boolean not null default false, -- endereço principal do cliente
  created_at timestamptz not null default now(),
  unique (id, company_id),
  foreign key (customer_id, company_id) references public.customers (id, company_id) on delete cascade
);
-- Garante que cada cliente tenha no máximo um endereço principal.
create unique index customer_addresses_one_primary_idx
  on public.customer_addresses (customer_id) where is_primary;

-- Ordem de serviço: o trabalho a ser feito, com status que avança por etapas.
create table public.work_orders (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies (id) on delete cascade, -- empresa da ordem
  customer_id uuid not null, -- cliente da ordem
  service_id uuid, -- serviço, se houver
  address_id uuid, -- endereço de atendimento, se for em campo
  title text not null, -- título exibido na lista
  status text not null default 'open' -- situação atual da ordem
    check (status in ('open', 'scheduled', 'in_progress', 'completed', 'cancelled')),
  opened_by uuid references auth.users (id), -- quem abriu a ordem
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(), -- última alteração de status
  unique (id, company_id),
  foreign key (customer_id, company_id) references public.customers (id, company_id),
  foreign key (service_id, company_id) references public.services (id, company_id),
  foreign key (address_id, company_id) references public.customer_addresses (id, company_id)
);
create index work_orders_company_status_idx on public.work_orders (company_id, status); -- acelera a lista de ordens por status

-- Liga um atendimento a uma ordem de serviço. Assim a ordem mostra o veículo do atendimento.
alter table public.appointments add column work_order_id uuid;
alter table public.appointments
  add constraint appointments_work_order_fk
  foreign key (work_order_id, company_id) references public.work_orders (id, company_id) on delete set null (work_order_id); -- se a ordem sumir, só o vínculo é zerado
create index appointments_work_order_idx on public.appointments (work_order_id); -- acelera a busca de atendimento por ordem

-- Pedido de orçamento ou visita enviado por um cliente pelo link público.
create table public.service_requests (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies (id) on delete cascade, -- empresa que recebe o pedido
  customer_id uuid not null, -- cliente que pediu
  service_id uuid, -- serviço pedido
  preferred_window text, -- preferência de dia ou horário
  notes text, -- observação do cliente
  status text not null default 'new' -- situação do pedido
    check (status in ('new', 'under_review', 'approved', 'rejected', 'expired', 'cancelled')),
  work_order_id uuid, -- ordem criada se o pedido for aprovado
  created_at timestamptz not null default now(),
  unique (id, company_id),
  foreign key (customer_id, company_id) references public.customers (id, company_id),
  foreign key (service_id, company_id) references public.services (id, company_id),
  foreign key (work_order_id, company_id) references public.work_orders (id, company_id)
);
create index service_requests_company_status_idx on public.service_requests (company_id, status); -- acelera a lista por status

-- Itens de uma ordem: peças ou serviços cobrados, com quantidade e preço unitário.
create table public.work_order_items (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies (id) on delete cascade,
  work_order_id uuid not null, -- ordem a que o item pertence
  description text not null, -- o que foi feito ou usado
  quantity numeric(10, 2) not null default 1 check (quantity > 0), -- quantidade, sempre maior que zero
  unit_price numeric(10, 2) not null default 0 check (unit_price >= 0), -- preço unitário, não negativo
  created_at timestamptz not null default now(),
  foreign key (work_order_id, company_id) references public.work_orders (id, company_id) on delete cascade
);

-- Histórico da ordem: cada mudança de status vira uma linha. Não pode ser alterado depois.
create table public.work_order_events (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies (id) on delete cascade,
  work_order_id uuid not null, -- ordem do evento
  actor_id uuid references auth.users (id), -- quem fez a mudança
  event_type text not null, -- "created" ou "status_changed"
  payload jsonb not null default '{}'::jsonb, -- detalhes, ex.: status anterior e novo
  created_at timestamptz not null default now(), -- quando aconteceu
  foreign key (work_order_id, company_id) references public.work_orders (id, company_id) on delete cascade
);
create index work_order_events_order_idx on public.work_order_events (work_order_id, created_at); -- acelera a leitura do histórico

-- Quadro de tarefas (Kanban). Cada empresa pode ter quadros.
create table public.task_boards (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies (id) on delete cascade,
  name text not null, -- nome do quadro, ex.: "Operação"
  created_at timestamptz not null default now(),
  unique (id, company_id)
);

-- Colunas do quadro, ex.: "A fazer", "Em andamento", "Concluído".
create table public.task_columns (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null,
  board_id uuid not null, -- quadro da coluna
  name text not null, -- nome da coluna
  position integer not null default 0, -- ordem da coluna da esquerda para a direita
  unique (id, company_id),
  foreign key (board_id, company_id) references public.task_boards (id, company_id) on delete cascade
);

-- Tarefas de um quadro. Ficam em uma coluna e podem ser arrastadas para outra.
create table public.tasks (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies (id) on delete cascade,
  board_id uuid not null, -- quadro
  column_id uuid not null, -- coluna atual
  title text not null, -- título do card
  description text, -- detalhe opcional
  due_at timestamptz, -- prazo opcional
  position integer not null default 0, -- ordem dentro da coluna
  created_by uuid references auth.users (id), -- quem criou
  created_at timestamptz not null default now(),
  unique (id, company_id),
  foreign key (board_id, company_id) references public.task_boards (id, company_id) on delete cascade,
  foreign key (column_id, company_id) references public.task_columns (id, company_id) on delete cascade
);
create index tasks_board_column_idx on public.tasks (board_id, column_id, position); -- acelera a montagem do quadro

-- Quem está responsável por cada tarefa (profissionais).
create table public.task_assignees (
  company_id uuid not null,
  task_id uuid not null, -- tarefa
  employee_id uuid not null, -- profissional responsável
  primary key (task_id, employee_id), -- o mesmo profissional não entra duas vezes na mesma tarefa
  foreign key (task_id, company_id) references public.tasks (id, company_id) on delete cascade,
  foreign key (employee_id, company_id) references public.employees (id, company_id) on delete cascade
);

-- Itens do checklist de uma tarefa.
create table public.task_checklist_items (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null,
  task_id uuid not null, -- tarefa do item
  title text not null, -- texto do item
  done boolean not null default false, -- marcado ou não
  position integer not null default 0, -- ordem na lista
  foreign key (task_id, company_id) references public.tasks (id, company_id) on delete cascade
);

-- Comentários em uma tarefa, com limite de 2000 caracteres.
create table public.task_comments (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null,
  task_id uuid not null, -- tarefa comentada
  user_id uuid not null references auth.users (id), -- quem comentou
  content text not null check (char_length(content) between 1 and 2000), -- texto do comentário
  created_at timestamptz not null default now(),
  foreign key (task_id, company_id) references public.tasks (id, company_id) on delete cascade
);

-- Modelos de mensagem automática por evento e canal (e-mail ou WhatsApp).
create table public.notification_templates (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies (id) on delete cascade,
  event_type text not null, -- evento que dispara a mensagem
  channel text not null check (channel in ('email', 'whatsapp')), -- canal de envio
  body text not null, -- texto da mensagem
  unique (company_id, event_type, channel) -- um modelo por evento e canal
);

-- Fila de mensagens a enviar. Cada linha é uma notificação pendente, enviada ou com falha.
create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies (id) on delete cascade,
  channel text not null check (channel in ('email', 'whatsapp')), -- canal
  recipient text not null, -- destinatário (e-mail ou telefone)
  event_type text not null, -- motivo do envio, ex.: booking_confirmed
  payload jsonb not null default '{}'::jsonb, -- dados extras para montar a mensagem
  status text not null default 'pending' check (status in ('pending', 'sent', 'failed')), -- situação do envio
  created_at timestamptz not null default now(),
  sent_at timestamptz -- quando foi enviada, se foi
);
create index notifications_pending_idx on public.notifications (status, created_at); -- acelera a busca de pendentes

-- Conexões com serviços externos (Google Agenda, WhatsApp, e-mail).
create table public.integrations (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies (id) on delete cascade,
  provider text not null check (provider in ('google_calendar', 'whatsapp', 'email')), -- serviço conectado
  status text not null default 'disconnected' check (status in ('connected', 'disconnected', 'error')), -- situação
  created_at timestamptz not null default now(),
  unique (company_id, provider) -- uma conexão por serviço e empresa
);

-- Registro de auditoria: quem fez o quê e quando. Não pode ser alterado nem apagado.
create table public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies (id) on delete cascade,
  actor_id uuid references auth.users (id), -- quem fez a ação
  action text not null, -- o que foi feito
  entity text not null, -- sobre qual tipo de registro
  entity_id uuid, -- qual registro
  metadata jsonb not null default '{}'::jsonb, -- detalhes extras
  created_at timestamptz not null default now()
);
create index audit_logs_company_created_idx on public.audit_logs (company_id, created_at); -- acelera a leitura por empresa e data

-- Liga a proteção de linha (RLS) em todas as tabelas novas. Sem política, nada é permitido.
alter table public.availability_exceptions enable row level security;
alter table public.customer_addresses enable row level security;
alter table public.work_orders enable row level security;
alter table public.service_requests enable row level security;
alter table public.work_order_items enable row level security;
alter table public.work_order_events enable row level security;
alter table public.task_boards enable row level security;
alter table public.task_columns enable row level security;
alter table public.tasks enable row level security;
alter table public.task_assignees enable row level security;
alter table public.task_checklist_items enable row level security;
alter table public.task_comments enable row level security;
alter table public.notification_templates enable row level security;
alter table public.notifications enable row level security;
alter table public.integrations enable row level security;
alter table public.audit_logs enable row level security;

-- Usuário logado pode operar essas tabelas, desde que a RLS permita linha a linha.
grant select, insert, update, delete on
  public.availability_exceptions, public.customer_addresses, public.work_orders,
  public.service_requests, public.work_order_items, public.work_order_events,
  public.task_boards, public.task_columns, public.tasks, public.task_assignees,
  public.task_checklist_items, public.task_comments, public.notification_templates,
  public.notifications, public.integrations, public.audit_logs
  to authenticated;

-- Histórico e auditoria são imutáveis: ninguém altera nem apaga depois de gravado.
revoke update, delete on public.work_order_events from authenticated;
revoke update, delete on public.audit_logs from authenticated;

-- Políticas de acesso. Leitura: membros. Escrita: conforme o papel.

-- Exceções de agenda: todos leem; só dono e admin criam ou alteram.
create policy availability_exceptions_select on public.availability_exceptions
  for select to authenticated using (public.is_member_of(company_id));
create policy availability_exceptions_manage on public.availability_exceptions
  for all to authenticated
  using (public.is_member_of(company_id, array['owner', 'admin']))
  with check (public.is_member_of(company_id, array['owner', 'admin']));

-- Endereços: leitura para membros; escrita para dono, admin e membro.
create policy customer_addresses_select on public.customer_addresses
  for select to authenticated using (public.is_member_of(company_id));
create policy customer_addresses_write on public.customer_addresses
  for all to authenticated
  using (public.is_member_of(company_id, array['owner', 'admin', 'member']))
  with check (public.is_member_of(company_id, array['owner', 'admin', 'member']));

-- Ordens: leitura para membros; escrita para dono, admin e membro.
create policy work_orders_select on public.work_orders
  for select to authenticated using (public.is_member_of(company_id));
create policy work_orders_write on public.work_orders
  for all to authenticated
  using (public.is_member_of(company_id, array['owner', 'admin', 'member']))
  with check (public.is_member_of(company_id, array['owner', 'admin', 'member']));

-- Solicitações: leitura para membros; escrita para dono, admin e membro.
create policy service_requests_select on public.service_requests
  for select to authenticated using (public.is_member_of(company_id));
create policy service_requests_write on public.service_requests
  for all to authenticated
  using (public.is_member_of(company_id, array['owner', 'admin', 'member']))
  with check (public.is_member_of(company_id, array['owner', 'admin', 'member']));

-- Itens de ordem: leitura para membros; escrita para dono, admin e membro.
create policy work_order_items_select on public.work_order_items
  for select to authenticated using (public.is_member_of(company_id));
create policy work_order_items_write on public.work_order_items
  for all to authenticated
  using (public.is_member_of(company_id, array['owner', 'admin', 'member']))
  with check (public.is_member_of(company_id, array['owner', 'admin', 'member']));

-- Histórico da ordem: leitura para membros; inserção só pelo próprio usuário, com papel permitido.
create policy work_order_events_select on public.work_order_events
  for select to authenticated using (public.is_member_of(company_id));
create policy work_order_events_insert on public.work_order_events
  for insert to authenticated
  with check (public.is_member_of(company_id, array['owner', 'admin', 'member']) and actor_id = auth.uid());

-- Quadros: leitura para membros; gestão para dono e admin.
create policy task_boards_select on public.task_boards
  for select to authenticated using (public.is_member_of(company_id));
create policy task_boards_manage on public.task_boards
  for all to authenticated
  using (public.is_member_of(company_id, array['owner', 'admin']))
  with check (public.is_member_of(company_id, array['owner', 'admin']));

-- Colunas: leitura para membros; gestão para dono e admin.
create policy task_columns_select on public.task_columns
  for select to authenticated using (public.is_member_of(company_id));
create policy task_columns_manage on public.task_columns
  for all to authenticated
  using (public.is_member_of(company_id, array['owner', 'admin']))
  with check (public.is_member_of(company_id, array['owner', 'admin']));

-- Tarefas: leitura para membros; escrita para dono, admin e membro.
create policy tasks_select on public.tasks
  for select to authenticated using (public.is_member_of(company_id));
create policy tasks_write on public.tasks
  for all to authenticated
  using (public.is_member_of(company_id, array['owner', 'admin', 'member']))
  with check (public.is_member_of(company_id, array['owner', 'admin', 'member']));

-- Responsáveis: leitura para membros; escrita para dono, admin e membro.
create policy task_assignees_select on public.task_assignees
  for select to authenticated using (public.is_member_of(company_id));
create policy task_assignees_write on public.task_assignees
  for all to authenticated
  using (public.is_member_of(company_id, array['owner', 'admin', 'member']))
  with check (public.is_member_of(company_id, array['owner', 'admin', 'member']));

-- Checklist: leitura para membros; escrita para dono, admin e membro.
create policy task_checklist_items_select on public.task_checklist_items
  for select to authenticated using (public.is_member_of(company_id));
create policy task_checklist_items_write on public.task_checklist_items
  for all to authenticated
  using (public.is_member_of(company_id, array['owner', 'admin', 'member']))
  with check (public.is_member_of(company_id, array['owner', 'admin', 'member']));

-- Comentários: leitura para membros; inserção só pelo próprio usuário.
create policy task_comments_select on public.task_comments
  for select to authenticated using (public.is_member_of(company_id));
create policy task_comments_insert on public.task_comments
  for insert to authenticated
  with check (public.is_member_of(company_id, array['owner', 'admin', 'member']) and user_id = auth.uid());

-- Modelos de mensagem: só dono e admin leem e gerenciam.
create policy notification_templates_select on public.notification_templates
  for select to authenticated using (public.is_member_of(company_id, array['owner', 'admin']));
create policy notification_templates_manage on public.notification_templates
  for all to authenticated
  using (public.is_member_of(company_id, array['owner', 'admin']))
  with check (public.is_member_of(company_id, array['owner', 'admin']));

-- Fila de notificações: só dono e admin leem.
create policy notifications_select on public.notifications
  for select to authenticated using (public.is_member_of(company_id, array['owner', 'admin']));

-- Integrações: só dono e admin leem e gerenciam.
create policy integrations_select on public.integrations
  for select to authenticated using (public.is_member_of(company_id, array['owner', 'admin']));
create policy integrations_manage on public.integrations
  for all to authenticated
  using (public.is_member_of(company_id, array['owner', 'admin']))
  with check (public.is_member_of(company_id, array['owner', 'admin']));

-- Auditoria: só dono e admin leem.
create policy audit_logs_select on public.audit_logs
  for select to authenticated using (public.is_member_of(company_id, array['owner', 'admin']));
