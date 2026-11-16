// TESTE DA FUNDAÇÃO DO BANCO
// O que faz: sobe um Postgres de teste (PGlite, em memória), aplica as migrations da fundação e checa as regras de acesso.
// Para rodar: npm run test:db (no diretório raiz).
// Resultado esperado: todas as verificações com PASS. Qualquer FAIL indica que uma regra de segurança ou de negócio quebrou.

import { PGlite } from "@electric-sql/pglite"; // Postgres que roda dentro do Node, sem servidor
import { btree_gist } from "@electric-sql/pglite/contrib/btree_gist"; // extensão usada na regra de horário
import { readFileSync } from "node:fs"; // lê os arquivos SQL do disco

// Caminho da migration da fundação, relativo a este arquivo.
const MIGRATION = new URL("../migrations/20261116000000_fundacao.sql", import.meta.url);

const db = new PGlite({ extensions: { btree_gist } }); // banco de teste novo, vazio
const results = []; // guarda o resultado de cada verificação
// Registra e imprime uma verificação. ok = true quando a regra funciona como esperado.
const check = (name, ok, detail = "") => {
  results.push({ name, ok });
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}${detail ? "  -> " + detail : ""}`);
};

// Stub do Supabase: cria os papéis e as funções auth.uid() e auth.jwt(), que leem a sessão de request.jwt.claims.
await db.exec(`
  create role anon nologin;
  create role authenticated nologin;
  create schema auth;
  create table auth.users (
    id uuid primary key,
    email text,
    raw_user_meta_data jsonb default '{}'::jsonb
  );
  create function auth.jwt() returns jsonb language sql stable as $$
    select coalesce(nullif(current_setting('request.jwt.claims', true), ''), '{}')::jsonb
  $$;
  create function auth.uid() returns uuid language sql stable as $$
    select nullif(auth.jwt() ->> 'sub', '')::uuid
  $$;
  grant usage on schema public, auth to anon, authenticated;
  grant execute on all functions in schema auth to anon, authenticated;
`);
// Aplica a fundação e a política que deixa o membro ler o próprio vínculo.
await db.exec(readFileSync(MIGRATION, "utf8"));
await db.exec(readFileSync(new URL("../migrations/20261116000400_membro_ve_propria_linha.sql", import.meta.url), "utf8"));
// Simula as permissões padrão do Supabase para as tabelas e funções.
await db.exec(`
  grant usage on schema public to anon, authenticated;
  grant select, insert, update, delete on all tables in schema public to authenticated;
  grant execute on all functions in schema public to anon, authenticated;
`);

// Usuários de teste (ids fixos para facilitar a leitura dos resultados).
const USERS = {
  owner1: "11111111-1111-1111-1111-111111111111",
  owner2: "22222222-2222-2222-2222-222222222222",
  outsider: "33333333-3333-3333-3333-333333333333",
  invitee: "44444444-4444-4444-4444-444444444444",
};
const EMAILS = { owner1: "dono1@x.com", owner2: "dono2@x.com", outsider: "fora@x.com", invitee: "equipe@x.com" };

// Cria os usuários no auth. O gatilho cria o perfil de cada um.
for (const [k, id] of Object.entries(USERS)) {
  await db.query("insert into auth.users (id, email, raw_user_meta_data) values ($1, $2, '{\"full_name\":\"x\"}')", [id, EMAILS[k]]);
}

// Roda um SQL como um usuário autenticado, como faz a API do Supabase.
// Entrada: usuário de teste, SQL e parâmetros. Saída: linhas ou erro. Sempre desfaz a transação no fim.
async function as(userKey, sql, params = []) {
  const claims = JSON.stringify({ sub: USERS[userKey], email: EMAILS[userKey], role: "authenticated" });
  await db.exec("begin");
  try {
    await db.exec(`set local role authenticated; select set_config('request.jwt.claims', '${claims}', true);`);
    const res = await db.query(sql, params);
    await db.exec("commit");
    return { rows: res.rows, error: null };
  } catch (e) {
    await db.exec("rollback");
    return { rows: [], error: e };
  }
}

// --- Perfil automático ---
// Quatro usuários criados, quatro perfis. Confirma que o gatilho funciona.
const prof = await db.query("select count(*)::int as n from public.profiles");
check("trigger cria profile ao criar auth.user", prof.rows[0].n === 4, `profiles=${prof.rows[0].n}`);

// --- Criação de empresas ---
const c1 = await as("owner1", "select public.create_company('Barbearia Alpha', 'barbearia-alpha') as id");
const c2 = await as("owner2", "select public.create_company('Instalações Beta', 'instalacoes-beta') as id");
check("owner1 cria empresa", !c1.error, c1.error?.message);
check("owner2 cria empresa", !c2.error, c2.error?.message);
const COMP1 = c1.rows[0].id;
const COMP2 = c2.rows[0].id;

// Quem não tem empresa ainda pode criar a sua; a verificação é de que a função responde para um usuário logado.
const anonCreate = await as("outsider", "select public.create_company('Hack', 'hack')");
check("create_company exige autenticação (outsider cria só a própria)", !anonCreate.error, anonCreate.error?.message);

// --- Isolamento de leitura ---
// Cada dono enxerga somente a própria empresa.
const seeCompanies = await as("owner1", "select id from public.companies");
check("owner1 vê apenas a própria empresa", seeCompanies.rows.length === 1 && seeCompanies.rows[0].id === COMP1, `rows=${seeCompanies.rows.length}`);

const outsiderSees = await as("outsider", "select id from public.companies");
check("outsider vê só a própria empresa (não as alheias)", outsiderSees.rows.length === 1 && ![COMP1, COMP2].includes(outsiderSees.rows[0].id), `rows=${outsiderSees.rows.length}`);

// --- Dados operacionais da empresa 1 ---
const svc = await as("owner1", "insert into public.services (company_id, name, duration_minutes, price) values ($1, 'Corte', 30, 45) returning id", [COMP1]);
check("owner1 cadastra serviço na própria empresa", !svc.error, svc.error?.message);
const SVC1 = svc.rows[0].id;

// Dono de outra empresa tenta inserir na empresa 1: tem que falhar.
const crossInsert = await as("owner2", "insert into public.services (company_id, name, duration_minutes) values ($1, 'Invasão', 30)", [COMP1]);
check("owner2 NÃO consegue inserir serviço na empresa 1", crossInsert !== undefined && crossInsert.error !== null, crossInsert.error?.message ?? "inseriu (falha)");

// E também não consegue ler os serviços da empresa 1.
const crossRead = await as("owner2", "select id from public.services where company_id = $1", [COMP1]);
check("owner2 NÃO lê serviços da empresa 1", crossRead.rows.length === 0, `rows=${crossRead.rows.length}`);

// Dados base para os testes de agenda e de cliente.
const emp = await as("owner1", "insert into public.employees (company_id, display_name) values ($1, 'Carlos') returning id", [COMP1]);
const EMP1 = emp.rows[0].id;
const cust = await as("owner1", "insert into public.customers (company_id, name, phone) values ($1, 'João', '+5511999990000') returning id", [COMP1]);
const CUST1 = cust.rows[0].id;
await as("owner1", "insert into public.employee_services (company_id, employee_id, service_id) values ($1, $2, $3)", [COMP1, EMP1, SVC1]);

// --- Conflito de horário ---
// 13:00 a 13:30 é aceito primeiro.
const ap1 = await as("owner1", "insert into public.appointments (company_id, employee_id, service_id, customer_id, starts_at, ends_at) values ($1,$2,$3,$4,'2026-12-01 13:00-03','2026-12-01 13:30-03')", [COMP1, EMP1, SVC1, CUST1]);
check("primeiro agendamento é aceito", !ap1.error, ap1.error?.message);

// 13:15 a 13:45 sobrepõe o anterior: tem que ser bloqueado.
const overlap = await as("owner1", "insert into public.appointments (company_id, employee_id, service_id, customer_id, starts_at, ends_at) values ($1,$2,$3,$4,'2026-12-01 13:15-03','2026-12-01 13:45-03')", [COMP1, EMP1, SVC1, CUST1]);
check("agendamento sobreposto para o mesmo profissional é bloqueado", overlap.error !== null, overlap.error?.message ?? "aceito (falha)");

// 13:30 encosta no fim do anterior: é aceito (intervalo fechado de um lado só).
const adjacent = await as("owner1", "insert into public.appointments (company_id, employee_id, service_id, customer_id, starts_at, ends_at) values ($1,$2,$3,$4,'2026-12-01 13:30-03','2026-12-01 14:00-03')", [COMP1, EMP1, SVC1, CUST1]);
check("agendamento encostado (13:30) é aceito", !adjacent.error, adjacent.error?.message);

// Cancelado sai da regra de conflito: o horário das 13h volta a ficar livre.
await db.query("update public.appointments set status = 'cancelled' where starts_at = '2026-12-01 13:00-03'").catch(() => {});
const afterCancel = await as("owner1", "insert into public.appointments (company_id, employee_id, service_id, customer_id, starts_at, ends_at) values ($1,$2,$3,$4,'2026-12-01 13:00-03','2026-12-01 13:30-03')", [COMP1, EMP1, SVC1, CUST1]);
check("horário de agendamento cancelado volta a ficar livre", !afterCancel.error, afterCancel.error?.message);

// --- Convite de equipe ---
// O convite guarda só o hash do token. Aqui o hash é calculado do mesmo jeito que o painel faz.
const hashRow = await db.query("select encode(sha256(convert_to('token-convite-1','UTF8')),'hex') as h");
const inv = await as("owner1", "insert into public.invitations (company_id, email, role, token_hash, expires_at, created_by) values ($1, 'equipe@x.com', 'member', $2, now() + interval '2 days', $3)", [COMP1, hashRow.rows[0].h, USERS.owner1]);
check("owner1 cria convite", !inv.error, inv.error?.message);

// Só o e-mail convidado aceita. Outro usuário tem que ser recusado.
const wrongUser = await as("outsider", "select public.accept_invitation('token-convite-1')");
check("convite não aceito por e-mail diferente", wrongUser.error !== null, wrongUser.error?.message ?? "aceito (falha)");

const accepted = await as("invitee", "select public.accept_invitation('token-convite-1') as company");
check("convidado aceita convite com e-mail correto", !accepted.error && accepted.rows[0]?.company === COMP1, accepted.error?.message);

// Depois de aceitar, o convidado passa a ver os serviços da empresa.
const inviteeSees = await as("invitee", "select id from public.services");
check("membro convidado passa a ver serviços da empresa 1", inviteeSees.rows.length === 1, `rows=${inviteeSees.rows.length}`);

// Convite já usado não pode ser aceito de novo.
const reuse = await as("invitee", "select public.accept_invitation('token-convite-1')");
check("convite não pode ser reutilizado", reuse.error !== null, reuse.error?.message ?? "reaceito (falha)");

// Papel "member" não cadastra serviço (só dono e admin).
const memberCreateService = await as("invitee", "insert into public.services (company_id, name, duration_minutes) values ($1, 'Novo', 30)", [COMP1]);
check("membro com papel 'member' NÃO cadastra serviço", memberCreateService.error !== null, memberCreateService.error?.message ?? "inseriu (falha)");

// Papel "member" cria agendamento (operação do dia a dia).
const memberCreateAppt = await as("invitee", "insert into public.appointments (company_id, employee_id, service_id, customer_id, starts_at, ends_at) values ($1,$2,$3,$4,'2026-12-02 10:00-03','2026-12-02 10:30-03')", [COMP1, EMP1, SVC1, CUST1]);
check("membro com papel 'member' cria agendamento", !memberCreateAppt.error, memberCreateAppt.error?.message);

// Telefone com menos de 10 dígitos é recusado pela regra do banco, não só pela tela.
const bad = await db.query("insert into public.customers (company_id, name, phone) values ($1, 'x', '123')", [COMP1]).then(() => "aceito", (e) => "bloqueado");
check("telefone inválido é bloqueado pelo banco", bad === "bloqueado");

// O membro consegue ler a própria linha de vínculo (necessário para o painel saber a empresa).
const ownRow = await as("invitee", "select company_id from public.company_members where user_id = (select auth.uid())");
check("membro enxerga a própria linha de vínculo", ownRow.rows.length >= 1, `rows=${ownRow.rows.length}`);

// Resumo final: quantas passaram e quantas falharam. Falha de qualquer uma encerra com código 1.
const failed = results.filter((r) => !r.ok).length;
console.log(`\n${results.length - failed}/${results.length} verificações passaram`);
process.exit(failed ? 1 : 0);
