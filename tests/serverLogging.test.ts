import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const state = vi.hoisted(() => ({ runtime: null as unknown }));
vi.mock("../src/lib/server/workspace/runtime", () => ({
  getWorkspaceRuntime: () => state.runtime,
}));

import { POST as ocrPost } from "../app/api/ocr/route";
import {
  describeError,
  logServerEvent,
  withLogContext,
} from "../src/lib/server/log";
import {
  createOpenAiClient,
  OpenAiRequestError,
} from "../src/lib/server/openaiClient";
import { runOcr } from "../src/lib/server/ocr";
import { createWorkspaceHandler } from "../src/lib/server/workspace/http";
import { sqlProblem, WorkspaceError } from "../src/lib/server/workspace/errors";

type LogLine = Record<string, unknown>;
let lines: LogLine[] = [];
let raw: string[] = [];

function capture(...args: unknown[]) {
  for (const arg of args) {
    const text = typeof arg === "string" ? arg : JSON.stringify(arg);
    raw.push(text);
    try {
      const parsed = JSON.parse(text);
      if (parsed && typeof parsed === "object") lines.push(parsed);
    } catch {
      /* 非JSON行は raw だけに残す */
    }
  }
}

beforeEach(() => {
  lines = [];
  raw = [];
  vi.spyOn(console, "info").mockImplementation(capture);
  vi.spyOn(console, "warn").mockImplementation(capture);
  vi.spyOn(console, "error").mockImplementation(capture);
});
afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

const fakeRuntime = (overrides: Record<string, unknown> = {}) => ({
  auth: {
    options: { origin: "http://localhost" },
    authenticate: async () => ({
      ok: true,
      value: { userId: "owner", sessionHash: "hash" },
    }),
  },
  issueGenerationReceipt: () => "receipt",
  ...overrides,
});

describe("describeError", () => {
  it("keeps name, message, code and the cause chain", () => {
    const pgError = Object.assign(
      new Error("terminating connection due to administrator command"),
      { code: "57P01" },
    );
    const fields = describeError(
      new WorkspaceError("unavailable", undefined, "db_query_failed", {
        cause: pgError,
      }),
    );
    expect(fields).toMatchObject({
      errorName: "WorkspaceError",
      errorCode: "unavailable",
      reason: "db_query_failed",
      causeName: "Error",
      causeCode: "57P01",
      causeMessage: "terminating connection due to administrator command",
    });
    expect(typeof fields.errorStack).toBe("string");
  });

  it("redacts secrets and omits messages that may echo request bodies", () => {
    const secret = describeError(
      new Error(
        "failed with sk-proj-abcdefghijklmnop and Bearer abc.def.ghi at postgres://user:pass@host/db",
      ),
    );
    expect(JSON.stringify(secret)).not.toMatch(
      /sk-proj-abcdefghijklmnop|abc\.def\.ghi|user:pass/,
    );
    const syntax = describeError(
      new SyntaxError('Unexpected token, "私の個人メモ" is not valid JSON'),
    );
    expect(JSON.stringify(syntax)).not.toContain("私の個人メモ");
    expect(syntax.errorName).toBe("SyntaxError");
  });

  it("describes non-Error throwables", () => {
    expect(describeError("boom")).toMatchObject({
      errorName: "NonError",
      errorMessage: "boom",
    });
  });
});

describe("logServerEvent context", () => {
  it("attaches request context fields to every line", () => {
    withLogContext({ requestId: "req-1", route: "/api/ocr" }, () => {
      logServerEvent("error", "test.event", { code: "x" });
    });
    expect(lines).toContainEqual(
      expect.objectContaining({
        event: "test.event",
        requestId: "req-1",
        route: "/api/ocr",
        code: "x",
      }),
    );
  });
});

describe("OpenAI error details", () => {
  it("keeps the upstream error code, type and request id", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        Response.json(
          {
            error: {
              message: "Incorrect API key provided: sk-proj-****abcd.",
              type: "invalid_request_error",
              code: "invalid_api_key",
            },
          },
          { status: 401, headers: { "x-request-id": "req_upstream_1" } },
        ),
      ),
    );
    const client = createOpenAiClient({ OPENAI_API_KEY: "dummy-key" });
    const error = await client.createResponse({}).catch((e: unknown) => e);
    expect(error).toBeInstanceOf(OpenAiRequestError);
    expect(describeError(error)).toMatchObject({
      upstreamStatus: 401,
      upstreamCode: "invalid_api_key",
      upstreamType: "invalid_request_error",
      upstreamRequestId: "req_upstream_1",
    });
  });

  it("explains why OCR output was empty", async () => {
    const error = await runOcr(
      { bytes: new Uint8Array([1]), mimeType: "image/png" },
      {
        env: { OCR_PROVIDER: "openai", OPENAI_API_KEY: "dummy-key" },
        client: {
          createResponse: async () => ({
            status: "incomplete",
            incomplete_details: { reason: "max_output_tokens" },
            output: [],
          }),
        },
      },
    ).catch((e: unknown) => e);
    expect(describeError(error)).toMatchObject({
      errorName: "OcrEmptyOutputError",
      responseStatus: "incomplete",
      incompleteReason: "max_output_tokens",
    });
  });
});

describe("POST /api/ocr failure logging", () => {
  it("logs the upstream reason with the same request id as the response", async () => {
    state.runtime = fakeRuntime();
    vi.stubEnv("OCR_PROVIDER", "openai");
    vi.stubEnv("OPENAI_API_KEY", "dummy-key-should-not-be-logged");
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        Response.json(
          { error: { type: "insufficient_quota", code: "insufficient_quota" } },
          { status: 429 },
        ),
      ),
    );
    const form = new FormData();
    form.append("file", new File(["x"], "memo.png", { type: "image/png" }));
    const response = await ocrPost(
      new Request("http://localhost/api/ocr", {
        method: "POST",
        headers: { Origin: "http://localhost" },
        body: form,
      }),
    );
    const requestId = response.headers.get("X-Request-Id");
    expect(response.status).toBe(429);
    expect(requestId).toBeTruthy();
    expect(lines).toContainEqual(
      expect.objectContaining({
        level: "error",
        event: "ocr.failed",
        requestId,
        code: "rate_limited",
        upstreamStatus: 429,
        upstreamCode: "insufficient_quota",
      }),
    );
    expect(lines).toContainEqual(
      expect.objectContaining({
        event: "generation.request",
        requestId,
        status: 429,
      }),
    );
    expect(raw.join("\n")).not.toContain("dummy-key-should-not-be-logged");
  });

  it("logs which input check rejected the upload", async () => {
    state.runtime = fakeRuntime();
    const form = new FormData();
    form.append("file", new File(["x"], "memo.gif", { type: "image/gif" }));
    const response = await ocrPost(
      new Request("http://localhost/api/ocr", {
        method: "POST",
        headers: { Origin: "http://localhost" },
        body: form,
      }),
    );
    expect(response.status).toBe(400);
    expect(lines).toContainEqual(
      expect.objectContaining({
        event: "ocr.failed",
        code: "invalid_input",
        reason: "unsupported_format",
      }),
    );
  });

  it("logs why the request guard rejected the call", async () => {
    state.runtime = fakeRuntime({
      auth: {
        options: { origin: "http://localhost" },
        authenticate: async () => {
          throw new Error("supabase fetch failed");
        },
      },
    });
    const response = await ocrPost(
      new Request("http://localhost/api/ocr", {
        method: "POST",
        headers: { Origin: "http://localhost" },
        body: new FormData(),
      }),
    );
    const requestId = response.headers.get("X-Request-Id");
    expect(response.status).toBe(500);
    expect(lines).toContainEqual(
      expect.objectContaining({
        level: "error",
        requestId,
        errorMessage: "supabase fetch failed",
      }),
    );
  });
});

describe("workspace API failure logging", () => {
  it("logs the original error under the requestId returned to the client", async () => {
    const handler = createWorkspaceHandler(
      () =>
        fakeRuntime({
          service: {
            board: async () => {
              throw new Error("connection terminated unexpectedly");
            },
          },
        }) as never,
    );
    const response = await handler(
      new Request("http://localhost/api/v1/board", { method: "GET" }),
    );
    const body = await response.json();
    expect(response.status).toBe(500);
    expect(body.error.requestId).toBeTruthy();
    expect(response.headers.get("X-Request-Id")).toBe(body.error.requestId);
    expect(lines).toContainEqual(
      expect.objectContaining({
        level: "error",
        event: "workspace.error",
        requestId: body.error.requestId,
        errorMessage: "connection terminated unexpectedly",
      }),
    );
    expect(lines).toContainEqual(
      expect.objectContaining({
        event: "workspace.request",
        requestId: body.error.requestId,
        method: "GET",
        route: "/api/v1/board",
        status: 500,
      }),
    );
  });

  it("logs only the SQL error code when mapping to unavailable", () => {
    const mapped = sqlProblem(
      Object.assign(new Error("deadlock detected"), { code: "40P01" }),
    );
    expect(mapped.code).toBe("unavailable");
    expect(lines).toContainEqual(
      expect.objectContaining({
        event: "workspace.db_failed",
        reason: "db:40P01",
      }),
    );
    // DB のエラー本文は資格情報を含みうるので記録しない（#104 の方針）
    expect(raw.join(" ")).not.toContain("deadlock detected");
  });
});
