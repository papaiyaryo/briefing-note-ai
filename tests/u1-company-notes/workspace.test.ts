import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { runtimeFixture, fixtureReceipt } from "./runtimeFixture";
import { id, manualCandidate, emptyStructure } from "./fixtures";
describe("保存業務 / US2 US6 US7 C2 C3", () => {
  let f: Awaited<ReturnType<typeof runtimeFixture>>;
  let companyId: string;
  beforeAll(async () => {
    f = await runtimeFixture();
    companyId = id();
    await f.service.mutate("company_create", f.principal, {
      operationId: id(),
      companyId,
      fields: { name: "保存先" },
    });
  });
  afterAll(async () => {
    await f?.close();
  });
  it("共有requireCompany契約で本人の企業を返す", async () => {
    const r = await f.service.requireCompany(f.principal, companyId);
    expect(r.ok).toBe(true);
  });
  it("画像キー・owner指定は入力境界で拒否", async () => {
    await expect(
      f.service.mutate("company_create", f.principal, {
        operationId: id(),
        companyId: id(),
        fields: { name: "社", ownerId: id() },
      }),
    ).rejects.toMatchObject({ code: "invalid_input" });
  });
  it("manualは自由本文のまま、構造追加は明示保存", async () => {
    const memoId = id();
    await f.service.mutate(
      "memo_create",
      f.principal,
      { operationId: id(), memoId, candidate: manualCandidate() },
      { companyId },
    );
    const before = await f.repo.readMemo(f.principal, companyId, memoId);
    expect(before.structuredContent).toBeNull();
    await f.service.mutate(
      "memo_update",
      f.principal,
      {
        operationId: id(),
        expectedVersion: before.version,
        changes: { structuredContent: emptyStructure() },
      },
      { companyId, memoId },
    );
    const after = await f.repo.readMemo(f.principal, companyId, memoId);
    expect(after.markdown).toBe(before.markdown);
    expect(after.origin).toBe("manual");
    expect(after.structuredContent).toEqual(emptyStructure());
  });
  it("偽生成出自を拒否して企業を変えない", async () => {
    await expect(
      f.service.mutate(
        "memo_create",
        f.principal,
        {
          operationId: id(),
          memoId: id(),
          candidate: {
            ...manualCandidate(),
            origin: "generated",
            providerOrigin: "openai",
            structuredContent: emptyStructure(),
            correctedOcr: "原文",
            event: { companyName: "別名", eventName: "", eventDate: "" },
            generationReceipt: fixtureReceipt(),
          },
        },
        { companyId },
      ),
    ).rejects.toMatchObject({ code: "invalid_input" });
    expect((await f.repo.readCompany(f.principal, companyId)).name).toBe(
      "保存先",
    );
  });
  it("正しいdummy出自と別名overviewを保存先IDへ保持", async () => {
    const memoId = id();
    await f.service.mutate(
      "memo_create",
      f.principal,
      {
        operationId: id(),
        memoId,
        candidate: {
          ...manualCandidate(),
          origin: "generated",
          providerOrigin: "dummy",
          structuredContent: {
            ...emptyStructure(),
            overview: { ...emptyStructure().overview, companyName: "生成名" },
          },
          correctedOcr: "原文",
          event: { companyName: "生成名", eventName: "", eventDate: "" },
          generationReceipt: fixtureReceipt(),
        },
      },
      { companyId },
    );
    expect(
      (await f.repo.readMemo(f.principal, companyId, memoId)).providerOrigin,
    ).toBe("dummy");
    expect((await f.repo.readCompany(f.principal, companyId)).name).toBe(
      "保存先",
    );
  });
  it("null構造メモは比較の成功元にしない", async () => {
    const memoId = id();
    await f.service.mutate(
      "memo_create",
      f.principal,
      { operationId: id(), memoId, candidate: manualCandidate() },
      { companyId },
    );
    const r = await f.service.readComparison(f.principal, [
      { companyId, memoId },
    ]);
    expect(r.ok).toBe(false);
  });
  it("企業志望度とメモ理由を独立保存", async () => {
    const c = await f.repo.readCompany(f.principal, companyId);
    const r = await f.service.updateCompany(f.principal, companyId, {
      operationId: id(),
      expectedVersion: c.version,
      changes: { interestLevel: "high" },
    });
    expect(r.ok).toBe(true);
    expect(
      (await f.repo.readCompany(f.principal, companyId)).personalNote,
    ).toBeNull();
  });
  it("不明なmutationと空changesを拒否", async () => {
    await expect(
      f.service.mutate(
        "company_update",
        f.principal,
        { operationId: id(), expectedVersion: id(), changes: {} },
        { companyId },
      ),
    ).rejects.toMatchObject({ code: "invalid_input" });
  });
});
