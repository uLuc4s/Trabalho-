-- NOMES DOS MEMBROS DA EQUIPE
-- Problema: a política da tabela profiles deixa cada usuário ler só o próprio perfil.
-- Por isso, na tela de equipe, os outros membros apareciam como "Sem nome".
-- Correção: função que devolve o nome dos membros ativos da própria empresa, e só para quem pertence a ela.
-- Resultado esperado: um membro vê o nome de todos da sua empresa, e nada de outras empresas.

-- Devolve id do vínculo e nome de cada membro ativo da empresa informada.
-- Entrada: id da empresa. Saída: linhas com member_id e full_name ("Sem nome" se faltar o perfil).
-- security definer: precisa ler profiles de outras pessoas, que a política normal bloqueia.
-- A checagem is_member_of impede ver os nomes de empresas alheias.
create or replace function public.app_company_member_names(p_company uuid)
returns table (member_id uuid, full_name text)
language sql
stable
security definer
set search_path = ''
as $$
  select m.id, coalesce(p.full_name, 'Sem nome')
  from public.company_members m
  left join public.profiles p on p.id = m.user_id
  where m.company_id = p_company
    and m.status = 'active'
    and public.is_member_of(p_company);
$$;

-- Só usuário logado pode chamar a função.
revoke execute on function public.app_company_member_names(uuid) from public, anon;
grant execute on function public.app_company_member_names(uuid) to authenticated;
