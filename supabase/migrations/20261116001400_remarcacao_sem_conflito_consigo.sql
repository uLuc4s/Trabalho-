create or replace function public.public_reschedule_booking(p_token text, p_new_starts_at timestamptz)
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

  -- Tira o próprio agendamento da conta enquanto checa o horário novo.
  -- Se a checagem falhar, a exceção desfaz essa mudança.
  update public.appointments set status = 'cancelled' where id = v_app.id;

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
  set status = v_app.status, starts_at = p_new_starts_at, ends_at = v_new_ends
  where id = v_app.id;

  return json_build_object('starts_at', p_new_starts_at, 'ends_at', v_new_ends);
end;
$$;
