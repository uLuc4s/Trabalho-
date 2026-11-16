-- MEMBRO LÊ O PRÓPRIO VÍNCULO
-- Objetivo: cada usuário consegue ver o seu próprio vínculo com a empresa.
-- Sem isso, o painel não descobre a empresa do usuário logado logo após o login.
-- Resultado esperado: a consulta de company_members devolve somente as linhas do próprio usuário.

-- Política de leitura: a linha só aparece se o user_id for o do usuário logado.
create policy company_members_select_own on public.company_members
  for select to authenticated using (user_id = auth.uid());
