// TESTE DAS FUNÇÕES INTERNAS E DO PEDIDO PÚBLICO
// O que faz: aplica todas as migrations até a correção da remarcação e checa o fluxo completo:
// pedido do cliente, aprovação que vira ordem, máquina de estados da ordem, agendamento, remarcação e cancelamento.
// Para rodar: node supabase/tests/funcoes_internas.test.mjs
// Resultado esperado: todas as verificações PASS (20 no total).

import { PGlite } from "@electric-sql/pglite"; // Postgres de teste, em memória
import { btree_gist } from "@electric-sql/pglite/contrib/btree_gist"; // extensão da regra de horário
import { readFileSync } from "node:fs"; // leitura dos arquivos SQL

// Migrations em ordem. A última (1400) corrige a remarcação que contava o próprio agendamento como conflito.
const MIGRATIONS = [
  "../migrations/20261116000000_fundacao.sql",
  "../migrations/20261116000100_revoga_anon.sql",
  "../migrations/20261116000200_operacoes.sql",
  "../migrations/20261116000300_agendamento_publico.sql",
  "../migrations/20261116000400_membro_ve_propria_linha.sql",
  "../migrations/20261116000500_funcoes_internas.sql",
  "../migrations/20261116001400_remarcacao_sem_conflito_consigo.sql",
  "../migrations/20261116001600_fecha_escrita_direta.sql",
].map((p) => readFileSync(new URL(p, import.meta.url), "utf8"));

const db = new PGlite({ extensions: { btree_gist } }); // banco de teste novo
const results = []; // resultado de cada verificação
// Registra e imprime uma verificação.
const check = (name, ok, detail = "") => {
  results.push({ name, ok });
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}${detail ? "  -> " + detail : ""}`);
};

// Stub do Supabase, com papéis anon e authenticated e as funções que leem a sessão.
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

// Usuários: dono da empresa, um dono de outra empresa e um visitante sem vínculo.
const USERS = {
  owner: "11111111-1111-1111-1111-111111111111",
  outsider: "22222222-2222-2222-2222-222222222222",
};
const EMAILS = { owner: "dono@x.com", outsider: "fora@x.com" };
for (const [k, id] of Object.entries(USERS)) {
  await db.query("insert into auth.users (id, email) values ($1, $2)", [id, EMAILS[k]]);
}

// Roda SQL como anon, como authenticated com o usuário informado. Sempre desfaz a transação.
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

// Empresa do dono, com serviço, profissional, vínculo serviço-profissional e expediente de segunda, 09h às 12h.
const COMP = (await as("owner", "select public.create_company('Oficina Norte', 'oficina-norte') as id")).rows[0].id;
const SVC = (await as("owner", "insert into public.services (company_id, name, duration_minutes, price) values ($1,'Instalação de ar',60,300) returning id", [COMP])).rows[0].id;
const EMP = (await as("owner", "insert into public.employees (company_id, display_name) values ($1,'Carlos') returning id", [COMP])).rows[0].id;
await as("owner", "insert into public.employee_services (company_id, employee_id, service_id) values ($1,$2,$3)", [COMP, EMP, SVC]);
await as("owner", "insert into public.working_hours (company_id, employee_id, weekday, start_time, end_time) values ($1,$2,1,'09:00','17:00')", [COMP, EMP]);

// Próxima segunda-feira, a 21 dias de hoje (sempre no futuro). Os horários de teste são desse dia.
const d = new Date();
d.setDate(d.getDate() + 21);
while (d.getDay() !== 1) d.setDate(d.getDate() + 1);
const DATE = d.toISOString().slice(0, 10);
// Monta um horário de São Paulo para a data de teste.
const at = (hhmm) => `${DATE}T${hhmm}:00-03:00`;

// --- Pedido do cliente (sem login) ---
// O visitante envia um pedido de serviço e recebe o token.
const reqRes = await as("anon", "select public.public_request_service('oficina-norte', $1, 'Ana Lima', '(11) 97777-1234', 'manhã de terça', 'apartamento 302') as r", [SVC]);
check("cliente envia pedido de serviço sem login", !reqRes.error && !!reqRes.rows[0]?.r?.token, reqRes.error?.message);
const REQ_TOKEN = reqRes.rows[0]?.r?.token;
const REQ_ID = reqRes.rows[0]?.r?.request_id;

// Com o token, o cliente acompanha o pedido. Status inicial é "new".
const track = await as("anon", "select public.public_get_service_request($1) as r", [REQ_TOKEN]);
check("cliente acompanha o pedido pelo token", track.rows[0]?.r?.status === "new", track.error?.message);

// Nome com 1 caractere e telefone curto: recusado.
const badReq = await as("anon", "select public.public_request_service('oficina-norte', $1, 'A', '123') as r", [SVC]);
check("pedido com dados inválidos é recusado", badReq.error !== null, badReq.error?.message ?? "aceito (falha)");

// --- Decisão da equipe ---
// Empresa de outro dono não aprova pedido alheio.
const outsiderReview = await as("outsider", "select public.app_review_service_request($1, 'approved')", [REQ_ID]);
check("empresa de fora não aprova pedido alheio", outsiderReview.error !== null, outsiderReview.error?.message ?? "aprovou (falha)");

// O dono aprova: nasce uma ordem de serviço.
const approve = await as("owner", "select public.app_review_service_request($1, 'approved') as r", [REQ_ID]);
const WO = approve.rows[0]?.r?.work_order_id;
check("aprovar pedido cria ordem de serviço", !approve.error && !!WO, approve.error?.message);

// Pedido já aprovado não muda de decisão.
const again = await as("owner", "select public.app_review_service_request($1, 'rejected')", [REQ_ID]);
check("pedido já decidido não muda de decisão", again.error !== null, again.error?.message ?? "mudou (falha)");

// --- Andamento da ordem: máquina de estados ---
// Aberta vai para programada.
const s1 = await as("owner", "select public.app_set_work_order_status($1, 'scheduled') as s", [WO]);
check("ordem aberta vai para programada", s1.rows[0]?.s === "scheduled", s1.error?.message);

// Programada não pula direto para concluída.
const skip = await as("owner", "select public.app_set_work_order_status($1, 'completed')", [WO]);
check("não pula de programada para concluída", skip.error !== null, skip.error?.message ?? "pulou (falha)");

// Segue o caminho normal: em execução e depois concluída.
const s2 = await as("owner", "select public.app_set_work_order_status($1, 'in_progress') as s", [WO]);
const s3 = await as("owner", "select public.app_set_work_order_status($1, 'completed') as s", [WO]);
check("ordem segue até concluída", s2.rows[0]?.s === "in_progress" && s3.rows[0]?.s === "completed", s3.error?.message);

// Concluída não volta a aberta.
const reopen = await as("owner", "select public.app_set_work_order_status($1, 'open')", [WO]);
check("ordem concluída não reabre", reopen.error !== null, reopen.error?.message ?? "reabriu (falha)");

// Histórico: criação mais três mudanças de status (aberta→programada, programada→em execução, em execução→concluída) = 4 eventos.
const events = await db.query("select count(*)::int as n from public.work_order_events where work_order_id = $1", [WO]);
check("histórico registra criação e cada mudança de status", events.rows[0].n === 4, `eventos=${events.rows[0].n}`);

// --- Agendamento, remarcação e cancelamento ---
// Cliente agenda um horário às 10h.
const book = await as("anon", "select public.public_create_booking('oficina-norte', $1, $2, $3, 'Ana Lima', '11977771234') as r", [SVC, EMP, at("10:00")]);
const APP_TOKEN = book.rows[0]?.r?.token;
const APP_ID = book.rows[0]?.r?.appointment_id;
check("cliente agenda o serviço", !book.error && !!APP_TOKEN, book.error?.message);

// Outro cliente ocupa 14h, para o teste de remarcação para horário ocupado.
const other = await as("anon", "select public.public_create_booking('oficina-norte', $1, $2, $3, 'Bruno Dias', '11966665555') as r", [SVC, EMP, at("14:00")]);
check("outro cliente ocupa 14:00", !other.error, other.error?.message);

// Remarca para 11h, horário livre.
const moved = await as("anon", "select public.public_reschedule_booking($1, $2) as r", [APP_TOKEN, at("11:00")]);
check("cliente remarca para horário livre", !moved.error && moved.rows[0]?.r?.starts_at, moved.error?.message);

// A consulta passa a mostrar o novo horário.
const got = await as("anon", "select public.public_get_booking($1) as b", [APP_TOKEN]);
check("consulta mostra o novo horário", !got.error && new Date(got.rows[0]?.b?.starts_at).getTime() === new Date(at("11:00")).getTime(), got.error?.message);

// Remarca para 11:30: sobrepõe o próprio atendimento (11:00 a 12:00). A correção da migration 1400 deixa passar.
const overlapSelf = await as("anon", "select public.public_reschedule_booking($1, $2) as r", [APP_TOKEN, at("11:30")]);
check("remarcar para horário que sobrepõe o próprio atendimento funciona", !overlapSelf.error, overlapSelf.error?.message);

// Remarca para 14h, ocupado por outro cliente: recusado.
const onTaken = await as("anon", "select public.public_reschedule_booking($1, $2) as r", [APP_TOKEN, at("14:00")]);
check("remarcar para horário ocupado é recusado", onTaken.error !== null, onTaken.error?.message ?? "remarcou (falha)");

// Empresa de outro dono não cancela agendamento alheio.
const outsiderCancel = await as("outsider", "select public.app_cancel_appointment($1)", [APP_ID]);
check("empresa de fora não cancela agendamento alheio", outsiderCancel.error !== null, outsiderCancel.error?.message ?? "cancelou (falha)");

// O dono cancela pela equipe.
const cancel = await as("owner", "select public.app_cancel_appointment($1) as s", [APP_ID]);
check("equipe cancela agendamento", cancel.rows[0]?.s === "cancelled", cancel.error?.message);

// Cancelar de novo é recusado: já está cancelado.
const cancelAgain = await as("owner", "select public.app_cancel_appointment($1)", [APP_ID]);
check("agendamento já cancelado não cancela de novo", cancelAgain.error !== null, cancelAgain.error?.message ?? "cancelou de novo (falha)");

// Resumo final.
const failed = results.filter((r) => !r.ok).length;
console.log(`\n${results.length - failed}/${results.length} verificações passaram`);
process.exit(failed ? 1 : 0);
