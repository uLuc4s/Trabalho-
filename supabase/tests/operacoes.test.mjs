import { PGlite } from "@electric-sql/pglite";
import { btree_gist } from "@electric-sql/pglite/contrib/btree_gist";
import { readFileSync } from "node:fs";

const MIGRATIONS = [
  "../migrations/20261116000000_fundacao.sql",
  "../migrations/20261116000100_revoga_anon.sql",
  "../migrations/20261116000200_operacoes.sql",
].map((p) => readFileSync(new URL(p, import.meta.url), "utf8"));

const db = new PGlite({ extensions: { btree_gist } });
const results = [];
const check = (name, ok, detail = "") => {
  results.push({ name, ok });
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}${detail ? "  -> " + detail : ""}`);
};

await db.exec(`
  create role anon nologin;
  create role authenticated nologin;
  create schema auth;
  create table auth.users (id uuid primary key, email text, raw_user_meta_data jsonb default '{}'::jsonb);
  create function auth.jwt() returns jsonb language sql stable as $$
    select coalesce(nullif(current_setting('request.jwt.claims', true), ''), '{}')::jsonb
  $$;
  create function auth.uid() returns uuid language sql stable as $$
    select nullif(auth.jwt() ->> 'sub', '')::uuid
  $$;
  grant usage on schema auth to anon, authenticated;
  grant execute on all functions in schema auth to anon, authenticated;
`);
await db.exec(`
  grant usage on schema public to anon, authenticated;
  alter default privileges in schema public grant select, insert, update, delete on tables to authenticated;
  alter default privileges in schema public grant execute on functions to authenticated, anon;
`);
for (const sql of MIGRATIONS) await db.exec(sql);

const USERS = {
  owner1: "11111111-1111-1111-1111-111111111111",
  member1: "22222222-2222-2222-2222-222222222222",
  viewer1: "33333333-3333-3333-3333-333333333333",
  owner2: "44444444-4444-4444-4444-444444444444",
};
const EMAILS = { owner1: "dono@x.com", member1: "equipe@x.com", viewer1: "leitor@x.com", owner2: "outro@x.com" };
for (const [k, id] of Object.entries(USERS)) {
  await db.query("insert into auth.users (id, email) values ($1, $2)", [id, EMAILS[k]]);
}

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

// Empresa 1 com owner, member e viewer; empresa 2 com outro owner.
const c1 = await as("owner1", "select public.create_company('Alpha', 'alpha') as id");
const COMP1 = c1.rows[0].id;
await as("owner2", "select public.create_company('Beta', 'beta') as id");
const c2 = await db.query("select id from public.companies where slug = 'beta'");
const COMP2 = c2.rows[0].id;

const inv = await db.query("select encode(sha256(convert_to('tok-operacoes','UTF8')),'hex') as h");
await as("owner1", "insert into public.invitations (company_id, email, role, token_hash, expires_at, created_by) values ($1,'equipe@x.com','member',$2, now()+interval '1 day', $3)", [COMP1, inv.rows[0].h, USERS.owner1]);
await as("member1", "select public.accept_invitation('tok-operacoes')");
const inv2 = await db.query("select encode(sha256(convert_to('tok-leitor','UTF8')),'hex') as h");
await as("owner1", "insert into public.invitations (company_id, email, role, token_hash, expires_at, created_by) values ($1,'leitor@x.com','viewer',$2, now()+interval '1 day', $3)", [COMP1, inv2.rows[0].h, USERS.owner1]);
await as("viewer1", "select public.accept_invitation('tok-leitor')");

// Dados base da empresa 1 (feitos pelo owner)
const svc = (await as("owner1", "insert into public.services (company_id, name, duration_minutes) values ($1,'Instalação',120) returning id", [COMP1])).rows[0].id;
const emp = (await as("owner1", "insert into public.employees (company_id, display_name) values ($1,'Carlos') returning id", [COMP1])).rows[0].id;
const cust = (await as("owner1", "insert into public.customers (company_id, name, phone) values ($1,'Maria','+5511988887777') returning id", [COMP1])).rows[0].id;

// Ordem de serviço
const wo = await as("member1", "insert into public.work_orders (company_id, customer_id, service_id, title) values ($1,$2,$3,'Instalação de ar 12k BTU') returning id", [COMP1, cust, svc]);
check("member cria ordem de serviço", !wo.error, wo.error?.message);
const WO = wo.rows[0].id;

const ev = await as("member1", "insert into public.work_order_events (company_id, work_order_id, actor_id, event_type) values ($1,$2,$3,'created')", [COMP1, WO, USERS.member1]);
check("evento de histórico é registrado pelo próprio ator", !ev.error, ev.error?.message);

const evForge = await as("member1", "insert into public.work_order_events (company_id, work_order_id, actor_id, event_type) values ($1,$2,$3,'forged')", [COMP1, WO, USERS.owner1]);
check("não registra evento em nome de outro usuário", evForge.error !== null, evForge.error?.message ?? "aceito (falha)");

const evEdit = await as("owner1", "update public.work_order_events set event_type = 'x' where work_order_id = $1", [WO]);
check("evento de histórico não pode ser alterado", evEdit.error !== null, evEdit.error?.message ?? "alterou (falha)");

const auditEdit = await as("owner1", "delete from public.audit_logs");
check("audit_logs não pode ser apagado pelo usuário", auditEdit.error !== null, auditEdit.error?.message ?? "apagou (falha)");

// Viewer não gerencia bloqueios nem serviços
const viewerBlock = await as("viewer1", "insert into public.availability_exceptions (company_id, starts_at, ends_at, reason) values ($1,'2026-12-05 12:00-03','2026-12-05 13:00-03','almoço')", [COMP1]);
check("viewer não cria bloqueio de agenda", viewerBlock.error !== null, viewerBlock.error?.message ?? "criou (falha)");

const viewerRead = await as("viewer1", "select id from public.work_orders");
check("viewer lê ordens da própria empresa", viewerRead.rows.length === 1, `rows=${viewerRead.rows.length}`);

// Isolamento entre empresas
const crossWO = await as("owner2", "select id from public.work_orders");
check("empresa 2 não vê ordens da empresa 1", crossWO.rows.length === 0, `rows=${crossWO.rows.length}`);

const crossTask = await as("owner2", "insert into public.task_boards (company_id, name) values ($1,'Espiã')", [COMP1]);
check("empresa 2 não cria quadro na empresa 1", crossTask.error !== null, crossTask.error?.message ?? "criou (falha)");

// Kanban: quadro, coluna, tarefa; coluna de outra empresa é bloqueada pela FK composta
const board = (await as("owner1", "insert into public.task_boards (company_id, name) values ($1,'Operação') returning id", [COMP1])).rows[0].id;
const colTodo = (await as("owner1", "insert into public.task_columns (company_id, board_id, name, position) values ($1,$2,'A fazer',0) returning id", [COMP1, board])).rows[0].id;
const task = await as("member1", "insert into public.tasks (company_id, board_id, column_id, title) values ($1,$2,$3,'Levar escada') returning id", [COMP1, board, colTodo]);
check("member cria tarefa no Kanban", !task.error, task.error?.message);

const board2 = (await as("owner2", "insert into public.task_boards (company_id, name) values ($1,'Beta') returning id", [COMP2])).rows[0].id;
const colBeta = (await as("owner2", "insert into public.task_columns (company_id, board_id, name) values ($1,$2,'Beta') returning id", [COMP2, board2])).rows[0].id;
const mixed = await as("member1", "insert into public.tasks (company_id, board_id, column_id, title) values ($1,$2,$3,'Misturada')", [COMP1, board, colBeta]);
check("tarefa não usa coluna de outra empresa", mixed.error !== null, mixed.error?.message ?? "aceito (falha)");

// Agendamento ligado à ordem; conflito de horário continua valendo
const ap1 = await as("member1", "insert into public.appointments (company_id, employee_id, service_id, customer_id, work_order_id, starts_at, ends_at) values ($1,$2,$3,$4,$5,'2026-12-03 09:00-03','2026-12-03 11:00-03')", [COMP1, emp, svc, cust, WO]);
check("agendamento vinculado à ordem de serviço", !ap1.error, ap1.error?.message);

const ap2 = await as("member1", "insert into public.appointments (company_id, employee_id, service_id, customer_id, starts_at, ends_at) values ($1,$2,$3,$4,'2026-12-03 10:00-03','2026-12-03 10:30-03')", [COMP1, emp, svc, cust]);
check("conflito de horário continua bloqueado", ap2.error !== null, ap2.error?.message ?? "aceito (falha)");

// Solicitação do cliente
const sr = await as("member1", "insert into public.service_requests (company_id, customer_id, service_id, preferred_window, notes) values ($1,$2,$3,'manhã de terça','apartamento 301') returning id, status", [COMP1, cust, svc]);
check("solicitação entra com status 'new'", !sr.error && sr.rows[0].status === "new", sr.error?.message);

// Notificações: membro comum não lê fila de envio
const notifRead = await as("member1", "select id from public.notifications");
check("member não lê fila de notificações", notifRead.rows.length === 0, `rows=${notifRead.rows.length}`);

const failed = results.filter((r) => !r.ok).length;
console.log(`\n${results.length - failed}/${results.length} verificações passaram`);
process.exit(failed ? 1 : 0);
