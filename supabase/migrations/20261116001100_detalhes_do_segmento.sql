-- DETALHES DO SEGMENTO NO AGENDAMENTO
-- Objetivo: cada agendamento guarda dados específicos do ramo (placa e veículo na oficina, área do caso na advocacia).
-- O cliente envia esses dados no agendamento, e a página pública passa a informar o segmento.
-- Resultado esperado: coluna details aceita JSON; o agendamento aceita detalhes opcionais.

-- Coluna de detalhes. Padrão: objeto vazio, para não quebrar agendamentos antigos.
alter table public.appointments add column details jsonb not null default '{}'::jsonb;

-- Atualiza a função pública da empresa para informar o segmento do negócio.
-- Entrada: slug. Saída: JSON com perfil, segmento, serviços e profissionais.
create or replace function public.public_company_info(p_slug text)
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
    'description', v_company.description,
    'address', v_company.address,
    'phone', v_company.phone,
    'segment', v_company.segment, -- define campos extras no formulário do cliente
    'payment_methods', to_json(v_company.payment_methods),
    'timezone', v_company.timezone,
    'services', coalesce((
      select json_agg(json_build_object(
        'id', s.id, 'name', s.name, 'description', s.description, 'category', s.category,
        'duration_minutes', s.duration_minutes, 'price', s.price
      ) order by s.category nulls last, s.name)
      from public.services s
      where s.company_id = v_company.id and s.active
    ), '[]'::json),
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

-- Remove a versão antiga do agendamento público, para recriar com o novo parâmetro de detalhes.
drop function if exists public.public_create_booking(text, uuid, uuid, timestamptz, text, text, text);

-- Recria o agendamento público aceitando detalhes opcionais (p_details).
-- Entrada: os dados de sempre mais p_details (JSON livre do segmento, ex.: placa).
-- Saída: id, token, início e fim. Além das regras de antes, aplica limite de tentativas por telefone e por empresa.
create function public.public_create_booking(
  p_slug text,
  p_service_id uuid,
  p_employee_id uuid,
  p_starts_at timestamptz,
  p_name text,
  p_phone text,
  p_email text default null,
  p_details json default null
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
  v_token text := replace(gen_random_uuid()::text || gen_random_uuid()::text, '-', ''); -- token de consulta
  v_ends_at timestamptz; -- fim do atendimento
begin
  select * into v_company from public.companies where slug = p_slug and public_enabled;
  if not found then
    raise exception 'empresa não encontrada' using errcode = 'P0002';
  end if;

  if char_length(trim(coalesce(p_name, ''))) < 2 then
    raise exception 'nome inválido' using errcode = '22023';
  end if;

  if char_length(v_phone) between 10 and 11 then
    v_phone := '55' || v_phone;
  end if;
  if char_length(v_phone) not between 12 and 13 then
    raise exception 'telefone inválido' using errcode = '22023';
  end if;
  v_phone := '+' || v_phone;

  -- Limite de tentativas: no máximo 3 agendamentos por telefone em 1 dia (proteção contra abuso).
  if (select count(*) from public.appointments a
      join public.customers c on c.id = a.customer_id
      where c.company_id = v_company.id and c.phone = v_phone
        and a.created_at > now() - interval '1 day') >= 3 then
    raise exception 'muitas tentativas. Tente novamente amanhã ou fale com a empresa' using errcode = 'P0001';
  end if;
  -- Limite geral: no máximo 60 agendamentos por empresa em 1 hora.
  if (select count(*) from public.appointments a
      where a.company_id = v_company.id and a.created_at > now() - interval '1 hour') >= 60 then
    raise exception 'muitas tentativas nesta empresa. Tente em alguns minutos' using errcode = 'P0001';
  end if;

  select sv.duration_minutes into v_duration
  from public.services sv
  where sv.id = p_service_id and sv.company_id = v_company.id and sv.active;
  if not found then
    raise exception 'serviço inválido' using errcode = 'P0002';
  end if;

  perform 1
  from public.employees e
  join public.employee_services es on es.employee_id = e.id and es.service_id = p_service_id
  where e.id = p_employee_id and e.company_id = v_company.id and e.active
  for update of e;
  if not found then
    raise exception 'profissional não atende este serviço' using errcode = 'P0002';
  end if;

  perform 1
  from public.public_available_slots(
    p_slug, p_service_id, (p_starts_at at time zone v_company.timezone)::date, p_employee_id
  ) s
  where s.slot_start = p_starts_at;
  if not found then
    raise exception 'horário indisponível' using errcode = 'P0001';
  end if;

  v_ends_at := p_starts_at + make_interval(mins => v_duration);

  insert into public.customers (company_id, name, phone, email)
  values (v_company.id, trim(p_name), v_phone, lower(nullif(trim(coalesce(p_email, '')), '')))
  on conflict (company_id, phone) do update
    set name = excluded.name,
        email = coalesce(excluded.email, public.customers.email)
  returning id into v_customer_id;

  -- Grava também os detalhes do segmento; sem detalhes, grava objeto vazio.
  insert into public.appointments (
    company_id, employee_id, service_id, customer_id, starts_at, ends_at, status, access_token_hash, details
  )
  values (
    v_company.id, p_employee_id, p_service_id, v_customer_id, p_starts_at, v_ends_at, 'confirmed',
    encode(sha256(convert_to(v_token, 'UTF8')), 'hex'), coalesce(p_details, '{}'::json)::jsonb
  )
  returning id into v_appointment_id;

  if p_email is not null and trim(p_email) <> '' then
    insert into public.notifications (company_id, channel, recipient, event_type, payload)
    values (
      v_company.id, 'email', lower(trim(p_email)), 'booking_confirmed',
      json_build_object('appointment_id', v_appointment_id, 'starts_at', p_starts_at)
    );
  end if;

  return json_build_object(
    'appointment_id', v_appointment_id,
    'token', v_token,
    'starts_at', p_starts_at,
    'ends_at', v_ends_at
  );
end;
$$;

-- Permissões: a função nova não é pública por padrão. Liberamos explicitamente só para visitante e logado.
revoke execute on function public.public_create_booking(text, uuid, uuid, timestamptz, text, text, text, json) from public, anon, authenticated;
grant execute on function public.public_create_booking(text, uuid, uuid, timestamptz, text, text, text, json) to anon, authenticated;
