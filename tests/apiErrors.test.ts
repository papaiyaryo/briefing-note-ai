import { describe, expect, it, vi } from "vitest";

import { ERROR_MESSAGES } from "../src/lib/errorMessages";
import type { ApiErrorCode } from "../src/lib/openai/contracts";
import { ApiError, errorResponse, toApiError } from "../src/lib/server/errors";
import { logApiEvent } from "../src/lib/server/logger";
import { OpenAiRequestError } from "../src/lib/server/openaiClient";

const codes: ApiErrorCode[] = [
  "invalid_input",
  "payload_too_large",
  "not_configured",
  "rate_limited",
  "timeout",
  "provider_error",
  "validation_failed",
];

describe("API error handling", () => {
  it("maps provider rate limits to a stable code", () => {
    const error = toApiError(new OpenAiRequestError(429));

    expect(error.code).toBe("rate_limited");
    expect(error.httpStatus).toBe(429);
  });

  it("maps abort and timeout errors to timeout", () => {
    expect(toApiError(new DOMException("aborted", "AbortError")).code).toBe(
      "timeout",
    );
    expect(toApiError(new Error("request timeout")).code).toBe("timeout");
  });

  it("maps unknown provider failures to provider_error", () => {
    const error = toApiError(new Error("upstream failed"));

    expect(error.code).toBe("provider_error");
    expect(error.httpStatus).toBe(502);
  });

  it("returns the stable response shape and status", async () => {
    const response = errorResponse(new ApiError("invalid_input"));

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: {
        code: "invalid_input",
        message: ERROR_MESSAGES.invalid_input,
      },
    });
  });

  it("defines safe client-facing messages for all codes", () => {
    for (const code of codes) {
      expect(ERROR_MESSAGES[code]).toBeTruthy();
      expect(ERROR_MESSAGES[code]).not.toMatch(
        /api[_-]?key|secret|stack|openai api request failed/i,
      );
    }
  });

  it("logs only minimal API metadata", () => {
    const spy = vi.spyOn(console, "info").mockImplementation(() => undefined);

    logApiEvent({
      stage: "ocr",
      code: "ok",
      durationMs: 12.4,
      provider: "dummy",
    });

    expect(spy).toHaveBeenCalledWith(
      JSON.stringify({
        event: "api.request",
        stage: "ocr",
        code: "ok",
        durationMs: 12,
        provider: "dummy",
      }),
    );
    spy.mockRestore();
  });
});
