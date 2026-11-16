-- AGENDAMENTO PÚBLICO (SEM LOGIN)
-- Objetivo: o cliente vê os horários livres, agenda, consulta e cancela, sem criar conta.
-- Quem fala com o banco é o visitante (papel anon) através destas funções. Nenhuma tabela é aberta.
-- Esta migration foi aplicada. Algumas funções aqui foram substituídas depois:
--   public_company_info   -> 20261116000600 e 20261116001100
--   public_create_booking -> 20261116000900 e 20261116001100
--   public_get_booking    -> 20261116000800

-- Configurações de cada empresa: se a página pública está ligada e a antecedência mínima para cancelar.
alter table public.companies
  add column public_enabled boolean not null default true, -- false esconde a página pública
  add column cancellation_hours integer not null default 2 check (cancellation_hours >= 0); -- horas mínimas de antecedência

-- Token de consulta guardado como hash. O cliente recebe o token; o banco guarda só o hash.
alter table public.appointments add column access_token_hash text unique;

-- Devolve os dados públicos de uma empresa: nome, fuso, serviços ativos e profissionais ativos.
-- Entrada: slug da empresa (parte do link público).
-- Saída: JSON com a empresa. Erro P0002 se a empresa não existir ou estiver desligada.
create function public.public_company_info(p_slug text)
returns json
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_company public.companies; -- empresa encontrada
begin
  select * into v_company from public.companies where slug = p_slug and public_enabled;
  if not found then
    raise exception 'empresa não encontrada' using errcode = 'P0002';
  end if;

  return json_build_object(
    'name', v_company.name,
    'timezone', v_company.timezone,
    -- Serviços ativos, em ordem alfabética. Lista vazia se não houver nenhum.
    'services', coalesce((
      select json_agg(json_build_object(
        'id', s.id, 'name', s.name, 'duration_minutes', s.duration_minutes, 'price', s.price
      ) order by s.name)
      from public.services s
      where s.company_id = v_company.id and s.active
    ), '[]'::json),
    -- Profissionais ativos. Lista vazia se não houver nenhum.
    'employees', coalesce((
      select json_agg(json_build_object(
        'id', e.id, 'display_name', e.display_name
      ) order by e.display_name)
      from public.employees e
      where e.company_id = v_company.id and e.active
    ), '[]'::json)
  );
end;
$$;

-- Lista os horários livres de um serviço, em blocos de 30 minutos.
-- Entrada: slug da empresa, serviço, dia e (opcional) profissional específico.
-- Saída: linhas com o início do horário e o profissional que atende.
-- Regras: pelo menos 1 hora à frente de agora; sem agendamento ativo sobreposto; sem exceção de agenda (folga, feriado).
create function public.public_available_slots(
  p_slug text,
  p_service_id uuid,
  p_date date,
  p_employee_id uuid default null
)
returns table (slot_start timestamptz, slot_employee_id uuid)
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_company public.companies; -- empresa
  v_duration integer; -- duração do serviço em minutos
begin
  select * into v_company from public.companies where slug = p_slug and public_enabled;
  if not found then
    raise exception 'empresa não encontrada' using errcode = 'P0002';
  end if;

  -- O serviço precisa existir, estar ativo e ser da própria empresa.
  select sv.duration_minutes into v_duration
  from public.services sv
  where sv.id = p_service_id and sv.company_id = v_company.id and sv.active;
  if not found then
    raise exception 'serviço inválido' using errcode = 'P0002';
  end if;

  return query
  with candidates as (
    -- Gera todos os inícios possíveis: a cada 30 minutos dentro do expediente do dia.
    select
      e.id as emp_id,
      ((p_date + wh.start_time) at time zone v_company.timezone) + make_interval(mins => g.step) as cand_start
    from public.employees e
    join public.employee_services es on es.employee_id = e.id and es.service_id = p_service_id
    join public.working_hours wh
      on wh.employee_id = e.id
     and wh.company_id = v_company.id
     and wh.weekday = extract(dow from p_date)::smallint -- dia da semana do pedido
    cross join lateral generate_series(
      0,
      (extract(epoch from (wh.end_time - wh.start_time)) / 60)::int - v_duration, -- último início que ainda cabe no expediente
      30
    ) as g(step)
    where e.company_id = v_company.id
      and e.active
      and (p_employee_id is null or e.id = p_employee_id)
  )
  select c.cand_start, c.emp_id
  from candidates c
  where c.cand_start > now() + interval '1 hour' -- antecedência mínima de 1 hora
    -- Descarta horários que batem com um agendamento ativo do profissional.
    and not exists (
      select 1 from public.appointments a
      where a.employee_id = c.emp_id
        and a.status <> 'cancelled'
        and tstzrange(a.starts_at, a.ends_at, '[)')
            && tstzrange(c.cand_start, c.cand_start + make_interval(mins => v_duration), '[)')
    )
    -- Descarta horários bloqueados por exceção (da empresa inteira ou do profissional).
    and not exists (
      select 1 from public.availability_exceptions x
      where x.company_id = v_company.id
        and (x.employee_id is null or x.employee_id = c.emp_id)
        and tstzrange(x.starts_at, x.ends_at, '[)')
            && tstzrange(c.cand_start, c.cand_start + make_interval(mins => v_duration), '[)')
    )
  order by c.cand_start, c.emp_id;
end;
$$;

-- Cria o agendamento de um cliente visitante. Cria ou atualiza o cliente pelo telefone.
-- Entrada: empresa, serviço, profissional, horário, nome, telefone e e-mail opcional.
-- Saída: id do agendamento, token de consulta (guardado só como hash), início e fim.
create function public.public_create_booking(
  p_slug text,
  p_service_id uuid,
  p_employee_id uuid,
  p_starts_at timestamptz,
  p_name text,
  p_phone text,
  p_email text default null
)
returns json
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_company public.companies; -- empresa
  v_duration integer; -- duração do serviço
  v_phone text := regexp_replace(coalesce(p_phone, ''), '\D', '', 'g'); -- telefone só com dígitos
  v_customer_id uuid; -- cliente criado ou atualizado
  v_appointment_id uuid; -- agendamento criado
  -- Token de 64 caracteres aleatórios para o cliente consultar, remarcar ou cancelar depois.
  v_token text := replace(gen_random_uuid()::text || gen_random_uuid()::text, '-', '');
  v_ends_at timestamptz; -- fim do atendimento
begin
  select * into v_company from public.companies where slug = p_slug and public_enabled;
  if not found then
    raise exception 'empresa não encontrada' using errcode = 'P0002';
  end if;

  -- Nome com pelo menos 2 caracteres.
  if char_length(trim(coalesce(p_name, ''))) < 2 then
    raise exception 'nome inválido' using errcode = '22023';
  end if;

  -- Telefone com 10 ou 11 dígitos recebe o DDI 55 (Brasil).
  if char_length(v_phone) between 10 and 11 then
    v_phone := '55' || v_phone;
  end if;
  -- Depois disso precisa ter 12 ou 13 dígitos.
  if char_length(v_phone) not between 12 and 13 then
    raise exception 'telefone inválido' using errcode = '22023';
  end if;
  v_phone := '+' || v_phone;

  select sv.duration_minutes into v_duration
  from public.services sv
  where sv.id = p_service_id and sv.company_id = v_company.id and sv.active;
  if not found then
    raise exception 'serviço inválido' using errcode = 'P0002';
  end if;

  -- Trava o profissional (for update) e confirma que ele faz o serviço. Evita dois agendamentos ao mesmo tempo.
  perform 1
  from public.employees e
  join public.employee_services es on es.employee_id = e.id and es.service_id = p_service_id
  where e.id = p_employee_id and e.company_id = v_company.id and e.active
  for update of e;
  if not found then
    raise exception 'profissional não atende este serviço' using errcode = 'P0002';
  end if;

  -- Confirma que o horário ainda está livre, usando a mesma regra da consulta de horários.
  perform 1
  from public.public_available_slots(
    p_slug, p_service_id, (p_starts_at at time zone v_company.timezone)::date, p_employee_id
  ) s
  where s.slot_start = p_starts_at;
  if not found then
    raise exception 'horário indisponível' using errcode = 'P0001';
  end if;

  v_ends_at := p_starts_at + make_interval(mins => v_duration);

  -- Cria o cliente, ou atualiza nome e e-mail se o telefone já existir na empresa.
  insert into public.customers (company_id, name, phone, email)
  values (v_company.id, trim(p_name), v_phone, lower(nullif(trim(coalesce(p_email, '')), '')))
  on conflict (company_id, phone) do update
    set name = excluded.name,
        email = coalesce(excluded.email, public.customers.email)
  returning id into v_customer_id;

  -- Cria o agendamento já confirmado, guardando só o hash do token.
  insert into public.appointments (
    company_id, employee_id, service_id, customer_id, starts_at, ends_at, status, access_token_hash
  )
  values (
    v_company.id, p_employee_id, p_service_id, v_customer_id, p_starts_at, v_ends_at, 'confirmed',
    encode(sha256(convert_to(v_token, 'UTF8')), 'hex')
  )
  returning id into v_appointment_id;

  -- Se houver e-mail, registra a confirmação para envio (o envio real ainda depende de provedor).
  if p_email is not null and trim(p_email) <> '' then
    insert into public.notifications (company_id, channel, recipient, event_type, payload)
    values (
      v_company.id, 'email', lower(trim(p_email)), 'booking_confirmed',
      json_build_object('appointment_id', v_appointment_id, 'starts_at', p_starts_at)
    );
  end if;

  return json_build_object(
    'appointment_id', v_appointment_id,
    'token', v_token, -- o único lugar onde o token aparece em texto puro: a resposta para o cliente
    'starts_at', p_starts_at,
    'ends_at', v_ends_at
  );
end;
$$;

-- Consulta um agendamento pelo token, para o cliente ver os dados.
-- Entrada: token recebido na confirmação.
-- Saída: JSON com status, horário, serviço, profissional, empresa e se ainda pode cancelar.
create function public.public_get_booking(p_token text)
returns json
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_row record; -- linha juntada de agendamento, empresa, serviço e profissional
begin
  select a.status, a.starts_at, a.ends_at, sv.name as service_name,
         e.display_name as employee_name, c.name as company_name, c.cancellation_hours
    into v_row
  from public.appointments a
  join public.companies c on c.id = a.company_id
  join public.services sv on sv.id = a.service_id
  join public.employees e on e.id = a.employee_id
  where a.access_token_hash = encode(sha256(convert_to(p_token, 'UTF8')), 'hex');
  if not found then
    raise exception 'agendamento não encontrado' using errcode = 'P0002';
  end if;

  return json_build_object(
    'status', v_row.status,
    'starts_at', v_row.starts_at,
    'ends_at', v_row.ends_at,
    'service', v_row.service_name,
    'employee', v_row.employee_name,
    'company', v_row.company_name,
    -- Pode cancelar só se ainda estiver ativo e dentro do prazo de antecedência.
    'cancellable', v_row.status in ('pending_confirmation', 'confirmed')
      and v_row.starts_at - now() >= make_interval(hours => v_row.cancellation_hours)
  );
end;
$$;

-- Cancela um agendamento pelo token, respeitando o prazo da empresa.
-- Entrada: token. Saída: { status: 'cancelled' }. Já cancelado não dá erro.
create function public.public_cancel_booking(p_token text)
returns json
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_appointment public.appointments; -- agendamento encontrado
  v_hours integer; -- prazo de cancelamento da empresa
begin
  -- Trava a linha para que dois cancelamentos ao mesmo tempo não conflitem.
  select a.* into v_appointment
  from public.appointments a
  where a.access_token_hash = encode(sha256(convert_to(p_token, 'UTF8')), 'hex')
  for update;
  if not found then
    raise exception 'agendamento não encontrado' using errcode = 'P0002';
  end if;

  -- Já cancelado: responde sucesso sem alterar nada.
  if v_appointment.status = 'cancelled' then
    return json_build_object('status', 'cancelled');
  end if;

  -- Só agendamento ativo pode ser cancelado (concluído ou faltou não pode).
  if v_appointment.status not in ('pending_confirmation', 'confirmed') then
    raise exception 'agendamento não pode ser cancelado' using errcode = 'P0001';
  end if;

  -- Confere o prazo de antecedência da empresa.
  select c.cancellation_hours into v_hours from public.companies c where c.id = v_appointment.company_id;
  if v_appointment.starts_at - now() < make_interval(hours => v_hours) then
    raise exception 'prazo de cancelamento encerrado' using errcode = 'P0001';
  end if;

  update public.appointments set status = 'cancelled' where id = v_appointment.id;
  return json_build_object('status', 'cancelled');
end;
$$;

-- Fecha o acesso padrão de execução de funções: ninguém executa, exceto o que for liberado abaixo.
revoke execute on all functions in schema public from public, anon;

-- Funções internas: só usuários logados.
grant execute on function public.is_member_of(uuid, text[]) to authenticated;
grant execute on function public.create_company(text, text, text) to authenticated;
grant execute on function public.accept_invitation(text) to authenticated;

-- Funções públicas: visitante e usuário logado podem executar.
grant execute on function public.public_company_info(text) to anon, authenticated;
grant execute on function public.public_available_slots(text, uuid, date, uuid) to anon, authenticated;
grant execute on function public.public_create_booking(text, uuid, uuid, timestamptz, text, text, text) to anon, authenticated;
grant execute on function public.public_get_booking(text) to anon, authenticated;
grant execute on function public.public_cancel_booking(text) to anon, authenticated;
