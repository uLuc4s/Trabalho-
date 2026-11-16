create or replace function public.public_get_booking(p_token text)
returns json
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_row record;
begin
  select a.status, a.starts_at, a.ends_at, a.service_id, a.employee_id,
         sv.name as service_name, e.display_name as employee_name,
         c.name as company_name, c.slug as company_slug, c.cancellation_hours
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
    'service_id', v_row.service_id,
    'employee', v_row.employee_name,
    'employee_id', v_row.employee_id,
    'company', v_row.company_name,
    'company_slug', v_row.company_slug,
    'cancellable', v_row.status in ('pending_confirmation', 'confirmed')
      and v_row.starts_at - now() >= make_interval(hours => v_row.cancellation_hours)
  );
end;
$$;
