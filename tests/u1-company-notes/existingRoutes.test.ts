import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { runtimeFixture } from "./runtimeFixture";
import { emptyStructure, id } from "./fixtures";
import "./providerRegressionCases";
const state = vi.hoisted(() => ({ runtime: null as unknown }));
vi.mock("../../src/lib/server/workspace/runtime", () => ({
  getWorkspaceRuntime: () => state.runtime,
}));
const routes = {
  ocr: () => import("../../app/api/ocr/route"),
  structure: () => import("../../app/api/structure/route"),
  "web-supplement": () => import("../../app/api/web-supplement/route"),
  "interview-review": () => import("../../app/api/interview-review/route"),
};
describe("existing provider routes retain public health and protect private work", () => {
  let f: Awaited<ReturnType<typeof runtimeFixture>>;
  beforeAll(async () => {
    f = await runtimeFixture();
    state.runtime = f;
  });
  afterAll(async () => {
    await f?.close();
  });
  it.each(Object.keys(routes) as (keyof typeof routes)[])(
    "%s requires verified Cookie",
    async (name) => {
      const route = await routes[name]();
      const r = await route.POST(
        new Request(`http://localhost/api/${name}`, {
          method: "POST",
          headers: { Origin: "http://localhost" },
        }),
      );
      expect(r.status).toBe(401);
      expect(r.headers.get("cache-control")).toBe("private, no-store");
    },
  );
  it.each(Object.keys(routes) as (keyof typeof routes)[])(
    "%s rejects foreign Origin before provider",
    async (name) => {
      const route = await routes[name]();
      const r = await route.POST(
        new Request(`http://localhost/api/${name}`, {
          method: "POST",
          headers: { Origin: "https://other.test", Cookie: f.cookie },
        }),
      );
      expect(r.status).toBe(403);
    },
  );
  it("structure keeps current not_configured=500", async () => {
    vi.stubEnv("STRUCTURE_PROVIDER", "openai");
    vi.stubEnv("OPENAI_API_KEY", "");
    const route = await import("../../app/api/structure/route");
    const r = await route.POST(
      new Request("http://localhost/api/structure", {
        method: "POST",
        headers: {
          Origin: "http://localhost",
          Cookie: f.cookie,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ocrText: "架空の説明",
          companyEventInfo: {
            companyName: "架空",
            eventName: "説明会",
            eventDate: "",
          },
        }),
      }),
    );
    expect(r.status).toBe(500);
    expect((await r.json()).error.code).toBe("not_configured");
    vi.unstubAllEnvs();
  });
  it("health remains public without owner or configuration", async () => {
    const { GET } = await import("../../app/api/health/route");
    const body = await (await GET()).json();
    expect(body).toMatchObject({ status: "ok", service: "briefing-note-ai" });
    expect(body).not.toHaveProperty("userId");
  });
  it("authenticated dummy structure and review retain their existing contracts", async () => {
    vi.stubEnv("STRUCTURE_PROVIDER", "dummy");
    vi.stubEnv("INTERVIEW_REVIEW_PROVIDER", "dummy");
    try {
      const input = {
        ocrText: "架空の説明会事実",
        companyEventInfo: {
          companyName: "架空",
          eventName: "説明会",
          eventDate: "",
        },
      };
      const request = (path: string, body: unknown) =>
        new Request(`http://localhost/api/${path}`, {
          method: "POST",
          headers: {
            Cookie: f.cookie,
            Origin: "http://localhost",
            "Content-Type": "application/json",
          },
          body: JSON.stringify(body),
        });
      const structure = await (
        await routes.structure()
      ).POST(request("structure", input));
      expect(structure.status).toBe(200);
      expect((await structure.json()).provider).toBe("dummy");
      const review = await (
        await routes["interview-review"]()
      ).POST(request("interview-review", { memo: emptyStructure() }));
      expect(review.status).toBe(200);
      expect((await review.json()).provider).toBe("dummy");
    } finally {
      vi.unstubAllEnvs();
    }
  });
  it("actual App Router exports preserve the shared authenticated HTTP boundary", async () => {
    const companyId = id(),
      memoId = id();
    const entries = [
      [() => import("../../app/api/v1/board/route"), "GET", "board", 200],
      [
        () => import("../../app/api/v1/companies/route"),
        "POST",
        "companies",
        400,
      ],
      [
        () => import("../../app/api/v1/companies/[companyId]/route"),
        "GET",
        `companies/${companyId}`,
        404,
      ],
      [
        () => import("../../app/api/v1/companies/[companyId]/memos/route"),
        "GET",
        `companies/${companyId}/memos`,
        404,
      ],
      [
        () =>
          import("../../app/api/v1/companies/[companyId]/memos/[memoId]/route"),
        "GET",
        `companies/${companyId}/memos/${memoId}`,
        404,
      ],
      [
        () => import("../../app/api/v1/deletion-confirmations/route"),
        "POST",
        "deletion-confirmations",
        400,
      ],
      [
        () => import("../../app/api/v1/deletions/route"),
        "POST",
        "deletions",
        400,
      ],
      [
        () => import("../../app/api/v1/operations/[operationId]/route"),
        "GET",
        `operations/${id()}`,
        200,
      ],
      [
        () => import("../../app/api/v1/comparison-sources/route"),
        "POST",
        "comparison-sources",
        400,
      ],
      [
        () => import("../../app/api/v1/auth/session/route"),
        "GET",
        "auth/session",
        200,
      ],
      [
        () => import("../../app/api/v1/auth/login/route"),
        "POST",
        "auth/login",
        400,
      ],
    ] as const;
    for (const [load, method, path, status] of entries) {
      const routeExports = await load();
      const handler = (
        routeExports as unknown as Record<
          string,
          (request: Request) => Promise<Response>
        >
      )[method];
      const response = await handler(
        new Request(`http://localhost/api/v1/${path}`, {
          method,
          headers: {
            Cookie: f.cookie,
            Origin: "http://localhost",
            "Content-Type": "application/json",
          },
          ...(method === "POST" ? { body: "{}" } : {}),
        }),
      );
      expect(response.status, path).toBe(status);
      expect(response.headers.get("cache-control")).toBe("private, no-store");
    }
    const { POST } = await import("../../app/api/v1/auth/logout/route");
    const response = await POST(
      new Request("http://localhost/api/v1/auth/logout", {
        method: "POST",
        headers: {
          Cookie: f.cookie,
          Origin: "http://localhost",
          "Content-Type": "application/json",
        },
        body: "{}",
      }),
    );
    expect(response.status).toBe(200);
  });
});
