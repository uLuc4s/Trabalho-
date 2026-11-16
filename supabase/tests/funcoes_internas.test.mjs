import { PGlite } from "@electric-sql/pglite";
import { btree_gist } from "@electric-sql/pglite/contrib/btree_gist";
import { readFileSync } from "node:fs";

const MIGRATIONS = [
  "../migrations/20261116000000_fundacao.sql",
  "../migrations/20261116000100_revoga_anon.sql",
  "../migrations/20261116000200_operacoes.sql",
  "../migrations/20261116000300_agendamento_publico.sql",
  "../migrations/20261116000400_membro_ve_propria_linha.sql",
  "../migrations/20261116000500_funcoes_internas.sql",
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
  grant usage on schema public to anon, authenticated;
  alter default privileges in schema public grant select, insert, update, delete on tables to authenticated;
  alter default privileges in schema public grant execute on functions to authenticated, anon;
`);
for (const sql of MIGRATIONS) await db.exec(sql);

const USERS = {
  owner: "11111111-1111-1111-1111-111111111111",
  outsider: "22222222-2222-2222-2222-222222222222",
};
const EMAILS = { owner: "dono@x.com", outsider: "fora@x.com" };
for (const [k, id] of Object.entries(USERS)) {
  await db.query("insert into auth.users (id, email) values ($1, $2)", [id, EMAILS[k]]);
}

async function as(role, sql, params = []) {
  const claims = role === "anon" ? "{}" : JSON.stringify({ sub: USERS[role], email: EMAILS[role], role: "authenticated" });
  await db.exec("begin");
  try {
    await db.exec(`set local role ${role === "anon" ? "anon" : "authenticated"}; select set_config('request.jwt.claims', '${claims}', true);`);
    const res = await db.query(sql, params);
    await db.exec("commit");
    return { rows: res.rows, error: null };
  } catch (e) {
    await db.exec("rollback");
    return { rows: [], error: e };
  }
}

const COMP = (await as("owner", "select public.create_company('Oficina Norte', 'oficina-norte') as id")).rows[0].id;
await as("outsider", "select public.create_company('Outra', 'outra-empresa') as id");
const SVC = (await as("owner", "insert into public.services (company_id, name, duration_minutes, price) values ($1,'Instalação de ar',60,300) returning id", [COMP])).rows[0].id;
const EMP = (await as("owner", "insert into public.employees (company_id, display_name) values ($1,'Carlos') returning id", [COMP])).rows[0].id;
await as("owner", "insert into public.employee_services (company_id, employee_id, service_id) values ($1,$2,$3)", [COMP, EMP, SVC]);
await as("owner", "insert into public.working_hours (company_id, employee_id, weekday, start_time, end_time) values ($1,$2,1,'09:00','17:00')", [COMP, EMP]);

const d = new Date();
d.setDate(d.getDate() + 21);
while (d.getDay() !== 1) d.setDate(d.getDate() + 1);
const DATE = d.toISOString().slice(0, 10);
const at = (hhmm) => `${DATE}T${hhmm}:00-03:00`;

// Pedido de serviço pelo cliente (sem login)
const reqRes = await as("anon", "select public.public_request_service('oficina-norte', $1, 'Ana Lima', '(11) 97777-1234', 'manhã de terça', 'apartamento 302') as r", [SVC]);
check("cliente envia pedido de serviço sem login", !reqRes.error && !!reqRes.rows[0]?.r?.token, reqRes.error?.message);
const REQ_TOKEN = reqRes.rows[0]?.r?.token;
const REQ_ID = reqRes.rows[0]?.r?.request_id;

const track = await as("anon", "select public.public_get_service_request($1) as r", [REQ_TOKEN]);
check("cliente acompanha o pedido pelo token", track.rows[0]?.r?.status === "new", track.error?.message);

const badReq = await as("anon", "select public.public_request_service('oficina-norte', $1, 'A', '123') as r", [SVC]);
check("pedido com dados inválidos é recusado", badReq.error !== null, badReq.error?.message ?? "aceito (falha)");

// Equipe aprova o pedido e gera ordem de serviço
const outsiderReview = await as("outsider", "select public.app_review_service_request($1, 'approved')", [REQ_ID]);
check("empresa de fora não aprova pedido alheio", outsiderReview.error !== null, outsiderReview.error?.message ?? "aprovou (falha)");

const approve = await as("owner", "select public.app_review_service_request($1, 'approved') as r", [REQ_ID]);
const WO = approve.rows[0]?.r?.work_order_id;
check("aprovar pedido cria ordem de serviço", !approve.error && !!WO, approve.error?.message);

const again = await as("owner", "select public.app_review_service_request($1, 'rejected')", [REQ_ID]);
check("pedido já decidido não muda de decisão", again.error !== null, again.error?.message ?? "mudou (falha)");

// Andamento da ordem: máquina de estados
const s1 = await as("owner", "select public.app_set_work_order_status($1, 'scheduled') as s", [WO]);
check("ordem aberta vai para programada", s1.rows[0]?.s === "scheduled", s1.error?.message);

const skip = await as("owner", "select public.app_set_work_order_status($1, 'completed')", [WO]);
check("não pula de programada para concluída", skip.error !== null, skip.error?.message ?? "pulou (falha)");

const s2 = await as("owner", "select public.app_set_work_order_status($1, 'in_progress') as s", [WO]);
const s3 = await as("owner", "select public.app_set_work_order_status($1, 'completed') as s", [WO]);
check("ordem segue até concluída", s2.rows[0]?.s === "in_progress" && s3.rows[0]?.s === "completed", s3.error?.message);

const reopen = await as("owner", "select public.app_set_work_order_status($1, 'open')", [WO]);
check("ordem concluída não reabre", reopen.error !== null, reopen.error?.message ?? "reabriu (falha)");

const events = await db.query("select count(*)::int as n from public.work_order_events where work_order_id = $1", [WO]);
check("histórico registra criação e cada mudança de status", events.rows[0].n === 4, `eventos=${events.rows[0].n}`);

// Agendamento do cliente, remarcação e cancelamento
const book = await as("anon", "select public.public_create_booking('oficina-norte', $1, $2, $3, 'Ana Lima', '11977771234') as r", [SVC, EMP, at("10:00")]);
const APP_TOKEN = book.rows[0]?.r?.token;
const APP_ID = book.rows[0]?.r?.appointment_id;
check("cliente agenda o serviço", !book.error && !!APP_TOKEN, book.error?.message);

const other = await as("anon", "select public.public_create_booking('oficina-norte', $1, $2, $3, 'Bruno Dias', '11966665555') as r", [SVC, EMP, at("14:00")]);
check("outro cliente ocupa 14:00", !other.error, other.error?.message);

const moved = await as("anon", "select public.public_reschedule_booking($1, $2) as r", [APP_TOKEN, at("11:00")]);
check("cliente remarca para horário livre", !moved.error && moved.rows[0]?.r?.starts_at, moved.error?.message);

const got = await as("anon", "select public.public_get_booking($1) as b", [APP_TOKEN]);
check("consulta mostra o novo horário", !got.error && new Date(got.rows[0]?.b?.starts_at).getTime() === new Date(at("11:00")).getTime(), got.error?.message);

const onTaken = await as("anon", "select public.public_reschedule_booking($1, $2) as r", [APP_TOKEN, at("14:00")]);
check("remarcar para horário ocupado é recusado", onTaken.error !== null, onTaken.error?.message ?? "remarcou (falha)");

const outsiderCancel = await as("outsider", "select public.app_cancel_appointment($1)", [APP_ID]);
check("empresa de fora não cancela agendamento alheio", outsiderCancel.error !== null, outsiderCancel.error?.message ?? "cancelou (falha)");

const cancel = await as("owner", "select public.app_cancel_appointment($1) as s", [APP_ID]);
check("equipe cancela agendamento", cancel.rows[0]?.s === "cancelled", cancel.error?.message);

const cancelAgain = await as("owner", "select public.app_cancel_appointment($1)", [APP_ID]);
check("agendamento já cancelado não cancela de novo", cancelAgain.error !== null, cancelAgain.error?.message ?? "cancelou de novo (falha)");

const failed = results.filter((r) => !r.ok).length;
console.log(`\n${results.length - failed}/${results.length} verificações passaram`);
process.exit(failed ? 1 : 0);
