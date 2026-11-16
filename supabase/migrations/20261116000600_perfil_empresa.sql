alter table public.companies
  add column description text check (char_length(description) <= 600),
  add column address text,
  add column phone text,
  add column payment_methods text[] not null default array['pix', 'cartao', 'dinheiro']::text[]
    check (payment_methods <@ array['pix', 'cartao', 'dinheiro']::text[]);

alter table public.services
  add column description text check (char_length(description) <= 300),
  add column category text;

create or replace function public.public_company_info(p_slug text)
returns json
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_company public.companies;
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
    'payment_methods', to_json(v_company.payment_methods),
    'timezone', v_company.timezone,
    'services', coalesce((
      select json_agg(json_build_object(
        'id', s.id, 'name', s.name, 'description', s.description, 'category', s.category,
        'duration_minutes', s.duration_minutes, 'price', s.price
      ) order by s.category nulls last, s.name)
      from public.services s
      where s.company_id = v_company.id and s.active
    ), '[]'::json),
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
