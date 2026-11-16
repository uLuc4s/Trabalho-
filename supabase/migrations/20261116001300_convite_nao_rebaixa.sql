create or replace function public.accept_invitation(p_token text)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_invitation public.invitations;
  v_email text := lower(auth.jwt() ->> 'email');
begin
  if auth.uid() is null then
    raise exception 'não autenticado' using errcode = '28000';
  end if;

  select * into v_invitation
  from public.invitations
  where token_hash = encode(sha256(convert_to(p_token, 'UTF8')), 'hex')
    and accepted_at is null
    and expires_at > now()
  for update;

  if not found then
    raise exception 'convite inválido ou expirado' using errcode = 'P0001';
  end if;

  if v_invitation.email <> v_email then
    raise exception 'convite destinado a outro e-mail' using errcode = '42501';
  end if;

  insert into public.company_members (company_id, user_id, role)
  values (v_invitation.company_id, auth.uid(), v_invitation.role)
  on conflict (company_id, user_id)
  do update set status = 'active';

  update public.invitations set accepted_at = now() where id = v_invitation.id;

  return v_invitation.company_id;
end;
$$;
