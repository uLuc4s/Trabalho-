alter table public.companies
  add column segment text check (segment in ('barbearia', 'oficina', 'advocacia', 'clinica', 'pet', 'lava_jato', 'outro'));
