import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { Client } from "pg";
import { setupDatabase } from "./helpers";
import { id, OWNER_A, OWNER_B, emptyStructure } from "./fixtures";
import { structuredContentSchema } from "../../src/lib/workspace/schema";
import type { CompanyMemoStructured } from "../../src/lib/structure/schema";
import "./operationalCases";

describe("U1 実migration / AC1.2 AC2.1 AC6.5", () => {
  let db: Awaited<ReturnType<typeof setupDatabase>>;
  let app: Client;
  beforeAll(async () => {
    db = await setupDatabase();
    app = await db.connect();
  });
  afterAll(async () => {
    await app?.end();
    await db?.close();
  });
  it("非公開schemaに正本5表を用意", async () => {
    const r = await db.admin.query(
      "select tablename from pg_tables where schemaname=$1",
      [db.schema],
    );
    expect(r.rows.map((x) => x.tablename)).toEqual(
      expect.arrayContaining([
        "companies",
        "memos",
        "write_operations",
        "deletion_snapshots",
        "app_sessions",
      ]),
    );
  });
  it("normal roleはsuperuser/BYPASSRLSでない", async () => {
    const r = await app.query(
      "select rolsuper,rolbypassrls from pg_roles where rolname=current_user",
    );
    expect(r.rows[0]).toEqual({ rolsuper: false, rolbypassrls: false });
  });
  it("contextなしは企業が見えず書込も拒否", async () => {
    expect(
      (await app.query(`select * from ${db.schema}.companies`)).rows,
    ).toEqual([]);
    await expect(
      app.query(
        `insert into ${db.schema}.companies(company_id,owner_id,name) values($1,$2,'架空社')`,
        [id(), OWNER_A],
      ),
    ).rejects.toMatchObject({ code: "42501" });
  });
  it("owner RLSは他本人を読取不可", async () => {
    await db.admin.query(
      `insert into ${db.schema}.companies(company_id,owner_id,name) values($1,$2,'A社')`,
      [id(), OWNER_A],
    );
    await app.query("begin");
    await app.query("select set_config('app.owner_id',$1,true)", [OWNER_B]);
    expect(
      (await app.query(`select * from ${db.schema}.companies`)).rows,
    ).toEqual([]);
    await app.query("rollback");
  });
  it("複合FKで別ownerのメモ所属を拒否", async () => {
    const companyId = id();
    await db.admin.query(
      `insert into ${db.schema}.companies(company_id,owner_id,name) values($1,$2,'社')`,
      [companyId, OWNER_A],
    );
    await expect(
      db.admin.query(
        `insert into ${db.schema}.memos(memo_id,owner_id,company_id,origin,markdown) values($1,$2,$3,'manual','本文')`,
        [id(), OWNER_B, companyId],
      ),
    ).rejects.toMatchObject({ code: "23503" });
  });
  it("不正statusと空白名をDBも拒否", async () => {
    for (const [name, status] of [
      [" ", "not_applied"],
      ["社", "unknown"],
    ])
      await expect(
        db.admin.query(
          `insert into ${db.schema}.companies(company_id,owner_id,name,selection_status) values($1,$2,$3,$4)`,
          [id(), OWNER_A, name, status],
        ),
      ).rejects.toMatchObject({ code: "23514" });
  });
  it("画像・filenameの永続欄なし", async () => {
    const r = await db.admin.query(
      "select column_name from information_schema.columns where table_schema=$1",
      [db.schema],
    );
    expect(
      r.rows
        .map((x) => x.column_name)
        .some((x) => /image|filename|object_url/.test(x)),
    ).toBe(false);
  });
  it("rollbackで企業と成功操作が部分確定しない", async () => {
    const companyId = id();
    await db.admin.query("begin");
    await db.admin.query(
      `insert into ${db.schema}.companies(company_id,owner_id,name) values($1,$2,'rollback社')`,
      [companyId, OWNER_A],
    );
    await db.admin.query("rollback");
    expect(
      (
        await db.admin.query(
          `select * from ${db.schema}.companies where company_id=$1`,
          [companyId],
        )
      ).rowCount,
    ).toBe(0);
  });
  it("anon/authenticatedにはschema USAGEなし", async () => {
    for (const role of ["anon", "authenticated"])
      expect(
        (
          await db.admin.query(
            "select has_schema_privilege($1,$2,'USAGE') as allowed",
            [role, db.schema],
          )
        ).rows[0].allowed,
      ).toBe(false);
  });
  it("256KiB compact JSON boundary survives PostgreSQL jsonb formatting", async () => {
    const content: CompanyMemoStructured = emptyStructure();
    content.facts = Array.from({ length: 54 }, () => "x".repeat(4800));
    content.facts.push("");
    content.facts[54] = "x".repeat(
      262144 - Buffer.byteLength(JSON.stringify(content)),
    );
    expect(Buffer.byteLength(JSON.stringify(content))).toBe(262144);
    expect(structuredContentSchema.safeParse(content).success).toBe(true);
    const companyId = id();
    await db.admin.query(
      `insert into ${db.schema}.companies(company_id,owner_id,name) values($1,$2,'boundary')`,
      [companyId, OWNER_A],
    );
    await expect(
      db.admin.query(
        `insert into ${db.schema}.memos(memo_id,owner_id,company_id,origin,markdown,structured_content) values($1,$2,$3,'manual','boundary',$4)`,
        [id(), OWNER_A, companyId, JSON.stringify(content)],
      ),
    ).resolves.toMatchObject({ rowCount: 1 });
    content.facts[54] += "x";
    expect(structuredContentSchema.safeParse(content).success).toBe(false);
    await expect(
      db.admin.query(
        `insert into ${db.schema}.memos(memo_id,owner_id,company_id,origin,markdown,structured_content) values($1,$2,$3,'manual','boundary',$4)`,
        [id(), OWNER_A, companyId, JSON.stringify(content)],
      ),
    ).rejects.toMatchObject({ code: "23514" });
  });
});
