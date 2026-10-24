import { beforeAll, beforeEach, afterAll, expect, it, vi } from "vitest";
import { runtimeFixture } from "../u1-company-notes/runtimeFixture";
import { createWorkspaceHandler } from "../../src/lib/server/workspace/http";
import { WorkspaceClient } from "../../src/lib/workspace/client";
import {
  emptyStructure,
  manualCandidate,
  OWNER_B,
} from "../u1-company-notes/fixtures";
import { id, selection } from "./fixtures";
const target = "../../src/lib/companyComparison/client";
let f: Awaited<ReturnType<typeof runtimeFixture>>,
  handle: ReturnType<typeof createWorkspaceHandler>,
  companyId: string,
  memoId: string;
function request(
  path: string,
  method = "GET",
  body?: unknown,
  cookie = f.cookie,
  origin = "http://localhost",
) {
  return new Request(`http://localhost${path}`, {
    method,
    headers: {
      Cookie: cookie,
      Origin: origin,
      "Content-Type": "application/json",
    },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });
}
async function client(lose = false) {
  const m = await import(target).catch(() => null);
  expect(m, "U3 consumerが実装されている").not.toBeNull();
  return new m!.ComparisonClient(
    new WorkspaceClient({
      fetch: async (path, init) => {
        const response = await handle(
          new Request(`http://localhost${path}`, {
            ...init,
            headers: {
              ...init?.headers,
              Cookie: f.cookie,
              Origin: "http://localhost",
            },
          }),
        );
        if (lose && init?.method === "PATCH")
          throw TypeError("lost after COMMIT");
        return response;
      },
    }),
  );
}
const selected = () => [{ companyId, memoId }];
beforeAll(async () => {
  f = await runtimeFixture();
  handle = createWorkspaceHandler(() => f);
});
beforeEach(async () => {
  companyId = id();
  memoId = id();
  expect(
    (
      await handle(
        request("/api/v1/companies", "POST", {
          operationId: id(),
          companyId,
          fields: { name: "保存企業" },
        }),
      )
    ).status,
  ).toBe(201);
  expect(
    (
      await handle(
        request(`/api/v1/companies/${companyId}/memos`, "POST", {
          operationId: id(),
          memoId,
          candidate: {
            ...manualCandidate(),
            structuredContent: { ...emptyStructure(), strengths: ["紙の強み"] },
            comparisonReason: "旧理由",
          },
        }),
      )
    ).status,
  ).toBe(201);
});
afterAll(async () => {
  await f?.close();
});
it("AC8.1.1: U3経由で実migration/PGから同じ企業メモを一貫取得", async () => {
  const c = await client(),
    s = await c.readComparison(selected());
  expect(selection(s)).toEqual(selected());
  expect(s.sources[0].memo.structuredContent.strengths).toEqual(["紙の強み"]);
});
it("BR4.1: 企業志望度限定更新・理由/構造/本文不変", async () => {
  const c = await client(),
    s = await c.readComparison(selected());
  await c.send(
    c.prepareInterest(companyId, s.sources[0].company.version, "high", id()),
  );
  const next = await c.readComparison(selected());
  expect(next.sources[0].company.interestLevel).toBe("high");
  expect(next.sources[0].memo).toEqual(s.sources[0].memo);
});
it("BR4.1: メモ理由限定更新・企業/本文/構造不変", async () => {
  const c = await client(),
    s = await c.readComparison(selected());
  await c.send(
    c.prepareReason(
      companyId,
      memoId,
      s.sources[0].memo.version,
      "新理由",
      id(),
    ),
  );
  const next = await c.readComparison(selected());
  expect(next.sources[0].company).toEqual(s.sources[0].company);
  expect(next.sources[0].memo).toMatchObject({
    markdown: s.sources[0].memo.markdown,
    structuredContent: s.sources[0].memo.structuredContent,
    comparisonReason: "新理由",
  });
});
it("NFR3.1: 旧版更新は409・先行値を保持", async () => {
  const c = await client(),
    s = await c.readComparison(selected()),
    v = s.sources[0].company.version;
  await c.send(c.prepareInterest(companyId, v, "high", id()));
  await expect(
    c.send(c.prepareInterest(companyId, v, "low", id())),
  ).rejects.toMatchObject({ code: "version_conflict", status: 409 });
  expect(
    (await c.readComparison(selected())).sources[0].company.interestLevel,
  ).toBe("high");
});
it("NFR2.4: 同一凍結操作再送で操作記録/版を増やさない", async () => {
  const c = await client(),
    s = await c.readComparison(selected()),
    fixed = c.prepareReason(
      companyId,
      memoId,
      s.sources[0].memo.version,
      "理由",
      id(),
    ),
    first = await c.send(fixed);
  expect(await c.send(fixed)).toEqual(first);
  expect(await c.lookup(JSON.parse(fixed.body).operationId)).toEqual({
    state: "committed",
    outcome: first,
  });
});
it("NFR2.4: COMMIT後応答途絶を同ID照会で解決", async () => {
  const c = await client(true),
    s = await c.readComparison(selected()),
    operation = id();
  await expect(
    c.send(
      c.prepareInterest(
        companyId,
        s.sources[0].company.version,
        "low",
        operation,
      ),
    ),
  ).rejects.toMatchObject({ unknown: true });
  expect(await c.lookup(operation)).toMatchObject({
    state: "committed",
    outcome: { operationId: operation },
  });
  expect(
    (await c.readComparison(selected())).sources[0].company.interestLevel,
  ).toBe("low");
});
it("NFR1.1: 未認証/不正Originをhandlerで拒否", async () => {
  expect(
    (
      await handle(
        request(
          "/api/v1/comparison-sources",
          "POST",
          { selected: selected() },
          "",
        ),
      )
    ).status,
  ).toBe(401);
  expect(
    (
      await handle(
        request(
          "/api/v1/comparison-sources",
          "POST",
          { selected: selected() },
          f.cookie,
          "http://other.test",
        ),
      )
    ).status,
  ).toBe(403);
});
it("NFR1.1: 他ownerと不存在を同404・内容非漏洩", async () => {
  const foreign = id();
  await f.db.admin.query(
    `insert into ${f.db.schema}.companies(company_id,owner_id,name) values($1,$2,$3)`,
    [foreign, OWNER_B, "別本人の秘密"],
  );
  for (const companyId of [foreign, id()]) {
    const r = await handle(
      request("/api/v1/comparison-sources", "POST", {
        selected: [{ companyId, memoId }],
      }),
    );
    expect(r.status).toBe(404);
    expect(await r.text()).not.toContain("別本人の秘密");
  }
});
it("BR2.3: 他企業メモと本文のみは比較成功にしない", async () => {
  const c = await client(),
    second = id();
  await handle(
    request(`/api/v1/companies/${companyId}/memos`, "POST", {
      operationId: id(),
      memoId: second,
      candidate: manualCandidate(),
    }),
  );
  await expect(
    c.readComparison([{ companyId, memoId: second }]),
  ).rejects.toThrow();
  await expect(
    c.readComparison([{ companyId: id(), memoId }]),
  ).rejects.toThrow();
});
it("NFR3.3: 別client変更は各memo版で検出・削除参照は404", async () => {
  const c = await client(),
    s = await c.readComparison(selected());
  await handle(
    request(`/api/v1/companies/${companyId}/memos/${memoId}`, "PATCH", {
      operationId: id(),
      expectedVersion: s.sources[0].memo.version,
      changes: { markdown: "本文だけ変更" },
    }),
  );
  const next = await c.readComparison(selected());
  expect(next.sources[0].memo.version).not.toBe(s.sources[0].memo.version);
  expect(next.sources[0].memo.structuredContent).toEqual(
    s.sources[0].memo.structuredContent,
  );
  const confirmation = await (
    await handle(
      request("/api/v1/deletion-confirmations", "POST", { companyId, memoId }),
    )
  ).json();
  expect(
    (
      await handle(
        request("/api/v1/deletions", "POST", {
          operationId: id(),
          confirmationId: confirmation.confirmationId,
        }),
      )
    ).status,
  ).toBe(200);
  await expect(c.readComparison(selected())).rejects.toMatchObject({
    status: 404,
    unknown: false,
  });
});

async function deletedReferenceGuard(removeCompany: boolean) {
  const sessionPath = "../../src/lib/companyComparison/session";
  const editsPath = "../../src/lib/companyComparison/edits";
  const { ComparisonSession } = await import(sessionPath);
  const { ComparisonEdits } = await import(editsPath);
  const c = await client(removeCompany), s = await c.readComparison(selected());
  const session = new ComparisonSession();
  session.setOwner("fixture-owner"); session.select(selected()); session.install(s, session.token());
  const interest = session.ensureField(s.sources[0], "interest"), reason = session.ensureField(s.sources[0], "reason");
  const send = vi.spyOn(c, "send"), prepare = vi.spyOn(c, "prepareReason");
  const edits = new ComparisonEdits(session, c);
  session.edit(reason, "保持入力");
  if (removeCompany) await edits.save(reason);
  const pending = session.state.fields.get(reason).intent;
  const confirmation = await (await handle(request("/api/v1/deletion-confirmations", "POST", { companyId, memoId: removeCompany ? null : memoId }))).json();
  expect((await handle(request("/api/v1/deletions", "POST", { operationId: id(), confirmationId: confirmation.confirmationId }))).status).toBe(200);
  const token = session.beginRequest();
  await expect(c.readComparison(selected())).rejects.toMatchObject({ code: "not_found", status: 404, unknown: false });
  session.invalidateReferences(token);
  if (removeCompany) {
    expect(session.state.fields.get(reason).status).toBe("unknown");
    await edits.lookup(reason);
    expect(session.state.fields.get(reason)).toMatchObject({ status: "committed", intent: { request: pending.request }, outcome: { operationId: JSON.parse(pending.request.body).operationId }, readbackState: "error" });
    session.edit(reason, "次の保持入力");
  }
  session.edit(interest, "high");
  const beforeSend = send.mock.calls.length, beforePrepare = prepare.mock.calls.length;
  await edits.save(reason); await edits.save(interest);
  expect(send.mock.calls).toHaveLength(beforeSend);
  expect(prepare.mock.calls).toHaveLength(beforePrepare);
  expect(session.isFieldAvailable(session.state.fields.get(reason))).toBe(false);
  expect(session.isFieldAvailable(session.state.fields.get(interest))).toBe(false);
  expect(session.state.selected).toEqual(selected());
  expect(session.state.snapshot).toEqual(s);
  expect(session.state.fields.get(reason).draftValue).toBe(removeCompany ? "次の保持入力" : "保持入力");
  expect(session.state.status).not.toBe("ready");
}
it("I-R1 AC6.4.3: 実PGメモ削除→C3 404→参照停止後の新operation/PATCH0", async () => {
  await deletedReferenceGuard(false);
});
it("I-R2 AC6.5.4: 実PG企業削除→両欄新PATCH0、送信済み同ID照会の確定保持", async () => {
  await deletedReferenceGuard(true);
});
