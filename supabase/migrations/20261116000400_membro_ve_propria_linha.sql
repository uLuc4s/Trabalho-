create policy company_members_select_own on public.company_members
  for select to authenticated using (user_id = auth.uid());
