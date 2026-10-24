import { describe, expect, it } from "vitest";
import { performance } from "node:perf_hooks";
import { mkdir, writeFile } from "node:fs/promises";
import { runtimeFixture } from "./runtimeFixture";
import { OWNER_A, id } from "./fixtures";
describe("local capacity and two-client adapter reference", () => {
  it("reads 100 companies / 1000 memos / 10000 operations without body fan-out", async () => {
    const f = await runtimeFixture();
    try {
      const s = f.db.schema;
      await f.db.admin.query(
        `insert into ${s}.companies(company_id,owner_id,name,selection_status) select gen_random_uuid(),$1,'架空容量-'||n,'applied' from generate_series(1,100) n`,
        [OWNER_A],
      );
      const companies = (
        await f.db.admin.query(
          `select company_id from ${s}.companies order by company_id`,
        )
      ).rows;
      await f.db.admin.query(
        `insert into ${s}.memos(memo_id,owner_id,company_id,origin,markdown) select gen_random_uuid(),$1,c.company_id,'manual',repeat('架空',500) from ${s}.companies c cross join generate_series(1,10) n`,
        [OWNER_A],
      );
      await f.db.admin.query(
        `insert into ${s}.write_operations(owner_id,operation_id,request_fingerprint,action,company_id,resulting_version) select $1,gen_random_uuid(),repeat('0',64),'company_update',c.company_id,c.version from ${s}.companies c cross join generate_series(1,100) n`,
        [OWNER_A],
      );
      const sizes = await f.db.admin.query(
        `select (select count(*) from ${s}.companies)::int companies,(select count(*) from ${s}.memos)::int memos,(select count(*) from ${s}.write_operations)::int operations`,
      );
      expect(sizes.rows[0]).toEqual({
        companies: 100,
        memos: 1000,
        operations: 10000,
      });
      const operationId = (
        await f.db.admin.query(
          `select operation_id from ${s}.write_operations limit 1`,
        )
      ).rows[0].operation_id;
      const target = companies[0].company_id;
      const actions = {
        board: async () => {
          const cards = await f.repo.listCards(f.principal);
          expect(cards).toHaveLength(100);
          expect(
            cards.every((c) => c.memoCount === 10 && !("markdown" in c)),
          ).toBe(true);
        },
        detail: async () => {
          expect(
            (await f.repo.readCompany(f.principal, target)).companyId,
          ).toBe(target);
        },
        page: async () => {
          expect(
            (await f.repo.listMemos(f.principal, target, {})).items,
          ).toHaveLength(10);
        },
        operation: async () => {
          expect(
            (await f.repo.lookupOperation(f.principal, operationId)).state,
          ).toBe("committed");
        },
        delete50IncludingPreparation: async () => {
          const companyId = id();
          await f.db.admin.query(
            `insert into ${s}.companies(company_id,owner_id,name)values($1,$2,'架空50件削除')`,
            [companyId, OWNER_A],
          );
          await f.db.admin.query(
            `insert into ${s}.memos(memo_id,owner_id,company_id,origin,markdown)select gen_random_uuid(),$1,$2,'manual','架空本文' from generate_series(1,50)`,
            [OWNER_A, companyId],
          );
          const confirmation = await f.repo.confirmDeletion(f.principal, {
            companyId,
            memoId: null,
          });
          expect(confirmation.displayedMemoCount).toBe(50);
          const result = await f.repo.deleteConfirmed(f.principal, {
            operationId: id(),
            confirmationId: confirmation.confirmationId,
          });
          expect(result.replayed).toBe(false);
        },
      };
      const reference: Record<string, unknown> = {
        fixture: sizes.rows[0],
        clients: 2,
        warmups: 5,
        samplesPerClient: 50,
        condition: "local adapter only; external API p95 unverified",
        capacity: (
          await f.db.admin.query(
            "select pg_database_size(current_database())::text as local_database_bytes,coalesce(sum(pg_total_relation_size(c.oid)),0)::text as dedicated_schema_bytes from pg_class c join pg_namespace n on n.oid=c.relnamespace where n.nspname=$1 and c.relkind='r'",
            [s],
          )
        ).rows[0],
      };
      for (const [name, action] of Object.entries(actions)) {
        for (let n = 0; n < 5; n++) await action();
        const clients = await Promise.all(
          [0, 1].map(async () => {
            const durations: number[] = [];
            for (let n = 0; n < 50; n++) {
              const start = performance.now();
              await action();
              durations.push(performance.now() - start);
            }
            return durations;
          }),
        );
        const times = clients.flat().sort((a, b) => a - b);
        reference[name] = {
          p95Ms: Number(times[Math.ceil(times.length * 0.95) - 1].toFixed(2)),
          maximumMs: Number(times.at(-1)!.toFixed(2)),
          failures: 0,
        };
      }
      const mutation = await f.repo.createCompany(f.principal, {
        operationId: id(),
        companyId: id(),
        fields: { name: "容量後も保存可" },
      });
      expect(mutation.replayed).toBe(false);
      console.log(JSON.stringify({ u1LocalReference: reference }));
      await mkdir(".npm", { recursive: true });
      await writeFile(
        ".npm/u1-local-reference.json",
        JSON.stringify(reference, null, 2),
      );
    } finally {
      await f.close();
    }
  }, 60000);
});
