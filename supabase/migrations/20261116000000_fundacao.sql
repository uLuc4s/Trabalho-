create extension if not exists btree_gist;

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text not null,
  phone text,
  created_at timestamptz not null default now()
);

create table public.companies (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  timezone text not null default 'America/Sao_Paulo',
  created_at timestamptz not null default now()
);

create table public.company_members (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  role text not null check (role in ('owner', 'admin', 'member', 'viewer')),
  status text not null default 'active' check (status in ('active', 'inactive')),
  created_at timestamptz not null default now(),
  unique (company_id, user_id),
  unique (id, company_id)
);
create index company_members_user_id_idx on public.company_members (user_id);

create table public.invitations (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies (id) on delete cascade,
  email text not null check (email = lower(email)),
  role text not null check (role in ('admin', 'member', 'viewer')),
  token_hash text not null unique,
  expires_at timestamptz not null,
  accepted_at timestamptz,
  created_by uuid not null references auth.users (id),
  created_at timestamptz not null default now()
);
create index invitations_company_id_idx on public.invitations (company_id);

create table public.services (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies (id) on delete cascade,
  name text not null,
  duration_minutes integer not null check (duration_minutes > 0),
  price numeric(10, 2) check (price >= 0),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  unique (id, company_id)
);

create table public.employees (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies (id) on delete cascade,
  member_id uuid,
  display_name text not null,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  unique (id, company_id),
  foreign key (member_id, company_id) references public.company_members (id, company_id) on delete set null (member_id)
);

create table public.employee_services (
  company_id uuid not null,
  employee_id uuid not null,
  service_id uuid not null,
  primary key (employee_id, service_id),
  foreign key (employee_id, company_id) references public.employees (id, company_id) on delete cascade,
  foreign key (service_id, company_id) references public.services (id, company_id) on delete cascade
);

create table public.working_hours (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null,
  employee_id uuid not null,
  weekday smallint not null check (weekday between 0 and 6),
  start_time time not null,
  end_time time not null,
  check (end_time > start_time),
  foreign key (employee_id, company_id) references public.employees (id, company_id) on delete cascade
);
create index working_hours_employee_idx on public.working_hours (employee_id, weekday);

create table public.customers (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies (id) on delete cascade,
  name text not null,
  phone text not null check (phone ~ '^\+?[0-9]{10,15}$'),
  email text,
  created_at timestamptz not null default now(),
  unique (id, company_id),
  unique (company_id, phone)
);

create table public.appointments (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies (id) on delete cascade,
  employee_id uuid not null,
  service_id uuid not null,
  customer_id uuid not null,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  status text not null default 'confirmed'
    check (status in ('pending_confirmation', 'confirmed', 'completed', 'cancelled', 'no_show')),
  created_at timestamptz not null default now(),
  check (ends_at > starts_at),
  foreign key (employee_id, company_id) references public.employees (id, company_id),
  foreign key (service_id, company_id) references public.services (id, company_id),
  foreign key (customer_id, company_id) references public.customers (id, company_id),
  exclude using gist (
    employee_id with =,
    tstzrange(starts_at, ends_at, '[)') with &&
  ) where (status <> 'cancelled')
);
create index appointments_company_starts_idx on public.appointments (company_id, starts_at);

create function public.is_member_of(
  p_company uuid,
  p_roles text[] default array['owner', 'admin', 'member', 'viewer']
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.company_members m
    where m.company_id = p_company
      and m.user_id = auth.uid()
      and m.status = 'active'
      and m.role = any (p_roles)
  );
$$;

create function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'full_name', new.email));
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

create function public.create_company(
  p_name text,
  p_slug text,
  p_timezone text default 'America/Sao_Paulo'
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_company_id uuid;
begin
  if auth.uid() is null then
    raise exception 'não autenticado' using errcode = '28000';
  end if;

  insert into public.companies (name, slug, timezone)
  values (p_name, p_slug, p_timezone)
  returning id into v_company_id;

  insert into public.company_members (company_id, user_id, role)
  values (v_company_id, auth.uid(), 'owner');

  return v_company_id;
end;
$$;

create function public.accept_invitation(p_token text)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_invitation public.invitations;
  v_email text := lower(auth.jwt() ->> 'email');
begin
  if auth.uid() is null then
    raise exception 'não autenticado' using errcode = '28000';
  end if;

  select * into v_invitation
  from public.invitations
  where token_hash = encode(sha256(convert_to(p_token, 'UTF8')), 'hex')
    and accepted_at is null
    and expires_at > now()
  for update;

  if not found then
    raise exception 'convite inválido ou expirado' using errcode = 'P0001';
  end if;

  if v_invitation.email <> v_email then
    raise exception 'convite destinado a outro e-mail' using errcode = '42501';
  end if;

  insert into public.company_members (company_id, user_id, role)
  values (v_invitation.company_id, auth.uid(), v_invitation.role)
  on conflict (company_id, user_id)
  do update set role = excluded.role, status = 'active';

  update public.invitations set accepted_at = now() where id = v_invitation.id;

  return v_invitation.company_id;
end;
$$;

revoke execute on function public.handle_new_user() from public, anon, authenticated;

alter table public.profiles enable row level security;
alter table public.companies enable row level security;
alter table public.company_members enable row level security;
alter table public.invitations enable row level security;
alter table public.services enable row level security;
alter table public.employees enable row level security;
alter table public.employee_services enable row level security;
alter table public.working_hours enable row level security;
alter table public.customers enable row level security;
alter table public.appointments enable row level security;

create policy profiles_select_own on public.profiles
  for select to authenticated using (id = auth.uid());

create policy profiles_update_own on public.profiles
  for update to authenticated using (id = auth.uid()) with check (id = auth.uid());

create policy companies_select_members on public.companies
  for select to authenticated using (public.is_member_of(id));

create policy companies_update_admins on public.companies
  for update to authenticated
  using (public.is_member_of(id, array['owner', 'admin']))
  with check (public.is_member_of(id, array['owner', 'admin']));

create policy company_members_select_members on public.company_members
  for select to authenticated using (public.is_member_of(company_id));

create policy invitations_manage_admins on public.invitations
  for all to authenticated
  using (public.is_member_of(company_id, array['owner', 'admin']))
  with check (public.is_member_of(company_id, array['owner', 'admin']) and created_by = auth.uid());

create policy services_select_members on public.services
  for select to authenticated using (public.is_member_of(company_id));

create policy services_manage_admins on public.services
  for all to authenticated
  using (public.is_member_of(company_id, array['owner', 'admin']))
  with check (public.is_member_of(company_id, array['owner', 'admin']));

create policy employees_select_members on public.employees
  for select to authenticated using (public.is_member_of(company_id));

create policy employees_manage_admins on public.employees
  for all to authenticated
  using (public.is_member_of(company_id, array['owner', 'admin']))
  with check (public.is_member_of(company_id, array['owner', 'admin']));

create policy employee_services_select_members on public.employee_services
  for select to authenticated using (public.is_member_of(company_id));

create policy employee_services_manage_admins on public.employee_services
  for all to authenticated
  using (public.is_member_of(company_id, array['owner', 'admin']))
  with check (public.is_member_of(company_id, array['owner', 'admin']));

create policy working_hours_select_members on public.working_hours
  for select to authenticated using (public.is_member_of(company_id));

create policy working_hours_manage_admins on public.working_hours
  for all to authenticated
  using (public.is_member_of(company_id, array['owner', 'admin']))
  with check (public.is_member_of(company_id, array['owner', 'admin']));

create policy customers_select_members on public.customers
  for select to authenticated using (public.is_member_of(company_id));

create policy customers_write_operators on public.customers
  for all to authenticated
  using (public.is_member_of(company_id, array['owner', 'admin', 'member']))
  with check (public.is_member_of(company_id, array['owner', 'admin', 'member']));

create policy appointments_select_members on public.appointments
  for select to authenticated using (public.is_member_of(company_id));

create policy appointments_write_operators on public.appointments
  for all to authenticated
  using (public.is_member_of(company_id, array['owner', 'admin', 'member']))
  with check (public.is_member_of(company_id, array['owner', 'admin', 'member']));
