-- FUNDAÇÃO DO BANCO
-- Cria as tabelas principais, as funções de acesso e as regras de segurança (RLS).
-- Esta migration já foi aplicada no projeto. Mudanças posteriores estão em arquivos
-- com número maior, como 20261116001300 (correção do convite).

-- Extensão que permite índice de intervalo de tempo, usada para impedir horários sobrepostos.
create extension if not exists btree_gist;

-- Perfil público do usuário logado. Uma linha por usuário do auth.
-- Entrada: criada automaticamente pelo gatilho handle_new_user.
-- Saída: nome e telefone usados nas telas do painel.
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade, -- mesmo id do usuário; se o usuário for apagado, o perfil some
  full_name text not null, -- nome exibido no painel
  phone text, -- telefone opcional
  created_at timestamptz not null default now() -- quando o perfil foi criado
);

-- Empresa cadastrada (a oficina, a barbearia, etc.). Cada uma tem seu link público.
create table public.companies (
  id uuid primary key default gen_random_uuid(), -- identificador da empresa
  name text not null, -- nome da empresa
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'), -- parte da URL pública; só letras minúsculas, números e hífens
  timezone text not null default 'America/Sao_Paulo', -- fuso usado nos horários
  created_at timestamptz not null default now()
);

-- Vínculo entre usuário e empresa, com papel (dono, admin, membro, visualizador).
-- Saída: é a base de toda checagem de permissão do sistema.
create table public.company_members (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies (id) on delete cascade, -- empresa do vínculo
  user_id uuid not null references auth.users (id) on delete cascade, -- usuário do vínculo
  role text not null check (role in ('owner', 'admin', 'member', 'viewer')), -- papel dentro da empresa
  status text not null default 'active' check (status in ('active', 'inactive')), -- vínculo ativo ou desativado
  created_at timestamptz not null default now(),
  unique (company_id, user_id), -- um usuário só tem um vínculo por empresa
  unique (id, company_id) -- permite que outras tabelas referenciem o vínculo junto com a empresa
);
create index company_members_user_id_idx on public.company_members (user_id); -- acelera a busca "em quais empresas esse usuário está"

-- Convite para alguém entrar na equipe. Só guarda o hash do token, nunca o token.
create table public.invitations (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies (id) on delete cascade, -- empresa que convidou
  email text not null check (email = lower(email)), -- e-mail convidado, sempre minúsculo
  role text not null check (role in ('admin', 'member', 'viewer')), -- papel que a pessoa recebe ao aceitar (dono não é convidado)
  token_hash text not null unique, -- sha256 do token secreto; o link leva o token, o banco guarda só o hash
  expires_at timestamptz not null, -- data limite para aceitar
  accepted_at timestamptz, -- preenchido quando alguém aceita; convite aceito não pode ser usado de novo
  created_by uuid not null references auth.users (id), -- quem convidou (usado na checagem da política)
  created_at timestamptz not null default now()
);
create index invitations_company_id_idx on public.invitations (company_id); -- acelera a listagem de convites por empresa

-- Serviços que a empresa oferece (ex.: troca de óleo, corte de cabelo).
create table public.services (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies (id) on delete cascade, -- dona do serviço
  name text not null, -- nome do serviço
  duration_minutes integer not null check (duration_minutes > 0), -- duração; define o tamanho do horário ocupado
  price numeric(10, 2) check (price >= 0), -- preço; null significa "sob consulta"
  active boolean not null default true, -- desativado some da página pública mas mantém o histórico
  created_at timestamptz not null default now(),
  unique (id, company_id) -- permite referência segura com a empresa
);

-- Profissional que atende (barbeiro, mecânico, advogado...). Pode ou não ser um usuário do sistema.
create table public.employees (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies (id) on delete cascade, -- empresa do profissional
  member_id uuid, -- vínculo de usuário, se o profissional também usa o painel
  display_name text not null, -- nome mostrado ao cliente
  active boolean not null default true, -- inativo não recebe novos agendamentos
  created_at timestamptz not null default now(),
  unique (id, company_id),
  -- se o vínculo de usuário for apagado, apenas o campo member_id é zerado, o profissional permanece
  foreign key (member_id, company_id) references public.company_members (id, company_id) on delete set null (member_id)
);

-- Quais serviços cada profissional realiza.
create table public.employee_services (
  company_id uuid not null, -- empresa, repetida para a checagem de integridade
  employee_id uuid not null, -- profissional
  service_id uuid not null, -- serviço
  primary key (employee_id, service_id), -- um par profissional-serviço não se repete
  foreign key (employee_id, company_id) references public.employees (id, company_id) on delete cascade, -- impede ligar profissional de outra empresa
  foreign key (service_id, company_id) references public.services (id, company_id) on delete cascade -- impede ligar serviço de outra empresa
);

-- Horário de trabalho de cada profissional, por dia da semana.
create table public.working_hours (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null, -- empresa, repetida para a checagem de integridade
  employee_id uuid not null, -- profissional
  weekday smallint not null check (weekday between 0 and 6), -- 0 = domingo ... 6 = sábado
  start_time time not null, -- início do expediente naquele dia
  end_time time not null, -- fim do expediente
  check (end_time > start_time), -- o fim precisa ser depois do início
  foreign key (employee_id, company_id) references public.employees (id, company_id) on delete cascade
);
create index working_hours_employee_idx on public.working_hours (employee_id, weekday); -- acelera a busca de expediente por profissional e dia

-- Cliente da empresa. O mesmo telefone não se repete na mesma empresa.
create table public.customers (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies (id) on delete cascade, -- empresa do cliente
  name text not null, -- nome do cliente
  phone text not null check (phone ~ '^\+?[0-9]{10,15}$'), -- telefone só com dígitos (e + opcional), 10 a 15 números
  email text, -- e-mail opcional
  created_at timestamptz not null default now(),
  unique (id, company_id),
  unique (company_id, phone) -- um telefone por empresa: é assim que o sistema reconhece o cliente que volta
);

-- Agendamento: um cliente, um serviço, um profissional, em um horário.
create table public.appointments (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies (id) on delete cascade, -- empresa do agendamento
  employee_id uuid not null, -- profissional escolhido
  service_id uuid not null, -- serviço agendado
  customer_id uuid not null, -- cliente
  starts_at timestamptz not null, -- início
  ends_at timestamptz not null, -- fim
  status text not null default 'confirmed'
    check (status in ('pending_confirmation', 'confirmed', 'completed', 'cancelled', 'no_show')), -- situação do atendimento
  created_at timestamptz not null default now(),
  check (ends_at > starts_at), -- o fim precisa vir depois do início
  foreign key (employee_id, company_id) references public.employees (id, company_id),
  foreign key (service_id, company_id) references public.services (id, company_id),
  foreign key (customer_id, company_id) references public.customers (id, company_id),
  -- Regra de conflito: o mesmo profissional não pode ter dois horários sobrepostos.
  -- Cancelados não entram na regra, por isso um horário cancelado fica livre de novo.
  exclude using gist (
    employee_id with =,
    tstzrange(starts_at, ends_at, '[)') with &&
  ) where (status <> 'cancelled')
);
create index appointments_company_starts_idx on public.appointments (company_id, starts_at); -- acelera a agenda de um dia

-- Função que responde: "o usuário logado é membro desta empresa com um destes papéis?"
-- Entrada: id da empresa e lista de papéis aceitos (todos por padrão).
-- Saída: true ou false.
-- security definer: roda com permissão do dono da função para ler company_members sem bloqueio da própria RLS.
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
      and m.user_id = auth.uid() -- o usuário precisa ser quem está logado
      and m.status = 'active' -- vínculo ativo
      and m.role = any (p_roles) -- papel está na lista permitida
  );
$$;

-- Gatilho: cria o perfil automaticamente quando um usuário é cadastrado no auth.
-- Entrada: a linha do novo usuário (new).
-- Saída: insere uma linha em profiles com o nome vindo do cadastro, ou o e-mail se não houver nome.
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

-- Liga o gatilho acima: roda depois de cada novo usuário ser criado.
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Cria uma empresa e torna o usuário logado o dono dela.
-- Entrada: nome, slug (link público) e fuso.
-- Saída: id da nova empresa.
-- Bloqueia usuário não logado. Usa security definer porque o usuário ainda não tem vínculo para passar pela RLS.
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
  v_company_id uuid; -- guarda o id da empresa recém-criada
begin
  if auth.uid() is null then
    raise exception 'não autenticado' using errcode = '28000'; -- sem sessão, a operação é recusada
  end if;

  insert into public.companies (name, slug, timezone)
  values (p_name, p_slug, p_timezone)
  returning id into v_company_id; -- pega o id gerado

  -- Quem cria a empresa vira dono dela.
  insert into public.company_members (company_id, user_id, role)
  values (v_company_id, auth.uid(), 'owner');

  return v_company_id;
end;
$$;

-- Aceita um convite pelo token recebido por link.
-- Entrada: token secreto do convite.
-- Saída: id da empresa à qual a pessoa entrou.
-- Checagens: usuário logado, convite válido e não usado, e e-mail igual ao do convite.
create function public.accept_invitation(p_token text)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_invitation public.invitations; -- o convite encontrado
  v_email text := lower(auth.jwt() ->> 'email'); -- e-mail do usuário logado, em minúsculo
begin
  if auth.uid() is null then
    raise exception 'não autenticado' using errcode = '28000';
  end if;

  -- Procura o convite pelo hash do token. "for update" trava a linha para evitar uso duplo ao mesmo tempo.
  select * into v_invitation
  from public.invitations
  where token_hash = encode(sha256(convert_to(p_token, 'UTF8')), 'hex')
    and accepted_at is null -- ainda não aceito
    and expires_at > now() -- ainda dentro do prazo
  for update;

  if not found then
    raise exception 'convite inválido ou expirado' using errcode = 'P0001';
  end if;

  -- O convite só vale para o e-mail para o qual foi enviado.
  if v_invitation.email <> v_email then
    raise exception 'convite destinado a outro e-mail' using errcode = '42501';
  end if;

  -- ATENÇÃO: esta versão rebaixa quem já é membro (role = excluded.role).
  -- A correção está na migration 20261116001300, que mantém o papel atual.
  insert into public.company_members (company_id, user_id, role)
  values (v_invitation.company_id, auth.uid(), v_invitation.role)
  on conflict (company_id, user_id)
  do update set role = excluded.role, status = 'active';

  -- Marca o convite como usado, para que não possa ser aceito de novo.
  update public.invitations set accepted_at = now() where id = v_invitation.id;

  return v_invitation.company_id;
end;
$$;

-- Ninguém chama o gatilho diretamente pela API. Remove a permissão de execução.
revoke execute on function public.handle_new_user() from public, anon, authenticated;

-- Liga a proteção de linha (RLS) em todas as tabelas. Sem política, nada é permitido.
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

-- Políticas: cada uma diz quem pode ler ou alterar quais linhas.

-- Usuário lê só o próprio perfil.
create policy profiles_select_own on public.profiles
  for select to authenticated using (id = auth.uid());

-- Usuário altera só o próprio perfil.
create policy profiles_update_own on public.profiles
  for update to authenticated using (id = auth.uid()) with check (id = auth.uid());

-- Membro lê dados da própria empresa.
create policy companies_select_members on public.companies
  for select to authenticated using (public.is_member_of(id));

-- Só dono e admin alteram a empresa.
create policy companies_update_admins on public.companies
  for update to authenticated
  using (public.is_member_of(id, array['owner', 'admin']))
  with check (public.is_member_of(id, array['owner', 'admin']));

-- Membro lê a lista de membros da própria empresa.
create policy company_members_select_members on public.company_members
  for select to authenticated using (public.is_member_of(company_id));

-- Só dono e admin gerenciam convites, e quem cria precisa ser o próprio usuário logado.
create policy invitations_manage_admins on public.invitations
  for all to authenticated
  using (public.is_member_of(company_id, array['owner', 'admin']))
  with check (public.is_member_of(company_id, array['owner', 'admin']) and created_by = auth.uid());

-- Membro lê os serviços da empresa.
create policy services_select_members on public.services
  for select to authenticated using (public.is_member_of(company_id));

-- Só dono e admin criam, alteram ou apagam serviços.
create policy services_manage_admins on public.services
  for all to authenticated
  using (public.is_member_of(company_id, array['owner', 'admin']))
  with check (public.is_member_of(company_id, array['owner', 'admin']));

-- Membro lê os profissionais.
create policy employees_select_members on public.employees
  for select to authenticated using (public.is_member_of(company_id));

-- Só dono e admin gerenciam profissionais.
create policy employees_manage_admins on public.employees
  for all to authenticated
  using (public.is_member_of(company_id, array['owner', 'admin']))
  with check (public.is_member_of(company_id, array['owner', 'admin']));

-- Membro lê quais serviços cada profissional faz.
create policy employee_services_select_members on public.employee_services
  for select to authenticated using (public.is_member_of(company_id));

-- Só dono e admin alteram essa ligação.
create policy employee_services_manage_admins on public.employee_services
  for all to authenticated
  using (public.is_member_of(company_id, array['owner', 'admin']))
  with check (public.is_member_of(company_id, array['owner', 'admin']));

-- Membro lê os horários de trabalho.
create policy working_hours_select_members on public.working_hours
  for select to authenticated using (public.is_member_of(company_id));

-- Só dono e admin alteram os horários.
create policy working_hours_manage_admins on public.working_hours
  for all to authenticated
  using (public.is_member_of(company_id, array['owner', 'admin']))
  with check (public.is_member_of(company_id, array['owner', 'admin']));

-- Membro lê os clientes.
create policy customers_select_members on public.customers
  for select to authenticated using (public.is_member_of(company_id));

-- Dono, admin e membro cadastram e alteram clientes. Visualizador só lê.
create policy customers_write_operators on public.customers
  for all to authenticated
  using (public.is_member_of(company_id, array['owner', 'admin', 'member']))
  with check (public.is_member_of(company_id, array['owner', 'admin', 'member']));

-- Membro lê os agendamentos.
create policy appointments_select_members on public.appointments
  for select to authenticated using (public.is_member_of(company_id));

-- Dono, admin e membro criam e alteram agendamentos. Visualizador só lê.
create policy appointments_write_operators on public.appointments
  for all to authenticated
  using (public.is_member_of(company_id, array['owner', 'admin', 'member']))
  with check (public.is_member_of(company_id, array['owner', 'admin', 'member']));
