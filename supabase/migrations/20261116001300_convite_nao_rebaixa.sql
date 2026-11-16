-- CONVITE NÃO REBAIXA MEMBRO EXISTENTE
-- Problema corrigido: antes, aceitar um convite trocava o papel de quem já era membro.
-- Um dono convidado como "membro" perdia o acesso de dono sem aviso.
-- Correção: quem já é membro mantém o papel atual. O papel do convite vale só para quem entra pela primeira vez.
-- Resultado esperado: o papel de um membro existente não muda ao aceitar convite; o status volta para ativo.

-- Substitui a função de aceitar convite pela versão corrigida.
-- Entrada: token secreto do convite. Saída: id da empresa.
create or replace function public.accept_invitation(p_token text)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_invitation public.invitations; -- convite encontrado
  v_email text := lower(auth.jwt() ->> 'email'); -- e-mail do usuário logado, em minúsculo
begin
  if auth.uid() is null then
    raise exception 'não autenticado' using errcode = '28000';
  end if;

  -- Acha o convite pelo hash, ainda não aceito e dentro do prazo. Trava a linha.
  select * into v_invitation
  from public.invitations
  where token_hash = encode(sha256(convert_to(p_token, 'UTF8')), 'hex')
    and accepted_at is null
    and expires_at > now()
  for update;

  if not found then
    raise exception 'convite inválido ou expirado' using errcode = 'P0001';
  end if;

  -- O convite só vale para o e-mail de destino.
  if v_invitation.email <> v_email then
    raise exception 'convite destinado a outro e-mail' using errcode = '42501';
  end if;

  -- Se a pessoa já é membro, só reativa o vínculo. O papel atual é mantido (não usa o papel do convite).
  -- Se é a primeira vez, cria o vínculo com o papel do convite.
  insert into public.company_members (company_id, user_id, role)
  values (v_invitation.company_id, auth.uid(), v_invitation.role)
  on conflict (company_id, user_id)
  do update set status = 'active';

  -- Marca o convite como usado.
  update public.invitations set accepted_at = now() where id = v_invitation.id;

  return v_invitation.company_id;
end;
$$;
