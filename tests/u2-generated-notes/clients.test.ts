import { afterEach, describe, expect, it, vi } from "vitest";
import { requestOcr } from "../../src/lib/ocrClient";
import { requestStructure } from "../../src/lib/structureClient";
import {
  requestWebSupplement,
  requestWebSupplements,
} from "../../src/lib/webSupplementClient";
import { requestInterviewReview } from "../../src/lib/interviewReviewClient";
import { buildDummyWebSupplement } from "../../src/lib/webSupplement/dummy";
import { buildDummyInterviewReview } from "../../src/lib/interviewReview/dummy";
import { candidate } from "./fixtures";
import { mapGeneratedCandidate } from "../../src/lib/generation/candidate";
const c = candidate();
const file = new File([new Uint8Array([1])], "fictional.png", {
  type: "image/png",
});
const entries = [
  {
    name: "ocr",
    run: (signal?: AbortSignal) => requestOcr(file, signal),
    body: { text: "架空OCR", provider: "dummy", generationReceipt: "proof" },
  },
  {
    name: "structure",
    run: (signal?: AbortSignal) =>
      (requestStructure as (...args: unknown[]) => Promise<unknown>)(
        "OCR",
        c.event,
        signal,
      ),
    body: {
      memo: c.structuredContent,
      provider: "dummy",
      generationReceipt: "proof",
    },
  },
  {
    name: "web",
    run: (signal?: AbortSignal) =>
      requestWebSupplement("架空", { enabled: true, ...{ signal } }),
    body: {
      result: buildDummyWebSupplement("架空"),
      provider: "dummy",
      generationReceipt: "proof",
    },
  },
  {
    name: "review",
    run: (signal?: AbortSignal) =>
      requestInterviewReview(c.structuredContent, [], signal),
    body: {
      review: buildDummyInterviewReview(c.structuredContent),
      provider: "dummy",
      generationReceipt: "proof",
    },
  },
];
afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});
describe("validated client results / C5 NFR2.1 NFR4.3", () => {
  it("preserves C5 要確認 date for explicit C2 confirmation, without relaxing save validation", async () => {
    const memo = {
      ...c.structuredContent,
      overview: { ...c.structuredContent.overview, eventDate: "要確認" },
    };
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValue(
          Response.json({
            memo,
            provider: "dummy",
            generationReceipt: "proof",
          }),
        ),
    );
    const response = await requestStructure("OCR", c.event);
    expect(response.memo.overview.eventDate).toBe("要確認");
    expect(() =>
      mapGeneratedCandidate({ ...c, structuredContent: response.memo }),
    ).toThrow();
  });
  it.each(entries)(
    "$name rejects an invalid optional proof type",
    async ({ run, body }) => {
      vi.stubGlobal(
        "fetch",
        vi
          .fn()
          .mockResolvedValue(
            Response.json({ ...body, generationReceipt: 123 }),
          ),
      );
      await expect(run()).rejects.toMatchObject({ code: "validation_failed" });
    },
  );
  it.each(entries)(
    "$name never dispatches an already cancelled request",
    async ({ run }) => {
      const controller = new AbortController();
      controller.abort();
      vi.stubGlobal(
        "fetch",
        vi.fn().mockRejectedValue(new DOMException("cancelled", "AbortError")),
      );
      await expect(run(controller.signal)).rejects.toThrow();
      expect(fetch).not.toHaveBeenCalled();
    },
  );
  it.each(entries)(
    "$name preserves valid response and optional receipt",
    async ({ run, body }) => {
      vi.stubGlobal("fetch", vi.fn().mockResolvedValue(Response.json(body)));
      expect(await run()).toEqual(body);
      expect(fetch).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          credentials: "same-origin",
          cache: "no-store",
          signal: expect.any(AbortSignal),
        }),
      );
    },
  );
  it.each(entries)("$name rejects malformed success", async ({ run }) => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(Response.json({ provider: "untrusted" })),
    );
    await expect(run()).rejects.toMatchObject({ code: "validation_failed" });
  });
  it.each(entries)(
    "$name rejects abort before or after late response",
    async ({ run, body }) => {
      const controller = new AbortController();
      let finish!: (response: Response) => void;
      vi.stubGlobal(
        "fetch",
        vi.fn(
          () =>
            new Promise<Response>((r) => {
              finish = r;
            }),
        ),
      );
      const pending = run(controller.signal);
      const rejected = expect(pending).rejects.toThrow();
      await Promise.resolve();
      controller.abort();
      finish(Response.json(body));
      await rejected;
    },
  );
  it("ends browser wait at45sec even for an uncooperative fetch", async () => {
    vi.useFakeTimers();
    vi.stubGlobal(
      "fetch",
      vi.fn(() => new Promise(() => {})),
    );
    const pending = entries[1].run();
    const rejected = expect(pending).rejects.toThrow();
    await vi.advanceTimersByTimeAsync(45000);
    await rejected;
    expect(vi.getTimerCount()).toBe(0);
  });
  it("also bounds response-body decoding", async () => {
    vi.useFakeTimers();
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: () => new Promise(() => {}),
      }),
    );
    const pending = entries[1].run();
    const rejected = expect(pending).rejects.toThrow();
    await vi.advanceTimersByTimeAsync(45000);
    await rejected;
    expect(vi.getTimerCount()).toBe(0);
  });
  it.each(["unauthenticated", "origin_forbidden"])(
    "handles C5 union %s without reflecting external message",
    async (code) => {
      vi.stubGlobal(
        "fetch",
        vi
          .fn()
          .mockResolvedValue(
            Response.json(
              { error: { code, message: "PRIVATE_PROVIDER_TEXT" } },
              { status: code === "unauthenticated" ? 401 : 403 },
            ),
          ),
      );
      await expect(entries[1].run()).rejects.toMatchObject({ code });
      try {
        await entries[1].run();
      } catch (error) {
        expect(String(error)).not.toContain("PRIVATE_PROVIDER_TEXT");
      }
    },
  );
  it("normalizes a date-only retrieval to UTC day start without claiming instant precision", async () => {
    const result = buildDummyWebSupplement("架空");
    result.items[0].retrievedAt = "2026-07-01";
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(Response.json({ result, provider: "dummy" })),
    );
    const sources = await requestWebSupplements("OCR", c.event);
    expect(sources[0]).toMatchObject({
      id: `1-${result.items[0].sourceUrl}`,
      sourceUrl: result.items[0].sourceUrl,
      fetchedAt: "2026-07-01T00:00:00Z",
      confidence: "requires_check",
      status: "pending",
    });
  });
  it("retains an existing valid datetime exactly", async () => {
    const result = buildDummyWebSupplement("架空");
    result.items[0].retrievedAt = "2026-07-01T09:30:00+09:00";
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(Response.json({ result, provider: "dummy" })),
    );
    expect((await requestWebSupplements("OCR", c.event))[0].fetchedAt).toBe(
      result.items[0].retrievedAt,
    );
  });
  it("rejects an impossible calendar retrieval date", async () => {
    const result = buildDummyWebSupplement("架空");
    result.items[0].retrievedAt = "2026-02-30";
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(Response.json({ result, provider: "dummy" })),
    );
    await expect(requestWebSupplements("OCR", c.event)).rejects.toMatchObject({
      code: "validation_failed",
    });
  });
});
