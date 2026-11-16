alter table public.companies
  add column business_model text
    check (business_model in ('balcao', 'campo', 'orcamento', 'recorrente'));
