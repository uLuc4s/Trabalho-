import { PGlite } from "@electric-sql/pglite";
import { btree_gist } from "@electric-sql/pglite/contrib/btree_gist";
import { readFileSync } from "node:fs";

const MIGRATIONS = [
  "../migrations/20261116000000_fundacao.sql",
  "../migrations/20261116000100_revoga_anon.sql",
  "../migrations/20261116000200_operacoes.sql",
  "../migrations/20261116000300_agendamento_publico.sql",
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
  grant usage on schema public to anon, authenticated;
  alter default privileges in schema public grant select, insert, update, delete on tables to authenticated;
  alter default privileges in schema public grant execute on functions to authenticated, anon;
`);
for (const sql of MIGRATIONS) await db.exec(sql);

const OWNER = "11111111-1111-1111-1111-111111111111";
await db.query("insert into auth.users (id, email) values ($1, 'dono@x.com')", [OWNER]);

async function as(role, sql, params = []) {
  const claims = role === "anon" ? "{}" : JSON.stringify({ sub: OWNER, email: "dono@x.com", role: "authenticated" });
  await db.exec("begin");
  try {
    await db.exec(`set local role ${role}; select set_config('request.jwt.claims', '${claims}', true);`);
    const res = await db.query(sql, params);
    await db.exec("commit");
    return { rows: res.rows, error: null };
  } catch (e) {
    await db.exec("rollback");
    return { rows: [], error: e };
  }
}

// Empresa, serviço, profissional, horário de segunda 09h-12h (São Paulo)
const COMP = (await as("authenticated", "select public.create_company('Barbearia Central', 'barbearia-central') as id")).rows[0].id;
const SVC = (await as("authenticated", "insert into public.services (company_id, name, duration_minutes, price) values ($1,'Corte',30,45) returning id", [COMP])).rows[0].id;
const EMP = (await as("authenticated", "insert into public.employees (company_id, display_name) values ($1,'João') returning id", [COMP])).rows[0].id;
await as("authenticated", "insert into public.employee_services (company_id, employee_id, service_id) values ($1,$2,$3)", [COMP, EMP, SVC]);
await as("authenticated", "insert into public.working_hours (company_id, employee_id, weekday, start_time, end_time) values ($1,$2,1,'09:00','12:00')", [COMP, EMP]);

// Próxima segunda-feira, a partir de duas semanas
const d = new Date();
d.setDate(d.getDate() + 14);
while (d.getDay() !== 1) d.setDate(d.getDate() + 1);
const DATE = d.toISOString().slice(0, 10);
const at = (hhmm) => `${DATE}T${hhmm}:00-03:00`;

// Página pública
const info = await as("anon", "select public.public_company_info('barbearia-central') as info");
check("anon lê página pública da empresa", !info.error && info.rows[0].info.services.length === 1, info.error?.message);

// Slots iniciais: 09:00 a 11:30, de 30 em 30 minutos
const slots0 = await as("anon", "select count(*)::int as n from public.public_available_slots('barbearia-central', $1, $2)", [SVC, DATE]);
check("calcula 6 horários livres no expediente", slots0.rows[0]?.n === 6, `n=${slots0.rows[0]?.n} ${slots0.error?.message ?? ""}`);

// Agendamento
const book = await as("anon", "select public.public_create_booking('barbearia-central', $1, $2, $3, 'Maria Silva', '(11) 98888-7777', 'maria@x.com') as r", [SVC, EMP, at("10:00")]);
check("anon cria agendamento sem login", !book.error && !!book.rows[0]?.r?.token, book.error?.message);
const TOKEN = book.rows[0]?.r?.token;

const slots1 = await as("anon", "select count(*)::int as n from public.public_available_slots('barbearia-central', $1, $2)", [SVC, DATE]);
check("horário agendado sai da lista de livres", slots1.rows[0]?.n === 5, `n=${slots1.rows[0]?.n}`);

const dup = await as("anon", "select public.public_create_booking('barbearia-central', $1, $2, $3, 'Outra Pessoa', '11977776666') as r", [SVC, EMP, at("10:00")]);
check("segundo agendamento no mesmo horário é bloqueado", dup.error !== null, dup.error?.message ?? "aceito (falha)");

const badPhone = await as("anon", "select public.public_create_booking('barbearia-central', $1, $2, $3, 'Ana', '123') as r", [SVC, EMP, at("11:00")]);
check("telefone inválido é recusado", badPhone.error !== null, badPhone.error?.message ?? "aceito (falha)");

const slotIn30 = await as("anon", "select public.public_create_booking('barbearia-central', $1, $2, $3, 'Ana', '11977776666') as r", [SVC, EMP, at("09:30")]);
check("horário encostado (09:30) continua disponível", !slotIn30.error, slotIn30.error?.message);

// Consulta por token
const got = await as("anon", "select public.public_get_booking($1) as b", [TOKEN]);
check("consulta por token retorna o agendamento", !got.error && got.rows[0].b.service === "Corte" && got.rows[0].b.status === "confirmed", got.error?.message);

const wrong = await as("anon", "select public.public_get_booking('token-falso') as b");
check("token inválido não retorna agendamento", wrong.error !== null, wrong.error?.message ?? "retornou (falha)");

// Anon não lê tabelas diretamente
const direct = await as("anon", "select count(*) from public.appointments");
check("anon não lê a tabela de agendamentos", direct.error !== null, direct.error?.message ?? "leu (falha)");

// Cancelamento
const cancel = await as("anon", "select public.public_cancel_booking($1) as r", [TOKEN]);
check("cliente cancela pelo token", !cancel.error && cancel.rows[0].r.status === "cancelled", cancel.error?.message);

const slots2 = await as("anon", "select count(*)::int as n from public.public_available_slots('barbearia-central', $1, $2)", [SVC, DATE]);
check("horário cancelado volta a ficar livre (09:30 da Ana segue ocupado)", slots2.rows[0]?.n === 5, `n=${slots2.rows[0]?.n}`);

// Prazo de cancelamento
await db.query("update public.companies set cancellation_hours = 100000 where id = $1", [COMP]);
const late = await as("anon", "select public.public_create_booking('barbearia-central', $1, $2, $3, 'Carla', '11966665555') as r", [SVC, EMP, at("11:00")]);
const LATE_TOKEN = late.rows[0]?.r?.token;
const lateCancel = await as("anon", "select public.public_cancel_booking($1) as r", [LATE_TOKEN]);
check("cancelamento fora do prazo é recusado", lateCancel.error !== null, lateCancel.error?.message ?? "cancelou (falha)");
await db.query("update public.companies set cancellation_hours = 0 where id = $1", [COMP]);

// Empresa desativada some da página pública
await db.query("update public.companies set public_enabled = false where id = $1", [COMP]);
const hidden = await as("anon", "select public.public_company_info('barbearia-central') as info");
check("empresa com página desativada não aparece", hidden.error !== null, hidden.error?.message ?? "apareceu (falha)");

const failed = results.filter((r) => !r.ok).length;
console.log(`\n${results.length - failed}/${results.length} verificações passaram`);
process.exit(failed ? 1 : 0);
