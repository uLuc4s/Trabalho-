-- REVOGA ACESSO ANÔNIMO
-- Objetivo: o papel "anon" (visitante sem login) não pode ler nem alterar tabelas do sistema.
-- Só as funções públicas explicitamente liberadas (public_*) continuam acessíveis sem login.
-- Resultado esperado: um visitante não consegue consultar a tabela de clientes diretamente.

-- Remove de todas as tabelas do schema public qualquer permissão do papel anon.
revoke all on all tables in schema public from anon;

-- Remove de todas as funções do schema public qualquer permissão do papel anon.
revoke all on all functions in schema public from anon;

-- Garante que tabelas criadas no futuro também nasçam sem permissão para anon.
alter default privileges in schema public revoke all on tables from anon;

-- Garante que funções criadas no futuro também nasçam sem permissão para anon.
alter default privileges in schema public revoke all on functions from anon;
