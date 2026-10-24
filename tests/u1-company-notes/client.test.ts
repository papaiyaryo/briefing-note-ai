import { describe, expect, it, vi } from "vitest";
import {
  WorkspaceClient,
  ClientFailure,
  notifyUnauthorized,
  protectedProviderFetch,
} from "../../src/lib/workspace/client";
describe("bounded same-origin workspace client", () => {
  it("late 401 from an invalidated context cannot invalidate a new context", async () => {
    let resolve!: (response: Response) => void;
    const fetch = vi.fn(
      () =>
        new Promise<Response>((done) => {
          resolve = done;
        }),
    );
    const onUnauthorized = vi.fn();
    const pending = new WorkspaceClient({ fetch, onUnauthorized }).get(
      "/api/v1/board",
    );
    notifyUnauthorized();
    resolve(
      Response.json({ error: { code: "unauthenticated" } }, { status: 401 }),
    );
    await expect(pending).rejects.toMatchObject({ code: "unauthenticated" });
    expect(onUnauthorized).not.toHaveBeenCalled();
  });
  it("late provider 401 emits no second invalidation after logout", async () => {
    const target = new EventTarget(),
      listener = vi.fn();
    target.addEventListener("workspace:unauthenticated", listener);
    let resolve!: (response: Response) => void;
    vi.stubGlobal("window", target);
    vi.stubGlobal(
      "fetch",
      vi.fn(
        () =>
          new Promise<Response>((done) => {
            resolve = done;
          }),
      ),
    );
    try {
      const pending = protectedProviderFetch("/api/structure", {
        method: "POST",
      });
      notifyUnauthorized();
      resolve(
        Response.json({ error: { code: "unauthenticated" } }, { status: 401 }),
      );
      await pending;
      expect(listener).toHaveBeenCalledTimes(1);
    } finally {
      vi.unstubAllGlobals();
    }
  });
  it.each(["ocr", "structure", "web", "review"])(
    "legacy %s client invalidates protected UI on 401",
    async (kind) => {
      const originalFetch = globalThis.fetch;
      const windowTarget = new EventTarget();
      vi.stubGlobal("window", windowTarget);
      const listener = vi.fn();
      windowTarget.addEventListener("workspace:unauthenticated", listener);
      vi.stubGlobal(
        "fetch",
        vi.fn().mockResolvedValue(
          Response.json(
            {
              error: {
                code: "unauthenticated",
                message: "本人のログインが必要です。",
              },
            },
            { status: 401 },
          ),
        ),
      );
      try {
        const run =
          kind === "ocr"
            ? () =>
                import("../../src/lib/ocrClient").then((m) =>
                  m.requestOcr(
                    new File(["dummy"], "dummy.png", { type: "image/png" }),
                  ),
                )
            : kind === "structure"
              ? () =>
                  import("../../src/lib/structureClient").then((m) =>
                    m.requestStructure("架空", {
                      companyName: "架空",
                      eventName: "",
                      eventDate: "",
                    }),
                  )
              : kind === "web"
                ? () =>
                    import("../../src/lib/webSupplementClient").then((m) =>
                      m.requestWebSupplement("架空", { enabled: true }),
                    )
                : () =>
                    Promise.all([
                      import("../../src/lib/interviewReviewClient"),
                      import("./fixtures"),
                    ]).then(([m, f]) =>
                      m.requestInterviewReview(f.emptyStructure()),
                    );
        await expect(run()).rejects.toThrow();
        expect(listener).toHaveBeenCalledOnce();
      } finally {
        vi.unstubAllGlobals();
        globalThis.fetch = originalFetch;
      }
    },
  );
  it("GET retries 503 once after 500ms with Cookie credentials", async () => {
    const fetch = vi
      .fn()
      .mockResolvedValueOnce(Response.json({}, { status: 503 }))
      .mockResolvedValueOnce(Response.json({ savedCompanyCount: 0 }));
    const sleep = vi.fn().mockResolvedValue(undefined);
    const client = new WorkspaceClient({ fetch, sleep });
    expect(await client.get("/api/v1/board")).toEqual({ savedCompanyCount: 0 });
    expect(fetch).toHaveBeenCalledTimes(2);
    expect(sleep).toHaveBeenCalledWith(500, expect.any(AbortSignal));
    expect(fetch.mock.calls[0][1]).toMatchObject({
      credentials: "same-origin",
      cache: "no-store",
    });
  });
  it("GET network failures are finite", async () => {
    const fetch = vi.fn().mockRejectedValue(new TypeError("network"));
    const client = new WorkspaceClient({ fetch, sleep: async () => {} });
    await expect(client.get("/api/v1/board")).rejects.toBeInstanceOf(
      ClientFailure,
    );
    expect(fetch).toHaveBeenCalledTimes(2);
  });
  it("401 invalidates protected state and never retries", async () => {
    const fetch = vi
      .fn()
      .mockResolvedValue(
        Response.json({ error: { code: "unauthenticated" } }, { status: 401 }),
      );
    const onUnauthorized = vi.fn();
    await expect(
      new WorkspaceClient({ fetch, onUnauthorized }).get("/api/v1/board"),
    ).rejects.toMatchObject({ code: "unauthenticated", unknown: false });
    expect(onUnauthorized).toHaveBeenCalledOnce();
    expect(fetch).toHaveBeenCalledOnce();
  });
  it("writes never automatically retry and retain immutable request", async () => {
    const fetch = vi.fn().mockRejectedValue(new TypeError("network"));
    const client = new WorkspaceClient({ fetch });
    const body = { operationId: "fixed", changes: { name: "first" } };
    const fixed = client.prepare("/api/v1/companies/x", "PATCH", body);
    body.changes.name = "later";
    await expect(client.send(fixed)).rejects.toMatchObject({ unknown: true });
    expect(fetch).toHaveBeenCalledOnce();
    expect(fixed.body).toContain("first");
    expect(Object.isFrozen(fixed)).toBe(true);
  });
  it("409 is known rejection and preserves safe message", async () => {
    const fetch = vi.fn().mockResolvedValue(
      Response.json(
        {
          error: { code: "version_conflict", message: "raw database secret" },
        },
        { status: 409 },
      ),
    );
    const client = new WorkspaceClient({ fetch });
    await expect(
      client.send(client.prepare("/api/v1/companies/x", "PATCH", {})),
    ).rejects.toMatchObject({ code: "version_conflict", unknown: false });
  });
  it("500 does not trigger GET retry", async () => {
    const fetch = vi.fn().mockResolvedValue(Response.json({}, { status: 500 }));
    await expect(
      new WorkspaceClient({ fetch }).get("/api/v1/board"),
    ).rejects.toBeInstanceOf(ClientFailure);
    expect(fetch).toHaveBeenCalledOnce();
  });
  it("aborts a pending write at the browser deadline", async () => {
    const fetch = vi.fn(
      (_url, init) =>
        new Promise<Response>((_resolve, reject) => {
          init?.signal?.addEventListener(
            "abort",
            () => reject(new Error("abort")),
            { once: true },
          );
        }),
    );
    const client = new WorkspaceClient({
      fetch: fetch as typeof globalThis.fetch,
      timeoutMs: 20,
    });
    await expect(
      client.send(client.prepare("/api/v1/companies", "POST", {})),
    ).rejects.toMatchObject({ unknown: true });
    expect(fetch).toHaveBeenCalledOnce();
  });
  it("refuses external URLs before any fetch", async () => {
    const fetch = vi.fn();
    const client = new WorkspaceClient({ fetch });
    await expect(
      client.get("https://other.test/api/v1/board"),
    ).rejects.toMatchObject({ code: "invalid_input" });
    expect(fetch).not.toHaveBeenCalled();
  });
});
