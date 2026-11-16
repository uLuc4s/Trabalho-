-- REMARCAÇÃO NÃO CONTA O PRÓPRIO AGENDAMENTO COMO CONFLITO
-- Problema corrigido: ao remarcar para um horário que sobrepõe o horário atual do próprio atendimento
-- (ex.: 30 minutos depois em um serviço de 60), a checagem achava que o horário estava ocupado pelo próprio agendamento.
-- Correção: o atendimento é tirado da conta temporariamente enquanto o horário novo é checado.
-- Se a checagem falhar, a exceção desfaz a mudança inteira (a transação volta atrás).
-- Resultado esperado: remarcar para horário que sobrepõe o atual funciona; horário realmente ocupado continua recusado.

-- Substitui a remarcação pelo cliente.
-- Entrada: token do atendimento e novo horário de início.
-- Saída: JSON com novo início e fim.
create or replace function public.public_reschedule_booking(p_token text, p_new_starts_at timestamptz)
returns json
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_app public.appointments; -- atendimento encontrado
  v_company public.companies; -- empresa
  v_duration integer; -- duração do serviço
  v_new_ends timestamptz; -- novo fim
begin
  -- Trava o atendimento para evitar remarcações simultâneas.
  select a.* into v_app
  from public.appointments a
  where a.access_token_hash = encode(sha256(convert_to(p_token, 'UTF8')), 'hex')
  for update;
  if not found then
    raise exception 'agendamento não encontrado' using errcode = 'P0002';
  end if;

  -- Só atendimento ativo pode ser remarcado.
  if v_app.status not in ('pending_confirmation', 'confirmed') then
    raise exception 'agendamento não pode ser remarcado' using errcode = 'P0001';
  end if;

  -- Respeita o prazo de antecedência da empresa.
  select c.* into v_company from public.companies c where c.id = v_app.company_id;
  if v_app.starts_at - now() < make_interval(hours => v_company.cancellation_hours) then
    raise exception 'prazo para alterar encerrado' using errcode = 'P0001';
  end if;

  -- Tira o próprio atendimento da conta enquanto checa o horário novo.
  -- Se a checagem falhar, a exceção desfaz essa mudança.
  update public.appointments set status = 'cancelled' where id = v_app.id;

  -- Confere se o horário novo está livre, usando a mesma regra da consulta de horários.
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

  -- Grava o novo horário e devolve o status original (o cancelamento temporário é desfeito aqui).
  update public.appointments
  set status = v_app.status, starts_at = p_new_starts_at, ends_at = v_new_ends
  where id = v_app.id;

  return json_build_object('starts_at', p_new_starts_at, 'ends_at', v_new_ends);
end;
$$;
