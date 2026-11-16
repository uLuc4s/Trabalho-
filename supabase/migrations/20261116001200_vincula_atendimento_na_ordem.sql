create or replace function public.app_review_service_request(p_request_id uuid, p_decision text)
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

    update public.appointments
    set work_order_id = v_work_order_id
    where id = (
      select a.id from public.appointments a
      where a.company_id = v_req.company_id
        and a.customer_id = v_req.customer_id
        and a.service_id = v_req.service_id
        and a.work_order_id is null
        and a.status in ('confirmed', 'pending_confirmation')
      order by a.starts_at desc
      limit 1
    );
  end if;

  update public.service_requests
  set status = p_decision,
      work_order_id = coalesce(v_work_order_id, work_order_id)
  where id = v_req.id;

  return json_build_object('status', p_decision, 'work_order_id', v_work_order_id);
end;
$$;
