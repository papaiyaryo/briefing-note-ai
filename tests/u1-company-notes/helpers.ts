import { Client } from "pg";
import { randomUUID } from "node:crypto";
import { readFile } from "node:fs/promises";
import { fixtureDiagnostic } from "./fixtureDiagnostics";

export type FixtureStageObserver = (stage: string) => void;

export async function setupDatabase(observe?: FixtureStageObserver) {
  const connectionString =
    process.env.U1_TEST_DATABASE_URL ??
    "postgresql://workspace_test_admin:local-test-only@127.0.0.1:55432/workspace_test";
  const url = new URL(connectionString);
  if (
    !["127.0.0.1", "localhost"].includes(url.hostname) ||
    url.pathname !== "/workspace_test"
  )
    throw new Error("隔離ローカル試験DBだけを許可します");
  const schema = `u1_test_${randomUUID().replaceAll("-", "")}`;
  const diagnostic = fixtureDiagnostic(schema);
  const report = (stage: string) => {
    observe?.(stage);
    diagnostic?.stage(stage);
  };
  const admin = new Client({ connectionString,
    ...(diagnostic ? { application_name: diagnostic.applicationName("a") } : {}),
  });
  report("admin-connect:start");
  await admin.connect();
  await diagnostic?.register(admin, "a");
  report("admin-connect:done");
  report("bootstrap:start");
  await admin.query(
    await readFile("tests/u1-company-notes/db/bootstrap.sql", "utf8"),
  );
  report("bootstrap:done");
  report("migration:start");
  const sql = await readFile("db/migrations/001-company-workspace.sql", "utf8");
  await admin.query(
    sql
      .replaceAll("__SCHEMA__", schema)
      .replaceAll("__APP_ROLE__", "workspace_test_app"),
  );
  report("migration:done");
  const connect = async () => {
    const appUrl = new URL(url);
    appUrl.username = "workspace_test_app";
    appUrl.password = "local-app-test-only";
    const client = new Client({ connectionString: appUrl.toString(),
      ...(diagnostic ? { application_name: diagnostic.applicationName("p") } : {}),
    });
    await client.connect();
    await diagnostic?.register(client, "p");
    return client;
  };
  return {
    schema,
    admin,
    connect,
    diagnostic,
    async close() {
      report("schema-cleanup:start");
      if (!/^u1_test_[a-f0-9]{32}$/.test(schema))
        throw new Error("cleanup scope rejected");
      await admin.query(`DROP SCHEMA "${schema}" CASCADE`);
      report("schema-cleanup:done");
      await admin.end();
      report("admin-close:done");
    },
  };
}
