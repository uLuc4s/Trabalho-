-- LIMITE DE TENTATIVAS NOS PEDIDOS DE ORÇAMENTO
-- Problema: o agendamento público tinha limite de tentativas, mas o pedido de orçamento não tinha.
-- Correção: mesmo limite do agendamento. No máximo 3 pedidos por telefone por dia e 60 por empresa por hora.
-- Resultado esperado: o quarto pedido do mesmo telefone no dia é recusado pelo banco.

-- Recria a função de pedido público com os limites. Corpo igual ao anterior, com as duas checagens novas.
-- Entrada: slug, serviço, nome, telefone, janela de preferência, observação e e-mail opcional.
-- Saída: id do pedido e token de consulta (guardado só como hash).
create or replace function public.public_request_service(
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
  v_company public.companies; -- empresa que recebe o pedido
  v_phone text := regexp_replace(coalesce(p_phone, ''), '\D', '', 'g'); -- telefone só com dígitos
  v_customer_id uuid; -- cliente criado ou atualizado
  v_request_id uuid; -- pedido criado
  v_token text := replace(gen_random_uuid()::text || gen_random_uuid()::text, '-', ''); -- token de consulta
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

  -- Limite por telefone: 3 pedidos em 1 dia.
  if (select count(*) from public.service_requests r
      join public.customers c on c.id = r.customer_id
      where c.company_id = v_company.id and c.phone = v_phone
        and r.created_at > now() - interval '1 day') >= 3 then
    raise exception 'muitas tentativas. Tente novamente amanhã ou fale com a empresa' using errcode = 'P0001';
  end if;
  -- Limite geral: 60 pedidos por empresa em 1 hora.
  if (select count(*) from public.service_requests r
      where r.company_id = v_company.id and r.created_at > now() - interval '1 hour') >= 60 then
    raise exception 'muitas tentativas nesta empresa. Tente em alguns minutos' using errcode = 'P0001';
  end if;

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

-- Mantém as permissões: visitante e logado podem pedir; ninguém mais.
revoke execute on function public.public_request_service(text, uuid, text, text, text, text, text) from public, anon, authenticated;
grant execute on function public.public_request_service(text, uuid, text, text, text, text, text) to anon, authenticated;
