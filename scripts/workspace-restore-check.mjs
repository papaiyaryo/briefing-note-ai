// 架空データ・隔離schema/DBのみ。実環境backupの成功を代替しない。
import { Client } from "pg";
import { randomUUID, createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
const exec = promisify(execFile);
const url = new URL(
  process.env.U1_TEST_DATABASE_URL ??
    "postgresql://workspace_test_admin:local-test-only@127.0.0.1:55432/workspace_test",
);
if (
  !["localhost", "127.0.0.1"].includes(url.hostname) ||
  url.pathname !== "/workspace_test"
)
  throw new Error("disposable local database required");
const suffix = randomUUID().replaceAll("-", "");
const schema = `u1_restore_source_${suffix}`,
  database = `u1_restore_${suffix}`,
  dump = `/tmp/u1_restore_${suffix}.dump`;
const admin = new Client({ connectionString: url.toString() });
await admin.connect();
const docker = async (args) =>
  exec(
    "docker",
    ["compose", "-f", "compose.test.yml", "exec", "-T", "postgres", ...args],
    { timeout: 30000, maxBuffer: 1024 * 1024 },
  );
const hash = (value) =>
  createHash("sha256").update(JSON.stringify(value)).digest("hex");
async function fingerprint(client) {
  const data = {};
  for (const table of [
    "companies",
    "memos",
    "write_operations",
    "deletion_snapshots",
  ]) {
    const rows = (
      await client.query(
        `select to_jsonb(t) as record from ${schema}.${table} t order by to_jsonb(t)::text`,
      )
    ).rows;
    data[table] = { count: rows.length, sha256: hash(rows) };
  }
  const shape = (
    await client.query(
      "select c.relname,a.attname,format_type(a.atttypid,a.atttypmod) as type,a.attnotnull from pg_class c join pg_namespace n on n.oid=c.relnamespace join pg_attribute a on a.attrelid=c.oid where n.nspname=$1 and c.relkind='r' and a.attnum>0 order by c.relname,a.attnum",
      [schema],
    )
  ).rows;
  const constraints = (
    await client.query(
      "select c.relname,pg_get_constraintdef(k.oid) as definition from pg_constraint k join pg_class c on c.oid=k.conrelid join pg_namespace n on n.oid=c.relnamespace where n.nspname=$1 order by c.relname,definition",
      [schema],
    )
  ).rows;
  const policies = (
    await client.query(
      "select tablename,policyname,cmd,qual,with_check from pg_policies where schemaname=$1 order by tablename,policyname",
      [schema],
    )
  ).rows;
  return { data, schemaSha256: hash({ shape, constraints, policies }) };
}
let restored,
  createdDatabase = false;
try {
  await admin.query(
    await readFile("tests/u1-company-notes/db/bootstrap.sql", "utf8"),
  );
  await admin.query(
    (await readFile("db/migrations/001-company-workspace.sql", "utf8"))
      .replaceAll("__SCHEMA__", schema)
      .replaceAll("__APP_ROLE__", "workspace_test_app"),
  );
  const owner = "11111111-1111-4111-8111-111111111111",
    company = randomUUID(),
    memo = randomUUID(),
    operation = randomUUID();
  await admin.query(
    `insert into ${schema}.companies(company_id,owner_id,name)values($1,$2,'架空復元確認')`,
    [company, owner],
  );
  await admin.query(
    `insert into ${schema}.memos(memo_id,owner_id,company_id,origin,markdown)values($1,$2,$3,'manual','架空の本人本文')`,
    [memo, owner, company],
  );
  await admin.query(
    `insert into ${schema}.write_operations(owner_id,operation_id,request_fingerprint,action,company_id,memo_id,resulting_version)select owner_id,$1,repeat('a',64),'memo_create',company_id,memo_id,version from ${schema}.memos where memo_id=$2`,
    [operation, memo],
  );
  await admin.query(
    `insert into ${schema}.app_sessions(session_hash,user_id,auth_session_id,encrypted_tokens,absolute_expires_at) values(repeat('b',64),$1,'dummy-restore-auth','{"keyId":"dummy-old-key","ciphertext":"dummy-only"}',clock_timestamp()+interval '1 day')`,
    [owner],
  );
  const before = await fingerprint(admin);
  const legacySessions = (
    await admin.query(`select to_jsonb(t) as record from ${schema}.app_sessions t`)
  ).rows.map((row) => row.record);
  await docker([
    "pg_dump",
    "-U",
    "workspace_test_admin",
    "-d",
    "workspace_test",
    "--format=custom",
    `--schema=${schema}`,
    `--exclude-table-data=${schema}.app_sessions`,
    "--schema=auth",
    `--file=${dump}`,
  ]);
  await admin.query(`CREATE DATABASE ${database}`);
  createdDatabase = true;
  await docker([
    "pg_restore",
    "-U",
    "workspace_test_admin",
    `--dbname=${database}`,
    "--exit-on-error",
    dump,
  ]);
  const restoreUrl = new URL(url);
  restoreUrl.pathname = `/${database}`;
  restored = new Client({ connectionString: restoreUrl.toString() });
  await restored.connect();
  const ordinarySessions = (
    await restored.query(`select count(*)::int as count from ${schema}.app_sessions`)
  ).rows[0].count;
  if (ordinarySessions !== 0) throw new Error("backup included session data");
  // 旧全schema dumpのsession行も再開前に必ず同じ保守SQLで除去する。
  await restored.query(
    `insert into ${schema}.app_sessions select * from jsonb_populate_recordset(null::${schema}.app_sessions,$1::jsonb)`,
    [JSON.stringify(legacySessions)],
  );
  if (!/^u1_restore_source_[a-f0-9]{32}$/.test(schema))
    throw new Error("restore session reset scope rejected");
  await restored.query(
    (await readFile("db/maintenance/reset-restored-sessions.sql", "utf8"))
      .replaceAll("__SCHEMA__", schema),
  );
  const sessionCounts = (
    await restored.query(`select count(*)::int as sessions,count(encrypted_tokens)::int as tokens from ${schema}.app_sessions`)
  ).rows[0];
  if (sessionCounts.sessions !== 0 || sessionCounts.tokens !== 0)
    throw new Error("restored sessions must be cleared before reopening");
  const after = await fingerprint(restored);
  if (JSON.stringify(before) !== JSON.stringify(after))
    throw new Error("restore fingerprint mismatch");
  await restored.query("BEGIN");
  await restored.query("SET LOCAL ROLE workspace_test_app");
  await restored.query("select set_config('app.owner_id',$1,true)", [owner]);
  const owned = (
    await restored.query(`select company_id from ${schema}.companies`)
  ).rows;
  await restored.query("select set_config('app.owner_id',$1,true)", [
    "22222222-2222-4222-8222-222222222222",
  ]);
  const other = (
    await restored.query(`select company_id from ${schema}.companies`)
  ).rowCount;
  await restored.query("ROLLBACK");
  if (owned.length !== 1 || owned[0].company_id !== company || other !== 0)
    throw new Error("restored ownership boundary failed");
  console.log(
    JSON.stringify({
      restoreCheck: "passed",
      format: "pg_dump custom / pg_restore PostgreSQL17",
      idVersionOwnerOperationFingerprintsEqual: true,
      rlsOwnerIsolation: true,
      ordinaryDumpSessionRows: ordinarySessions,
      legacyRestoredSessionsRemoved: true,
      freshLoginRequiredRegardlessOfKeys: true,
      ...after,
      externalBackupUnverified: true,
    }),
  );
} finally {
  await restored?.end();
  if (
    !/^u1_restore_[a-f0-9]{32}$/.test(database) ||
    !/^u1_restore_source_[a-f0-9]{32}$/.test(schema)
  )
    throw new Error("cleanup scope rejected");
  if (createdDatabase) await admin.query(`DROP DATABASE ${database}`);
  await admin.query(`DROP SCHEMA IF EXISTS ${schema} CASCADE`);
  await admin.end();
  await docker(["rm", "-f", "--", dump]);
  console.log(
    JSON.stringify({ dedicatedRestoreDatabaseAndSchemaRemoved: true }),
  );
}
