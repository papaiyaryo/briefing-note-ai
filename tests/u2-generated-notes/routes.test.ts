import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  issueGenerationReceipt,
  verifyGenerationReceipt,
} from "../../src/lib/server/workspace/generationReceipt";
import * as structure from "../../src/lib/server/structure";
import { OpenAiRequestError } from "../../src/lib/server/openaiClient";
import { candidate, owner, operationId } from "./fixtures";
const state = vi.hoisted(() => ({ runtime: null as unknown }));
vi.mock("../../src/lib/server/workspace/runtime", () => ({
  getWorkspaceRuntime: () => state.runtime,
}));
import { POST as structurePost } from "../../app/api/structure/route";
import { POST as ocrPost } from "../../app/api/ocr/route";
import { POST as webPost } from "../../app/api/web-supplement/route";
import { POST as reviewPost } from "../../app/api/interview-review/route";
const keys = { active: "test", keys: { test: Buffer.alloc(32, 2) } };
const authenticate = vi.fn();
const issue = vi.fn((userId: string, provider: "dummy" | "openai") =>
  issueGenerationReceipt(userId, provider, keys),
);
function request(
  path = "structure",
  body: unknown = { ocrText: "架空OCR", companyEventInfo: candidate().event },
  headers: HeadersInit = {},
  signal?: AbortSignal,
) {
  return new Request(`http://localhost/api/${path}`, {
    method: "POST",
    headers: {
      Origin: "http://localhost",
      "Content-Type": "application/json",
      ...headers,
    },
    body: JSON.stringify(body),
    signal,
  });
}
beforeEach(() => {
  authenticate
    .mockReset()
    .mockResolvedValue({
      ok: true,
      value: { userId: owner, sessionHash: "fake-session" },
    });
  issue.mockClear();
  state.runtime = {
    auth: { options: { origin: "http://localhost" }, authenticate },
    issueGenerationReceipt: issue,
  };
  vi.stubEnv("STRUCTURE_PROVIDER", "dummy");
  vi.stubEnv("OCR_PROVIDER", "dummy");
  vi.stubEnv("WEB_SUPPLEMENT_PROVIDER", "dummy");
  vi.stubEnv("INTERVIEW_REVIEW_PROVIDER", "dummy");
  vi.stubEnv("WEB_SUPPLEMENT_ENABLED", "true");
  vi.stubGlobal(
    "fetch",
    vi.fn(() => {
      throw new Error("Unexpected external request");
    }),
  );
});
afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});
describe("U2 API boundary / AC1.1 AC5.1 SD1 SD2", () => {
  const entries = [
    { name: "structure", post: structurePost },
    { name: "ocr", post: ocrPost },
    { name: "web-supplement", post: webPost },
    { name: "interview-review", post: reviewPost },
  ];
  it.each(entries)(
    "$name rejects unauthenticated before provider",
    async ({ name, post }) => {
      authenticate.mockResolvedValue({
        ok: false,
        problem: {
          error: {
            code: "unauthenticated",
            message: "本人確認",
            requestId: operationId,
          },
        },
      });
      const response = await post(request(name));
      expect(response.status).toBe(401);
      expect(response.headers.get("cache-control")).toBe("private, no-store");
      expect(fetch).not.toHaveBeenCalled();
      expect(issue).not.toHaveBeenCalled();
    },
  );
  it.each(entries)(
    "$name rejects foreign Origin before auth/provider",
    async ({ name, post }) => {
      const response = await post(
        request(name, {}, { Origin: "https://other.test" }),
      );
      expect(response.status).toBe(403);
      expect(authenticate).not.toHaveBeenCalled();
      expect(fetch).not.toHaveBeenCalled();
    },
  );
  it("issues dummy receipt only after complete structure validation", async () => {
    const response = await structurePost(request());
    const body = await response.json();
    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe("private, no-store");
    expect(body.memo).toHaveProperty("facts");
    expect(body.provider).toBe("dummy");
    expect(
      verifyGenerationReceipt(body.generationReceipt, owner, "dummy", keys)
        .userId,
    ).toBe(owner);
    expect(issue).toHaveBeenCalledOnce();
  });
  it("does not issue for malformed validated-provider output", async () => {
    vi.spyOn(structure, "runStructure").mockResolvedValue({} as never);
    const response = await structurePost(request());
    expect(response.status).toBe(422);
    expect((await response.json()).error.code).toBe("validation_failed");
    expect(issue).not.toHaveBeenCalled();
  });
  it("keeps invalid_input400 without provider or issuance", async () => {
    const spy = vi.spyOn(structure, "runStructure");
    const response = await structurePost(request("structure", {}));
    expect(response.status).toBe(400);
    expect((await response.json()).error.code).toBe("invalid_input");
    expect(spy).not.toHaveBeenCalled();
    expect(issue).not.toHaveBeenCalled();
  });
  it("keeps structure not_configured500", async () => {
    vi.stubEnv("STRUCTURE_PROVIDER", "openai");
    vi.stubEnv("OPENAI_API_KEY", "");
    const response = await structurePost(request());
    expect(response.status).toBe(500);
    expect((await response.json()).error.code).toBe("not_configured");
    expect(issue).not.toHaveBeenCalled();
  });
  it.each([
    {
      error: new structure.StructureError("validation_failed"),
      status: 422,
      code: "validation_failed",
    },
    { error: new OpenAiRequestError(429), status: 429, code: "rate_limited" },
    {
      error: new Error("safe fixture failure"),
      status: 502,
      code: "provider_error",
    },
    {
      error: new DOMException("cancelled", "AbortError"),
      status: 502,
      code: "provider_error",
    },
  ])("preserves structure $code / $status", async ({ error, status, code }) => {
    vi.spyOn(structure, "runStructure").mockRejectedValue(error);
    const response = await structurePost(request());
    expect(response.status).toBe(status);
    expect((await response.json()).error.code).toBe(code);
    expect(issue).not.toHaveBeenCalled();
  });
  it("bounds an unresponsive server adapter at40sec and cancels it", async () => {
    vi.useFakeTimers();
    let signal: AbortSignal | undefined;
    vi.spyOn(structure, "runStructure").mockImplementation(
      async (_text, _event, options) => {
        signal = options?.signal;
        return new Promise(() => {});
      },
    );
    const pending = structurePost(request());
    await vi.advanceTimersByTimeAsync(40000);
    const response = await pending;
    expect(response.status).toBe(502);
    expect((await response.json()).error.code).toBe("provider_error");
    expect(signal?.aborted).toBe(true);
    expect(issue).not.toHaveBeenCalled();
    expect(vi.getTimerCount()).toBe(0);
  });
  it("does not log body, cookie or generated proof", async () => {
    const log = vi.spyOn(console, "info").mockImplementation(() => {});
    const response = await structurePost(
      request(
        "structure",
        { ocrText: "PRIVATE_TEST_OCR", companyEventInfo: candidate().event },
        { Cookie: "PRIVATE_TEST_COOKIE" },
      ),
    );
    const body = await response.json();
    const logs = JSON.stringify(log.mock.calls);
    expect(log).toHaveBeenCalled();
    expect(logs).not.toContain("PRIVATE_TEST_OCR");
    expect(logs).not.toContain("PRIVATE_TEST_COOKIE");
    expect(logs).not.toContain(body.generationReceipt);
    expect(logs).toContain("requestId");
  });
});
