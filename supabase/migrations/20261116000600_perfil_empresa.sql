-- PERFIL DA EMPRESA
-- Objetivo: a empresa tem descrição, endereço, telefone e formas de pagamento; os serviços ganham descrição e categoria.
-- Essas informações aparecem na página pública de agendamento.
-- Resultado esperado: campos novos aceitos com limites; a página pública passa a devolver esses dados.

-- Colunas novas da empresa.
alter table public.companies
  add column description text check (char_length(description) <= 600), -- texto de apresentação, até 600 caracteres
  add column address text, -- endereço para o cliente
  add column phone text, -- telefone de contato
  -- Formas de pagamento aceitas. Padrão: pix, cartão e dinheiro. Só esses três valores são aceitos.
  add column payment_methods text[] not null default array['pix', 'cartao', 'dinheiro']::text[]
    check (payment_methods <@ array['pix', 'cartao', 'dinheiro']::text[]);

-- Colunas novas dos serviços.
alter table public.services
  add column description text check (char_length(description) <= 300), -- descrição curta, até 300 caracteres
  add column category text; -- categoria para agrupar na página pública

-- Substitui a função pública da empresa para devolver também o perfil e as categorias.
-- Entrada: slug. Saída: JSON com perfil, serviços (com categoria) e profissionais.
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
    'payment_methods', to_json(v_company.payment_methods), -- converte a lista do banco em JSON
    'timezone', v_company.timezone,
    -- Serviços ativos, ordenados por categoria (sem categoria por último) e depois por nome.
    'services', coalesce((
      select json_agg(json_build_object(
        'id', s.id, 'name', s.name, 'description', s.description, 'category', s.category,
        'duration_minutes', s.duration_minutes, 'price', s.price
      ) order by s.category nulls last, s.name)
      from public.services s
      where s.company_id = v_company.id and s.active
    ), '[]'::json),
    -- Profissionais ativos.
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
