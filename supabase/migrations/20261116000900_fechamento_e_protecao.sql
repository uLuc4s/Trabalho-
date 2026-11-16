alter table public.appointments
  add column payment_method text check (payment_method in ('pix', 'cartao', 'dinheiro')),
  add column amount_paid numeric(10, 2) check (amount_paid >= 0),
  add column paid_at timestamptz;

create or replace function public.app_set_appointment_outcome(
  p_appointment_id uuid,
  p_status text,
  p_payment_method text default null,
  p_amount numeric default null
)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_app public.appointments;
begin
  if auth.uid() is null then
    raise exception 'não autenticado' using errcode = '28000';
  end if;

  select * into v_app from public.appointments where id = p_appointment_id for update;
  if not found then
    raise exception 'agendamento não encontrado' using errcode = 'P0002';
  end if;

  if not public.is_member_of(v_app.company_id, array['owner', 'admin', 'member']) then
    raise exception 'sem permissão' using errcode = '42501';
  end if;

  if v_app.status not in ('confirmed', 'pending_confirmation') then
    raise exception 'agendamento já foi fechado' using errcode = 'P0001';
  end if;

  if p_status not in ('completed', 'no_show') then
    raise exception 'situação inválida' using errcode = '22023';
  end if;

  update public.appointments
  set status = p_status,
      payment_method = case when p_status = 'completed' then p_payment_method else null end,
      amount_paid = case when p_status = 'completed' then p_amount else null end,
      paid_at = case when p_status = 'completed' and p_payment_method is not null then now() else null end
  where id = v_app.id;

  return p_status;
end;
$$;

create or replace function public.app_anonymize_customer(p_customer_id uuid)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_customer public.customers;
begin
  if auth.uid() is null then
    raise exception 'não autenticado' using errcode = '28000';
  end if;

  select * into v_customer from public.customers where id = p_customer_id for update;
  if not found then
    raise exception 'cliente não encontrado' using errcode = 'P0002';
  end if;

  if not public.is_member_of(v_customer.company_id, array['owner', 'admin']) then
    raise exception 'sem permissão' using errcode = '42501';
  end if;

  update public.appointments
  set status = 'cancelled'
  where customer_id = v_customer.id and starts_at > now() and status in ('pending_confirmation', 'confirmed');

  update public.customers
  set name = 'Cliente removido',
      phone = '+0' || lpad((floor(random() * 1000000000000))::bigint::text, 12, '0'),
      email = null
  where id = v_customer.id;

  delete from public.customer_addresses where customer_id = v_customer.id;

  return 'anonymized';
end;
$$;

create or replace function public.public_create_booking(
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
  v_company public.companies;
  v_duration integer;
  v_phone text := regexp_replace(coalesce(p_phone, ''), '\D', '', 'g');
  v_customer_id uuid;
  v_appointment_id uuid;
  v_token text := replace(gen_random_uuid()::text || gen_random_uuid()::text, '-', '');
  v_ends_at timestamptz;
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

  -- Limite de agendamentos novos por telefone (3 por dia) e por empresa (60 por hora)
  if (select count(*) from public.appointments a
      join public.customers c on c.id = a.customer_id
      where c.company_id = v_company.id and c.phone = v_phone
        and a.created_at > now() - interval '1 day') >= 3 then
    raise exception 'muitas tentativas. Tente novamente amanhã ou fale com a empresa' using errcode = 'P0001';
  end if;
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

  insert into public.appointments (
    company_id, employee_id, service_id, customer_id, starts_at, ends_at, status, access_token_hash
  )
  values (
    v_company.id, p_employee_id, p_service_id, v_customer_id, p_starts_at, v_ends_at, 'confirmed',
    encode(sha256(convert_to(v_token, 'UTF8')), 'hex')
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

revoke execute on function public.app_set_appointment_outcome(uuid, text, text, numeric) from public, anon;
revoke execute on function public.app_anonymize_customer(uuid) from public, anon;
grant execute on function public.app_set_appointment_outcome(uuid, text, text, numeric) to authenticated;
grant execute on function public.app_anonymize_customer(uuid) to authenticated;
