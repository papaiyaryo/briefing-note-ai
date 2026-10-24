import { afterEach, expect, it, vi } from "vitest";
import { WorkspaceClient } from "../../src/lib/workspace/client";
import { snapshot, selection, id, company, memo, instant } from "./fixtures";
const target = "../../src/lib/companyComparison/client";
it("C3: 不透明なexpectedVersionを解釈せず同じ値で凍結する", async () => {
  const c = await create(vi.fn()),
    a = company();
  expect(
    JSON.parse(
      c.prepareInterest(a.companyId, "opaque:company-v2", "high", id()).body,
    ).expectedVersion,
  ).toBe("opaque:company-v2");
  expect(
    JSON.parse(
      c.prepareReason(a.companyId, id(), "opaque:memo-v3", "理由", id()).body,
    ).expectedVersion,
  ).toBe("opaque:memo-v3");
});
async function create(fetch: typeof globalThis.fetch) {
  const m = await import(target).catch(() => null);
  expect(m, "U3 consumerが実装されている").not.toBeNull();
  return new m!.ComparisonClient(
    new WorkspaceClient({ fetch, sleep: async () => {} }),
  );
}
const ok = (value: unknown) => Response.json(value);
it("C3: 概要版と確定版も非空opaqueを保持する", async () => {
  const a = company(),
    m = memo(a.companyId),
    operationId = id();
  const {
    markdown,
    structuredContent,
    correctedOcr,
    event,
    adoptedWebSources,
    comparisonReason,
    ...summary
  } = m;
  void [
    markdown,
    structuredContent,
    correctedOcr,
    event,
    adoptedWebSources,
    comparisonReason,
  ];
  const fetch = vi
    .fn<typeof globalThis.fetch>()
    .mockResolvedValueOnce(
      ok({
        items: [
          { ...summary, version: "opaque:memo-v1", hasStructuredContent: true },
        ],
        nextCursor: null,
      }),
    )
    .mockResolvedValueOnce(
      ok({
        operationId,
        action: "company_update",
        companyId: a.companyId,
        memoId: null,
        resultingVersion: "opaque:committed-v2",
        committedAt: instant,
      }),
    );
  const c = await create(fetch);
  expect((await c.readMemos(a.companyId)).items[0].version).toBe(
    "opaque:memo-v1",
  );
  expect(
    (
      await c.send(
        c.prepareInterest(a.companyId, a.version, "high", operationId),
      )
    ).resultingVersion,
  ).toBe("opaque:committed-v2");
});
afterEach(() => vi.useRealTimers());
it("BR2.3: 選択全体を1POST、no-store/Cookie/JSONで読む", async () => {
  const s = snapshot(),
    fetch = vi.fn(async () => ok(s)),
    c = await create(fetch);
  expect(await c.readComparison(selection(s))).toEqual(s);
  expect(fetch).toHaveBeenCalledOnce();
  expect(fetch.mock.calls[0]).toMatchObject([
    "/api/v1/comparison-sources",
    {
      method: "POST",
      cache: "no-store",
      credentials: "same-origin",
      body: JSON.stringify({ selected: selection(s) }),
    },
  ]);
});
it("NFR7.2: 0/21/重複はfetch前拒否", async () => {
  const fetch = vi.fn(),
    c = await create(fetch);
  for (const selected of [
    [],
    selection(snapshot(21)),
    [...selection(snapshot(1)), ...selection(snapshot(1))].map(
      (x, _, a) => a[0],
    ),
  ])
    await expect(c.readComparison(selected)).rejects.toThrow();
  expect(fetch).not.toHaveBeenCalled();
});
it("NFR1.4: 不足/余分/入替を拒否", async () => {
  const s = snapshot();
  for (const sources of [
    s.sources.slice(1),
    [...s.sources, s.sources[0]],
    [...s.sources].reverse(),
  ]) {
    const c = await create(vi.fn(async () => ok({ ...s, sources })));
    await expect(c.readComparison(selection(s))).rejects.toMatchObject({
      code: "invalid_input",
      unknown: false,
    });
  }
});
it("NFR1.4: 不正構造と所属違いを拒否", async () => {
  const s = snapshot(1),
    selected = selection(s);
  for (const extra of [{ structuredContent: null }, { companyId: id() }]) {
    const c = await create(
      vi.fn(async () =>
        ok({
          ...s,
          sources: [
            { ...s.sources[0], memo: { ...s.sources[0].memo, ...extra } },
          ],
        }),
      ),
    );
    await expect(c.readComparison(selected)).rejects.toMatchObject({
      code: "invalid_input",
    });
  }
});
it("NFR2.4: 比較POST切断はread失敗・unknown false・自動再送なし", async () => {
  const fetch = vi.fn<typeof globalThis.fetch>(async () => {
      throw TypeError("offline");
    }),
    c = await create(fetch);
  await expect(c.readComparison(selection(snapshot(1)))).rejects.toMatchObject({
    unknown: false,
  });
  expect(fetch).toHaveBeenCalledOnce();
  expect(
    fetch.mock.calls.every(([path]) => !String(path).includes("operations")),
  ).toBe(true);
});
it.each([401, 403, 404])(
  "NFR1.1: 比較HTTP%sをそのまま拒否・再送しない",
  async (status) => {
    const fetch = vi.fn(async () =>
        Response.json(
          {
            error: {
              code:
                status === 401
                  ? "unauthenticated"
                  : status === 403
                    ? "origin_forbidden"
                    : "not_found",
            },
          },
          { status },
        ),
      ),
      c = await create(fetch);
    await expect(
      c.readComparison(selection(snapshot(1))),
    ).rejects.toMatchObject({ status, unknown: false });
    expect(fetch).toHaveBeenCalledOnce();
  },
);
it("NFR2.1: board GETネットワーク失敗は1回だけretry、終了企業を要求", async () => {
  const fetch = vi
      .fn()
      .mockRejectedValueOnce(TypeError("offline"))
      .mockResolvedValue(
        ok({
          snapshotVersion: id(),
          cards: [],
          countsByStatus: {
            not_applied: 0,
            considering: 0,
            applied: 0,
            screening: 0,
            interview: 0,
            offer: 0,
            withdrawn: 0,
            rejected: 0,
          },
          savedCompanyCount: 0,
          visibleCompanyCount: 0,
          activeCompanyCount: 0,
          showEnded: true,
        }),
      ),
    c = await create(fetch);
  expect((await c.readBoard()).showEnded).toBe(true);
  expect(fetch).toHaveBeenCalledTimes(2);
  expect(fetch.mock.calls[0][0]).toBe("/api/v1/board?showEnded=true");
});
it("BR2.2: メモ概要ページとnextCursorを保持", async () => {
  const a = company(),
    m = memo(a.companyId),
    {
      markdown,
      structuredContent,
      correctedOcr,
      event,
      adoptedWebSources,
      comparisonReason,
      ...summary
    } = m;
  void [
    markdown,
    structuredContent,
    correctedOcr,
    event,
    adoptedWebSources,
    comparisonReason,
  ];
  const fetch = vi.fn<typeof globalThis.fetch>(async () =>
      ok({
        items: [{ ...summary, hasStructuredContent: true }],
        nextCursor: "opaque-next",
      }),
    ),
    c = await create(fetch);
  expect((await c.readMemos(a.companyId, "opaque-cursor")).nextCursor).toBe(
    "opaque-next",
  );
  expect(fetch.mock.calls[0][0]).toContain("cursor=opaque-cursor");
});
it("NFR1.4: 不正board/一覧はempty成功にしない", async () => {
  const c = await create(vi.fn(async () => ok({ cards: [], items: [] })));
  await expect(c.readBoard()).rejects.toMatchObject({ code: "invalid_input" });
  await expect(c.readMemos(id())).rejects.toMatchObject({
    code: "invalid_input",
  });
});
it("NFR2.1: fetchがabort無視でも15秒で有限終了・late採用なし", async () => {
  const s = snapshot(1);
  let resolve!: (value: Response) => void;
  const c = await create(
    vi.fn(
      () =>
        new Promise<Response>((r) => {
          resolve = r;
        }),
    ),
  );
  vi.useFakeTimers();
  const result = c.readComparison(selection(s));
  const rejected = expect(result).rejects.toMatchObject({ unknown: false });
  await vi.advanceTimersByTimeAsync(15000);
  await rejected;
  resolve(ok(s));
  await Promise.resolve();
  expect(vi.getTimerCount()).toBe(0);
});
it("NFR2.1: body jsonが完了しなくても有限終了", async () => {
  const c = await create(
    vi.fn(
      async () =>
        ({
          ok: true,
          status: 200,
          json: () => new Promise(() => {}),
        }) as Response,
    ),
  );
  vi.useFakeTimers();
  const result = c.readComparison(selection(snapshot(1)));
  const rejected = expect(result).rejects.toThrow();
  await vi.advanceTimersByTimeAsync(15000);
  await rejected;
  expect(vi.getTimerCount()).toBe(0);
});
it("BR1.2: 外部取消後late成功を拒否", async () => {
  const s = snapshot(1);
  let resolve!: (r: Response) => void;
  const c = await create(
      vi.fn(
        () =>
          new Promise<Response>((r) => {
            resolve = r;
          }),
      ),
    ),
    abort = new AbortController();
  const result = c.readComparison(selection(s), abort.signal);
  const rejected = expect(result).rejects.toMatchObject({
    code: "cancelled",
    unknown: false,
  });
  abort.abort();
  resolve(ok(s));
  await rejected;
});
it("BR4.1: 許容欄だけ凍結した更新要求を送信", async () => {
  const a = company(),
    operationId = id(),
    fetch = vi.fn(async () =>
      ok({
        operationId,
        action: "company_update",
        companyId: a.companyId,
        memoId: null,
        resultingVersion: id(),
        committedAt: instant,
      }),
    ),
    c = await create(fetch);
  const request = c.prepareInterest(
    a.companyId,
    a.version,
    "high",
    operationId,
  );
  await c.send(request);
  expect(JSON.parse(request.body)).toEqual({
    operationId,
    expectedVersion: a.version,
    changes: { interestLevel: "high" },
  });
  expect(Object.isFrozen(request)).toBe(true);
});
it("BR4.1: 理由5000codepoints許容/5001拒否・空欄null", async () => {
  const c = await create(vi.fn()),
    a = company(),
    m = memo(a.companyId);
  expect(
    JSON.parse(c.prepareReason(a.companyId, m.memoId, m.version, "", id()).body)
      .changes,
  ).toEqual({ comparisonReason: null });
  expect(() =>
    c.prepareReason(a.companyId, m.memoId, m.version, "😀".repeat(5000), id()),
  ).not.toThrow();
  expect(() =>
    c.prepareReason(a.companyId, m.memoId, m.version, "😀".repeat(5001), id()),
  ).toThrow();
});
it("BR4.2: 更新途絶はunknown、照会は既存operations", async () => {
  const fetch = vi
      .fn()
      .mockRejectedValueOnce(TypeError("lost"))
      .mockResolvedValue(ok({ state: "unknown" })),
    c = await create(fetch),
    a = company(),
    operation = id();
  await expect(
    c.send(c.prepareInterest(a.companyId, a.version, null, operation)),
  ).rejects.toMatchObject({ unknown: true });
  expect(await c.lookup(operation)).toEqual({ state: "unknown" });
  expect(fetch.mock.calls[1][0]).toBe(`/api/v1/operations/${operation}`);
});
it("NFR1.4: 不正outcome/lookupを成功として受理しない", async () => {
  const c = await create(
      vi.fn(async () => ok({ state: "committed", outcome: {} })),
    ),
    a = company();
  await expect(
    c.send(c.prepareInterest(a.companyId, a.version, null, id())),
  ).rejects.toMatchObject({ unknown: true });
  await expect(c.lookup(id())).rejects.toMatchObject({ code: "invalid_input" });
});
