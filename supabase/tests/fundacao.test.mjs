import { PGlite } from "@electric-sql/pglite";
import { btree_gist } from "@electric-sql/pglite/contrib/btree_gist";
import { readFileSync } from "node:fs";

const MIGRATION = new URL("../migrations/20261116000000_fundacao.sql", import.meta.url);

const db = new PGlite({ extensions: { btree_gist } });
const results = [];
const check = (name, ok, detail = "") => {
  results.push({ name, ok });
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}${detail ? "  -> " + detail : ""}`);
};

// Stub mínimo do Supabase: schema auth, roles e auth.uid()/auth.jwt() lendo request.jwt.claims.
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
await db.exec(readFileSync(MIGRATION, "utf8"));
await db.exec(`
  grant usage on schema public to anon, authenticated;
  grant select, insert, update, delete on all tables in schema public to authenticated;
  grant execute on all functions in schema public to anon, authenticated;
`);

const USERS = {
  owner1: "11111111-1111-1111-1111-111111111111",
  owner2: "22222222-2222-2222-2222-222222222222",
  outsider: "33333333-3333-3333-3333-333333333333",
  invitee: "44444444-4444-4444-4444-444444444444",
};
const EMAILS = { owner1: "dono1@x.com", owner2: "dono2@x.com", outsider: "fora@x.com", invitee: "equipe@x.com" };

for (const [k, id] of Object.entries(USERS)) {
  await db.query("insert into auth.users (id, email, raw_user_meta_data) values ($1, $2, '{\"full_name\":\"x\"}')", [id, EMAILS[k]]);
}

// Executa SQL como um usuário autenticado (simula o PostgREST: role authenticated + claims).
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
const prof = await db.query("select count(*)::int as n from public.profiles");
check("trigger cria profile ao criar auth.user", prof.rows[0].n === 4, `profiles=${prof.rows[0].n}`);

// --- Criação de empresas ---
const c1 = await as("owner1", "select public.create_company('Barbearia Alpha', 'barbearia-alpha') as id");
const c2 = await as("owner2", "select public.create_company('Instalações Beta', 'instalacoes-beta') as id");
check("owner1 cria empresa", !c1.error, c1.error?.message);
check("owner2 cria empresa", !c2.error, c2.error?.message);
const COMP1 = c1.rows[0].id;
const COMP2 = c2.rows[0].id;

const anonCreate = await as("outsider", "select public.create_company('Hack', 'hack')");
check("create_company exige autenticação (outsider cria só a própria)", !anonCreate.error, anonCreate.error?.message);

// --- Isolamento de leitura ---
const seeCompanies = await as("owner1", "select id from public.companies");
check("owner1 vê apenas a própria empresa", seeCompanies.rows.length === 1 && seeCompanies.rows[0].id === COMP1, `rows=${seeCompanies.rows.length}`);

const outsiderSees = await as("outsider", "select id from public.companies");
check("outsider vê só a própria empresa (não as alheias)", outsiderSees.rows.length === 1 && ![COMP1, COMP2].includes(outsiderSees.rows[0].id), `rows=${outsiderSees.rows.length}`);

// --- Dados operacionais da empresa 1 ---
const svc = await as("owner1", "insert into public.services (company_id, name, duration_minutes, price) values ($1, 'Corte', 30, 45) returning id", [COMP1]);
check("owner1 cadastra serviço na própria empresa", !svc.error, svc.error?.message);
const SVC1 = svc.rows[0].id;

const crossInsert = await as("owner2", "insert into public.services (company_id, name, duration_minutes) values ($1, 'Invasão', 30)", [COMP1]);
check("owner2 NÃO consegue inserir serviço na empresa 1", crossInsert !== undefined && crossInsert.error !== null, crossInsert.error?.message ?? "inseriu (falha)");

const crossRead = await as("owner2", "select id from public.services where company_id = $1", [COMP1]);
check("owner2 NÃO lê serviços da empresa 1", crossRead.rows.length === 0, `rows=${crossRead.rows.length}`);

const emp = await as("owner1", "insert into public.employees (company_id, display_name) values ($1, 'Carlos') returning id", [COMP1]);
const EMP1 = emp.rows[0].id;
const cust = await as("owner1", "insert into public.customers (company_id, name, phone) values ($1, 'João', '+5511999990000') returning id", [COMP1]);
const CUST1 = cust.rows[0].id;
await as("owner1", "insert into public.employee_services (company_id, employee_id, service_id) values ($1, $2, $3)", [COMP1, EMP1, SVC1]);

// --- Conflito de horário ---
const ap1 = await as("owner1", "insert into public.appointments (company_id, employee_id, service_id, customer_id, starts_at, ends_at) values ($1,$2,$3,$4,'2026-12-01 13:00-03','2026-12-01 13:30-03')", [COMP1, EMP1, SVC1, CUST1]);
check("primeiro agendamento é aceito", !ap1.error, ap1.error?.message);

const overlap = await as("owner1", "insert into public.appointments (company_id, employee_id, service_id, customer_id, starts_at, ends_at) values ($1,$2,$3,$4,'2026-12-01 13:15-03','2026-12-01 13:45-03')", [COMP1, EMP1, SVC1, CUST1]);
check("agendamento sobreposto para o mesmo profissional é bloqueado", overlap.error !== null, overlap.error?.message ?? "aceito (falha)");

const adjacent = await as("owner1", "insert into public.appointments (company_id, employee_id, service_id, customer_id, starts_at, ends_at) values ($1,$2,$3,$4,'2026-12-01 13:30-03','2026-12-01 14:00-03')", [COMP1, EMP1, SVC1, CUST1]);
check("agendamento encostado (13:30) é aceito", !adjacent.error, adjacent.error?.message);

await db.query("update public.appointments set status = 'cancelled' where starts_at = '2026-12-01 13:00-03'").catch(() => {});
const afterCancel = await as("owner1", "insert into public.appointments (company_id, employee_id, service_id, customer_id, starts_at, ends_at) values ($1,$2,$3,$4,'2026-12-01 13:00-03','2026-12-01 13:30-03')", [COMP1, EMP1, SVC1, CUST1]);
check("horário de agendamento cancelado volta a ficar livre", !afterCancel.error, afterCancel.error?.message);

// --- Convite de equipe ---
// token "abc123" → hash sha256 hex, gravado como faria a Edge Function de convite
const hashRow = await db.query("select encode(sha256(convert_to('token-convite-1','UTF8')),'hex') as h");
const inv = await as("owner1", "insert into public.invitations (company_id, email, role, token_hash, expires_at, created_by) values ($1, 'equipe@x.com', 'member', $2, now() + interval '2 days', $3)", [COMP1, hashRow.rows[0].h, USERS.owner1]);
check("owner1 cria convite", !inv.error, inv.error?.message);

const wrongUser = await as("outsider", "select public.accept_invitation('token-convite-1')");
check("convite não aceito por e-mail diferente", wrongUser.error !== null, wrongUser.error?.message ?? "aceito (falha)");

const accepted = await as("invitee", "select public.accept_invitation('token-convite-1') as company");
check("convidado aceita convite com e-mail correto", !accepted.error && accepted.rows[0]?.company === COMP1, accepted.error?.message);

const inviteeSees = await as("invitee", "select id from public.services");
check("membro convidado passa a ver serviços da empresa 1", inviteeSees.rows.length === 1, `rows=${inviteeSees.rows.length}`);

const reuse = await as("invitee", "select public.accept_invitation('token-convite-1')");
check("convite não pode ser reutilizado", reuse.error !== null, reuse.error?.message ?? "reaceito (falha)");

const memberCreateService = await as("invitee", "insert into public.services (company_id, name, duration_minutes) values ($1, 'Novo', 30)", [COMP1]);
check("membro com papel 'member' NÃO cadastra serviço", memberCreateService.error !== null, memberCreateService.error?.message ?? "inseriu (falha)");

const memberCreateAppt = await as("invitee", "insert into public.appointments (company_id, employee_id, service_id, customer_id, starts_at, ends_at) values ($1,$2,$3,$4,'2026-12-02 10:00-03','2026-12-02 10:30-03')", [COMP1, EMP1, SVC1, CUST1]);
check("membro com papel 'member' cria agendamento", !memberCreateAppt.error, memberCreateAppt.error?.message);

const bad = await db.query("insert into public.customers (company_id, name, phone) values ($1, 'x', '123')", [COMP1]).then(() => "aceito", (e) => "bloqueado");
check("telefone inválido é bloqueado pelo banco", bad === "bloqueado");

const failed = results.filter((r) => !r.ok).length;
console.log(`\n${results.length - failed}/${results.length} verificações passaram`);
process.exit(failed ? 1 : 0);
