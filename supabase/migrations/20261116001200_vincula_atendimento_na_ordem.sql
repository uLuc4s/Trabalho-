-- VINCULA O ATENDIMENTO À ORDEM AO APROVAR A SOLICITAÇÃO
-- Objetivo: quando a equipe aprova um pedido, a ordem de serviço nasce já ligada ao atendimento mais recente
-- do mesmo cliente e do mesmo serviço. Assim a ordem mostra o veículo (placa) preenchido na agenda.
-- Resultado esperado: a ordem fica com o atendimento vinculado, e o atendimento passa a ter work_order_id.

-- Substitui a função de decisão de solicitação. A lógica nova está no bloco "update public.appointments".
-- Entrada: id da solicitação e decisão (under_review, approved ou rejected).
-- Saída: JSON com a nova situação e o id da ordem (se aprovada).
create or replace function public.app_review_service_request(p_request_id uuid, p_decision text)
returns json
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_req public.service_requests; -- solicitação encontrada
  v_service_name text; -- nome do serviço, usado como título da ordem
  v_work_order_id uuid; -- ordem criada, se aprovada
begin
  if auth.uid() is null then
    raise exception 'não autenticado' using errcode = '28000';
  end if;

  -- Trava a solicitação para que duas decisões ao mesmo tempo não conflitem.
  select * into v_req from public.service_requests where id = p_request_id for update;
  if not found then
    raise exception 'solicitação não encontrada' using errcode = 'P0002';
  end if;

  -- Só membros (dono, admin ou membro) da empresa da solicitação podem decidir.
  if not public.is_member_of(v_req.company_id, array['owner', 'admin', 'member']) then
    raise exception 'sem permissão' using errcode = '42501';
  end if;

  -- Só solicitação em aberto pode ser decidida.
  if v_req.status not in ('new', 'under_review') then
    raise exception 'solicitação já foi decidida' using errcode = 'P0001';
  end if;

  if p_decision not in ('under_review', 'approved', 'rejected') then
    raise exception 'decisão inválida' using errcode = '22023';
  end if;

  if p_decision = 'approved' then
    select sv.name into v_service_name from public.services sv where sv.id = v_req.service_id;

    -- Cria a ordem de serviço com o nome do serviço como título.
    insert into public.work_orders (company_id, customer_id, service_id, title, opened_by)
    values (v_req.company_id, v_req.customer_id, v_req.service_id, coalesce(v_service_name, 'Solicitação'), auth.uid())
    returning id into v_work_order_id;

    -- Registra no histórico que a ordem foi criada a partir desta solicitação.
    insert into public.work_order_events (company_id, work_order_id, actor_id, event_type, payload)
    values (v_req.company_id, v_work_order_id, auth.uid(), 'created', json_build_object('request_id', v_req.id));

    -- Liga a ordem ao atendimento mais recente do mesmo cliente e serviço, que ainda não tem ordem.
    -- Se não houver atendimento compatível, o update não altera nenhuma linha (não é erro).
    update public.appointments
    set work_order_id = v_work_order_id
    where id = (
      select a.id from public.appointments a
      where a.company_id = v_req.company_id
        and a.customer_id = v_req.customer_id
        and a.service_id = v_req.service_id
        and a.work_order_id is null
        and a.status in ('confirmed', 'pending_confirmation')
      order by a.starts_at desc -- o mais recente
      limit 1
    );
  end if;

  -- Atualiza a solicitação com a decisão e, se houver, com o id da ordem.
  update public.service_requests
  set status = p_decision,
      work_order_id = coalesce(v_work_order_id, work_order_id)
  where id = v_req.id;

  return json_build_object('status', p_decision, 'work_order_id', v_work_order_id);
end;
$$;
