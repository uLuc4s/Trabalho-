alter table public.service_requests add column access_token_hash text unique;

create function public.public_request_service(
  p_slug text,
  p_service_id uuid,
  p_name text,
  p_phone text,
  p_window text default null,
  p_notes text default null,
  p_email text default null
)
returns json
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_company public.companies;
  v_phone text := regexp_replace(coalesce(p_phone, ''), '\D', '', 'g');
  v_customer_id uuid;
  v_request_id uuid;
  v_token text := replace(gen_random_uuid()::text || gen_random_uuid()::text, '-', '');
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

  perform 1 from public.services sv
  where sv.id = p_service_id and sv.company_id = v_company.id and sv.active;
  if not found then
    raise exception 'serviço inválido' using errcode = 'P0002';
  end if;

  insert into public.customers (company_id, name, phone, email)
  values (v_company.id, trim(p_name), v_phone, lower(nullif(trim(coalesce(p_email, '')), '')))
  on conflict (company_id, phone) do update
    set name = excluded.name,
        email = coalesce(excluded.email, public.customers.email)
  returning id into v_customer_id;

  insert into public.service_requests (
    company_id, customer_id, service_id, preferred_window, notes, access_token_hash
  )
  values (
    v_company.id, v_customer_id, p_service_id, nullif(trim(coalesce(p_window, '')), ''),
    nullif(trim(coalesce(p_notes, '')), ''),
    encode(sha256(convert_to(v_token, 'UTF8')), 'hex')
  )
  returning id into v_request_id;

  return json_build_object('request_id', v_request_id, 'token', v_token);
end;
$$;

create function public.public_get_service_request(p_token text)
returns json
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_row record;
begin
  select r.status, r.preferred_window, sv.name as service_name, c.name as company_name
    into v_row
  from public.service_requests r
  join public.companies c on c.id = r.company_id
  join public.services sv on sv.id = r.service_id
  where r.access_token_hash = encode(sha256(convert_to(p_token, 'UTF8')), 'hex');
  if not found then
    raise exception 'solicitação não encontrada' using errcode = 'P0002';
  end if;

  return json_build_object(
    'status', v_row.status,
    'service', v_row.service_name,
    'company', v_row.company_name,
    'preferred_window', v_row.preferred_window
  );
end;
$$;

create function public.public_reschedule_booking(p_token text, p_new_starts_at timestamptz)
returns json
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_app public.appointments;
  v_company public.companies;
  v_duration integer;
  v_new_ends timestamptz;
begin
  select a.* into v_app
  from public.appointments a
  where a.access_token_hash = encode(sha256(convert_to(p_token, 'UTF8')), 'hex')
  for update;
  if not found then
    raise exception 'agendamento não encontrado' using errcode = 'P0002';
  end if;

  if v_app.status not in ('pending_confirmation', 'confirmed') then
    raise exception 'agendamento não pode ser remarcado' using errcode = 'P0001';
  end if;

  select c.* into v_company from public.companies c where c.id = v_app.company_id;
  if v_app.starts_at - now() < make_interval(hours => v_company.cancellation_hours) then
    raise exception 'prazo para alterar encerrado' using errcode = 'P0001';
  end if;

  perform 1
  from public.public_available_slots(
    v_company.slug, v_app.service_id, (p_new_starts_at at time zone v_company.timezone)::date, v_app.employee_id
  ) s
  where s.slot_start = p_new_starts_at;
  if not found then
    raise exception 'horário indisponível' using errcode = 'P0001';
  end if;

  select sv.duration_minutes into v_duration from public.services sv where sv.id = v_app.service_id;
  v_new_ends := p_new_starts_at + make_interval(mins => v_duration);

  update public.appointments
  set starts_at = p_new_starts_at, ends_at = v_new_ends
  where id = v_app.id;

  return json_build_object('starts_at', p_new_starts_at, 'ends_at', v_new_ends);
end;
$$;

create function public.app_set_work_order_status(p_work_order_id uuid, p_status text)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_wo public.work_orders;
  v_allowed text[];
begin
  if auth.uid() is null then
    raise exception 'não autenticado' using errcode = '28000';
  end if;

  select * into v_wo from public.work_orders where id = p_work_order_id for update;
  if not found then
    raise exception 'ordem não encontrada' using errcode = 'P0002';
  end if;

  if not public.is_member_of(v_wo.company_id, array['owner', 'admin', 'member']) then
    raise exception 'sem permissão' using errcode = '42501';
  end if;

  v_allowed := case v_wo.status
    when 'open' then array['scheduled', 'cancelled']
    when 'scheduled' then array['in_progress', 'cancelled', 'open']
    when 'in_progress' then array['completed', 'cancelled']
    else array[]::text[]
  end;

  if not (p_status = any (v_allowed)) then
    raise exception 'transição de % para % não é permitida', v_wo.status, p_status using errcode = 'P0001';
  end if;

  update public.work_orders set status = p_status, updated_at = now() where id = v_wo.id;

  insert into public.work_order_events (company_id, work_order_id, actor_id, event_type, payload)
  values (
    v_wo.company_id, v_wo.id, auth.uid(), 'status_changed',
    json_build_object('from', v_wo.status, 'to', p_status)
  );

  return p_status;
end;
$$;

create function public.app_review_service_request(p_request_id uuid, p_decision text)
returns json
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_req public.service_requests;
  v_service_name text;
  v_work_order_id uuid;
begin
  if auth.uid() is null then
    raise exception 'não autenticado' using errcode = '28000';
  end if;

  select * into v_req from public.service_requests where id = p_request_id for update;
  if not found then
    raise exception 'solicitação não encontrada' using errcode = 'P0002';
  end if;

  if not public.is_member_of(v_req.company_id, array['owner', 'admin', 'member']) then
    raise exception 'sem permissão' using errcode = '42501';
  end if;

  if v_req.status not in ('new', 'under_review') then
    raise exception 'solicitação já foi decidida' using errcode = 'P0001';
  end if;

  if p_decision not in ('under_review', 'approved', 'rejected') then
    raise exception 'decisão inválida' using errcode = '22023';
  end if;

  if p_decision = 'approved' then
    select sv.name into v_service_name from public.services sv where sv.id = v_req.service_id;

    insert into public.work_orders (company_id, customer_id, service_id, title, opened_by)
    values (v_req.company_id, v_req.customer_id, v_req.service_id, coalesce(v_service_name, 'Solicitação'), auth.uid())
    returning id into v_work_order_id;

    insert into public.work_order_events (company_id, work_order_id, actor_id, event_type, payload)
    values (v_req.company_id, v_work_order_id, auth.uid(), 'created', json_build_object('request_id', v_req.id));
  end if;

  update public.service_requests
  set status = p_decision,
      work_order_id = coalesce(v_work_order_id, work_order_id)
  where id = v_req.id;

  return json_build_object('status', p_decision, 'work_order_id', v_work_order_id);
end;
$$;

create function public.app_cancel_appointment(p_appointment_id uuid)
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

  if v_app.status not in ('pending_confirmation', 'confirmed') then
    raise exception 'agendamento não pode ser cancelado' using errcode = 'P0001';
  end if;

  update public.appointments set status = 'cancelled' where id = v_app.id;
  return 'cancelled';
end;
$$;

revoke execute on function public.public_request_service(text, uuid, text, text, text, text, text) from public, anon, authenticated;
revoke execute on function public.public_get_service_request(text) from public, anon, authenticated;
revoke execute on function public.public_reschedule_booking(text, timestamptz) from public, anon, authenticated;
revoke execute on function public.app_set_work_order_status(uuid, text) from public, anon, authenticated;
revoke execute on function public.app_review_service_request(uuid, text) from public, anon, authenticated;
revoke execute on function public.app_cancel_appointment(uuid) from public, anon, authenticated;

grant execute on function public.public_request_service(text, uuid, text, text, text, text, text) to anon, authenticated;
grant execute on function public.public_get_service_request(text) to anon, authenticated;
grant execute on function public.public_reschedule_booking(text, timestamptz) to anon, authenticated;
grant execute on function public.app_set_work_order_status(uuid, text) to authenticated;
grant execute on function public.app_review_service_request(uuid, text) to authenticated;
grant execute on function public.app_cancel_appointment(uuid) to authenticated;
