// 開発専用。架空Auth＋隔離schemaを作り、終了時にこのschemaだけを片付ける。
import { Client } from "pg";
import { randomBytes, randomUUID } from "node:crypto";
import { readFile } from "node:fs/promises";
import { spawn, execFile } from "node:child_process";
const connectionString =
  process.env.U1_TEST_DATABASE_URL ??
  "postgresql://workspace_test_admin:local-test-only@127.0.0.1:55432/workspace_test";
const url = new URL(connectionString);
if (
  !["localhost", "127.0.0.1"].includes(url.hostname) ||
  url.pathname !== "/workspace_test"
)
  throw new Error("local disposable test database required");
const schema = `u1_preview_${randomUUID().replaceAll("-", "")}`;
const admin = new Client({ connectionString });
await admin.connect();
await admin.query(
  await readFile("tests/u1-company-notes/db/bootstrap.sql", "utf8"),
);
await admin.query(
  (await readFile("db/migrations/001-company-workspace.sql", "utf8"))
    .replaceAll("__SCHEMA__", schema)
    .replaceAll("__APP_ROLE__", "workspace_test_app"),
);
const appUrl = new URL(url);
appUrl.username = "workspace_test_app";
appUrl.password = "local-app-test-only";
const keyRing = (id) =>
  JSON.stringify({
    active: id,
    keys: { [id]: randomBytes(32).toString("base64") },
  });
const child = spawn(
  process.execPath,
  [
    "node_modules/next/dist/bin/next",
    "dev",
    "--hostname",
    "127.0.0.1",
    "--port",
    "3000",
  ],
  {
    stdio: ["ignore", "inherit", "inherit"],
    env: {
      ...process.env,
      NODE_ENV: "development",
      WORKSPACE_ORIGIN: "http://127.0.0.1:3000",
      WORKSPACE_DATABASE_URL: appUrl.toString(),
      WORKSPACE_DB_SCHEMA: schema,
      WORKSPACE_DB_ALLOW_LOCAL: "true",
      WORKSPACE_AUTH_MODE: "dummy",
      WORKSPACE_ALLOWED_USER_ID: "11111111-1111-4111-8111-111111111111",
      WORKSPACE_DUMMY_PASSWORD: "local-preview-only",
      WORKSPACE_TOKEN_KEYS: keyRing("local-token"),
      WORKSPACE_RECEIPT_KEYS: keyRing("local-receipt"),
      OCR_PROVIDER: "dummy",
      STRUCTURE_PROVIDER: "dummy",
      WEB_SUPPLEMENT_PROVIDER: "dummy",
      INTERVIEW_REVIEW_PROVIDER: "dummy",
    },
  },
);
let finishing = false;
async function finish() {
  if (finishing) return;
  finishing = true;
  let stopFailed = false;
  try {
    // Windows の Next 子プロセスも、このhelperが起動した既知PIDの木だけ終了する。
    if (process.platform === "win32" && child.pid && child.exitCode === null) {
      await new Promise((resolve, reject) => {
        execFile(
          "taskkill",
          ["/PID", String(child.pid), "/T", "/F"],
          (error) => {
            if (error && child.exitCode === null) reject(error);
            else resolve();
          },
        );
      });
    } else if (child.exitCode === null) child.kill("SIGTERM");
  } catch {
    stopFailed = true;
    child.kill("SIGTERM");
  }
  if (!/^u1_preview_[a-f0-9]{32}$/.test(schema))
    throw new Error("cleanup scope rejected");
  await admin.query(`DROP SCHEMA "${schema}" CASCADE`);
  await admin.end();
  console.log(
    JSON.stringify({
      dedicatedPreviewStopConfirmed: !stopFailed,
      dedicatedSchemaDropped: true,
    }),
  );
  process.exit(stopFailed ? 1 : 0);
}
process.once("SIGINT", () => void finish());
process.once("SIGTERM", () => void finish());
child.once("exit", () => void finish());
process.stdin.on("data", (data) => {
  if (String(data).trim() === "stop") void finish();
});
process.stdin.resume();
// stdinが閉じた実行環境でも専用previewを残さない。
setTimeout(() => void finish(), 300000).unref();
console.log(
  JSON.stringify({
    localPreview: "http://127.0.0.1:3000",
    helperPid: process.pid,
    nextPid: child.pid,
    schema,
    maximumLifetimeMs: 300000,
  }),
);
