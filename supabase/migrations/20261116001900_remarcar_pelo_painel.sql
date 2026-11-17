-- REMARCAR ATENDIMENTO PELO PAINEL
-- Objetivo: a equipe move um atendimento para outro horário, sem precisar cancelar e recriar.
-- Regras: só membros (dono, admin ou membro) da empresa; só atendimento ativo; o novo horário não pode
-- sobrepor outro atendimento ativo do mesmo profissional nem uma exceção de agenda (folga, feriado).
-- O próprio atendimento não conta como conflito.

-- Entrada: id do atendimento e novo início.
-- Saída: JSON com o novo início e fim.
create or replace function public.app_reschedule_appointment(p_appointment_id uuid, p_new_starts_at timestamptz)
returns json
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_app public.appointments; -- atendimento a remarcar
  v_duration integer; -- duração do serviço
  v_new_ends timestamptz; -- novo fim
begin
  if auth.uid() is null then
    raise exception 'não autenticado' using errcode = '28000';
  end if;

  -- Trava o atendimento para evitar duas remarcações ao mesmo tempo.
  select * into v_app from public.appointments where id = p_appointment_id for update;
  if not found then
    raise exception 'agendamento não encontrado' using errcode = 'P0002';
  end if;

  if not public.is_member_of(v_app.company_id, array['owner', 'admin', 'member']) then
    raise exception 'sem permissão' using errcode = '42501';
  end if;

  if v_app.status not in ('pending_confirmation', 'confirmed') then
    raise exception 'agendamento não pode ser remarcado' using errcode = 'P0001';
  end if;

  select sv.duration_minutes into v_duration from public.services sv where sv.id = v_app.service_id;
  v_new_ends := p_new_starts_at + make_interval(mins => v_duration);

  -- Conflito com outro atendimento ativo do mesmo profissional (o próprio fica de fora).
  if exists (
    select 1 from public.appointments a
    where a.employee_id = v_app.employee_id
      and a.id <> v_app.id
      and a.status <> 'cancelled'
      and tstzrange(a.starts_at, a.ends_at, '[)') && tstzrange(p_new_starts_at, v_new_ends, '[)')
  ) then
    raise exception 'horário indisponível' using errcode = 'P0001';
  end if;

  -- Exceção de agenda (da empresa ou deste profissional).
  if exists (
    select 1 from public.availability_exceptions x
    where x.company_id = v_app.company_id
      and (x.employee_id is null or x.employee_id = v_app.employee_id)
      and tstzrange(x.starts_at, x.ends_at, '[)') && tstzrange(p_new_starts_at, v_new_ends, '[)')
  ) then
    raise exception 'horário bloqueado na agenda' using errcode = 'P0001';
  end if;

  update public.appointments
  set starts_at = p_new_starts_at, ends_at = v_new_ends
  where id = v_app.id;

  return json_build_object('starts_at', p_new_starts_at, 'ends_at', v_new_ends);
end;
$$;

revoke execute on function public.app_reschedule_appointment(uuid, timestamptz) from public, anon;
grant execute on function public.app_reschedule_appointment(uuid, timestamptz) to authenticated;
