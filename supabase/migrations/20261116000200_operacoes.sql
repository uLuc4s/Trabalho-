create table public.availability_exceptions (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies (id) on delete cascade,
  employee_id uuid,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  reason text,
  created_at timestamptz not null default now(),
  check (ends_at > starts_at),
  foreign key (employee_id, company_id) references public.employees (id, company_id) on delete cascade
);
create index availability_exceptions_company_starts_idx on public.availability_exceptions (company_id, starts_at);

create table public.customer_addresses (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null,
  customer_id uuid not null,
  street text not null,
  number text,
  district text,
  city text not null,
  state text not null check (char_length(state) = 2),
  postal_code text,
  is_primary boolean not null default false,
  created_at timestamptz not null default now(),
  unique (id, company_id),
  foreign key (customer_id, company_id) references public.customers (id, company_id) on delete cascade
);
create unique index customer_addresses_one_primary_idx
  on public.customer_addresses (customer_id) where is_primary;

create table public.work_orders (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies (id) on delete cascade,
  customer_id uuid not null,
  service_id uuid,
  address_id uuid,
  title text not null,
  status text not null default 'open'
    check (status in ('open', 'scheduled', 'in_progress', 'completed', 'cancelled')),
  opened_by uuid references auth.users (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id, company_id),
  foreign key (customer_id, company_id) references public.customers (id, company_id),
  foreign key (service_id, company_id) references public.services (id, company_id),
  foreign key (address_id, company_id) references public.customer_addresses (id, company_id)
);
create index work_orders_company_status_idx on public.work_orders (company_id, status);

alter table public.appointments add column work_order_id uuid;
alter table public.appointments
  add constraint appointments_work_order_fk
  foreign key (work_order_id, company_id) references public.work_orders (id, company_id) on delete set null (work_order_id);
create index appointments_work_order_idx on public.appointments (work_order_id);

create table public.service_requests (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies (id) on delete cascade,
  customer_id uuid not null,
  service_id uuid,
  preferred_window text,
  notes text,
  status text not null default 'new'
    check (status in ('new', 'under_review', 'approved', 'rejected', 'expired', 'cancelled')),
  work_order_id uuid,
  created_at timestamptz not null default now(),
  unique (id, company_id),
  foreign key (customer_id, company_id) references public.customers (id, company_id),
  foreign key (service_id, company_id) references public.services (id, company_id),
  foreign key (work_order_id, company_id) references public.work_orders (id, company_id)
);
create index service_requests_company_status_idx on public.service_requests (company_id, status);

create table public.work_order_items (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies (id) on delete cascade,
  work_order_id uuid not null,
  description text not null,
  quantity numeric(10, 2) not null default 1 check (quantity > 0),
  unit_price numeric(10, 2) not null default 0 check (unit_price >= 0),
  created_at timestamptz not null default now(),
  foreign key (work_order_id, company_id) references public.work_orders (id, company_id) on delete cascade
);

create table public.work_order_events (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies (id) on delete cascade,
  work_order_id uuid not null,
  actor_id uuid references auth.users (id),
  event_type text not null,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  foreign key (work_order_id, company_id) references public.work_orders (id, company_id) on delete cascade
);
create index work_order_events_order_idx on public.work_order_events (work_order_id, created_at);

create table public.task_boards (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies (id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now(),
  unique (id, company_id)
);

create table public.task_columns (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null,
  board_id uuid not null,
  name text not null,
  position integer not null default 0,
  unique (id, company_id),
  foreign key (board_id, company_id) references public.task_boards (id, company_id) on delete cascade
);

create table public.tasks (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies (id) on delete cascade,
  board_id uuid not null,
  column_id uuid not null,
  title text not null,
  description text,
  due_at timestamptz,
  position integer not null default 0,
  created_by uuid references auth.users (id),
  created_at timestamptz not null default now(),
  unique (id, company_id),
  foreign key (board_id, company_id) references public.task_boards (id, company_id) on delete cascade,
  foreign key (column_id, company_id) references public.task_columns (id, company_id) on delete cascade
);
create index tasks_board_column_idx on public.tasks (board_id, column_id, position);

create table public.task_assignees (
  company_id uuid not null,
  task_id uuid not null,
  employee_id uuid not null,
  primary key (task_id, employee_id),
  foreign key (task_id, company_id) references public.tasks (id, company_id) on delete cascade,
  foreign key (employee_id, company_id) references public.employees (id, company_id) on delete cascade
);

create table public.task_checklist_items (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null,
  task_id uuid not null,
  title text not null,
  done boolean not null default false,
  position integer not null default 0,
  foreign key (task_id, company_id) references public.tasks (id, company_id) on delete cascade
);

create table public.task_comments (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null,
  task_id uuid not null,
  user_id uuid not null references auth.users (id),
  content text not null check (char_length(content) between 1 and 2000),
  created_at timestamptz not null default now(),
  foreign key (task_id, company_id) references public.tasks (id, company_id) on delete cascade
);

create table public.notification_templates (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies (id) on delete cascade,
  event_type text not null,
  channel text not null check (channel in ('email', 'whatsapp')),
  body text not null,
  unique (company_id, event_type, channel)
);

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies (id) on delete cascade,
  channel text not null check (channel in ('email', 'whatsapp')),
  recipient text not null,
  event_type text not null,
  payload jsonb not null default '{}'::jsonb,
  status text not null default 'pending' check (status in ('pending', 'sent', 'failed')),
  created_at timestamptz not null default now(),
  sent_at timestamptz
);
create index notifications_pending_idx on public.notifications (status, created_at);

create table public.integrations (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies (id) on delete cascade,
  provider text not null check (provider in ('google_calendar', 'whatsapp', 'email')),
  status text not null default 'disconnected' check (status in ('connected', 'disconnected', 'error')),
  created_at timestamptz not null default now(),
  unique (company_id, provider)
);

create table public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies (id) on delete cascade,
  actor_id uuid references auth.users (id),
  action text not null,
  entity text not null,
  entity_id uuid,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index audit_logs_company_created_idx on public.audit_logs (company_id, created_at);

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

grant select, insert, update, delete on
  public.availability_exceptions, public.customer_addresses, public.work_orders,
  public.service_requests, public.work_order_items, public.work_order_events,
  public.task_boards, public.task_columns, public.tasks, public.task_assignees,
  public.task_checklist_items, public.task_comments, public.notification_templates,
  public.notifications, public.integrations, public.audit_logs
  to authenticated;

revoke update, delete on public.work_order_events from authenticated;
revoke update, delete on public.audit_logs from authenticated;

create policy availability_exceptions_select on public.availability_exceptions
  for select to authenticated using (public.is_member_of(company_id));
create policy availability_exceptions_manage on public.availability_exceptions
  for all to authenticated
  using (public.is_member_of(company_id, array['owner', 'admin']))
  with check (public.is_member_of(company_id, array['owner', 'admin']));

create policy customer_addresses_select on public.customer_addresses
  for select to authenticated using (public.is_member_of(company_id));
create policy customer_addresses_write on public.customer_addresses
  for all to authenticated
  using (public.is_member_of(company_id, array['owner', 'admin', 'member']))
  with check (public.is_member_of(company_id, array['owner', 'admin', 'member']));

create policy work_orders_select on public.work_orders
  for select to authenticated using (public.is_member_of(company_id));
create policy work_orders_write on public.work_orders
  for all to authenticated
  using (public.is_member_of(company_id, array['owner', 'admin', 'member']))
  with check (public.is_member_of(company_id, array['owner', 'admin', 'member']));

create policy service_requests_select on public.service_requests
  for select to authenticated using (public.is_member_of(company_id));
create policy service_requests_write on public.service_requests
  for all to authenticated
  using (public.is_member_of(company_id, array['owner', 'admin', 'member']))
  with check (public.is_member_of(company_id, array['owner', 'admin', 'member']));

create policy work_order_items_select on public.work_order_items
  for select to authenticated using (public.is_member_of(company_id));
create policy work_order_items_write on public.work_order_items
  for all to authenticated
  using (public.is_member_of(company_id, array['owner', 'admin', 'member']))
  with check (public.is_member_of(company_id, array['owner', 'admin', 'member']));

create policy work_order_events_select on public.work_order_events
  for select to authenticated using (public.is_member_of(company_id));
create policy work_order_events_insert on public.work_order_events
  for insert to authenticated
  with check (public.is_member_of(company_id, array['owner', 'admin', 'member']) and actor_id = auth.uid());

create policy task_boards_select on public.task_boards
  for select to authenticated using (public.is_member_of(company_id));
create policy task_boards_manage on public.task_boards
  for all to authenticated
  using (public.is_member_of(company_id, array['owner', 'admin']))
  with check (public.is_member_of(company_id, array['owner', 'admin']));

create policy task_columns_select on public.task_columns
  for select to authenticated using (public.is_member_of(company_id));
create policy task_columns_manage on public.task_columns
  for all to authenticated
  using (public.is_member_of(company_id, array['owner', 'admin']))
  with check (public.is_member_of(company_id, array['owner', 'admin']));

create policy tasks_select on public.tasks
  for select to authenticated using (public.is_member_of(company_id));
create policy tasks_write on public.tasks
  for all to authenticated
  using (public.is_member_of(company_id, array['owner', 'admin', 'member']))
  with check (public.is_member_of(company_id, array['owner', 'admin', 'member']));

create policy task_assignees_select on public.task_assignees
  for select to authenticated using (public.is_member_of(company_id));
create policy task_assignees_write on public.task_assignees
  for all to authenticated
  using (public.is_member_of(company_id, array['owner', 'admin', 'member']))
  with check (public.is_member_of(company_id, array['owner', 'admin', 'member']));

create policy task_checklist_items_select on public.task_checklist_items
  for select to authenticated using (public.is_member_of(company_id));
create policy task_checklist_items_write on public.task_checklist_items
  for all to authenticated
  using (public.is_member_of(company_id, array['owner', 'admin', 'member']))
  with check (public.is_member_of(company_id, array['owner', 'admin', 'member']));

create policy task_comments_select on public.task_comments
  for select to authenticated using (public.is_member_of(company_id));
create policy task_comments_insert on public.task_comments
  for insert to authenticated
  with check (public.is_member_of(company_id, array['owner', 'admin', 'member']) and user_id = auth.uid());

create policy notification_templates_select on public.notification_templates
  for select to authenticated using (public.is_member_of(company_id, array['owner', 'admin']));
create policy notification_templates_manage on public.notification_templates
  for all to authenticated
  using (public.is_member_of(company_id, array['owner', 'admin']))
  with check (public.is_member_of(company_id, array['owner', 'admin']));

create policy notifications_select on public.notifications
  for select to authenticated using (public.is_member_of(company_id, array['owner', 'admin']));

create policy integrations_select on public.integrations
  for select to authenticated using (public.is_member_of(company_id, array['owner', 'admin']));
create policy integrations_manage on public.integrations
  for all to authenticated
  using (public.is_member_of(company_id, array['owner', 'admin']))
  with check (public.is_member_of(company_id, array['owner', 'admin']));

create policy audit_logs_select on public.audit_logs
  for select to authenticated using (public.is_member_of(company_id, array['owner', 'admin']));
