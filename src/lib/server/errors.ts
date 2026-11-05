import type { ApiErrorBody, ApiErrorCode } from "../openai/contracts";
import { getSafeErrorMessage } from "../errorMessages";
import { OpenAiRequestError } from "./openaiClient";
import type { LoggableError, SafeLogFields } from "./log";

const HTTP_STATUS_BY_CODE: Record<ApiErrorCode, number> = {
  invalid_input: 400,
  payload_too_large: 413,
  not_configured: 503,
  rate_limited: 429,
  timeout: 504,
  provider_error: 502,
  validation_failed: 422,
  company_not_found: 404,
};

export interface ApiErrorOptions {
  /** 元の例外。ログで原因をたどるために保持する（利用者には返さない）。 */
  cause?: unknown;
  /** 入力検証などで拒否した具体的な理由（例: unsupported_format）。 */
  reason?: string;
}

export class ApiError extends Error implements LoggableError {
  readonly reason?: string;

  constructor(
    readonly code: ApiErrorCode,
    readonly httpStatus = HTTP_STATUS_BY_CODE[code],
    readonly safeMessage = getSafeErrorMessage(code),
    options: ApiErrorOptions = {},
  ) {
    super(
      code,
      options.cause === undefined ? undefined : { cause: options.cause },
    );
    this.name = "ApiError";
    this.reason = options.reason;
  }

  static rejected(code: ApiErrorCode, reason: string): ApiError {
    return new ApiError(code, undefined, undefined, { reason });
  }

  toLogFields(): SafeLogFields {
    return { reason: this.reason };
  }
}

function hasStatus(error: unknown): error is { status: number } {
  return (
    typeof error === "object" &&
    error !== null &&
    "status" in error &&
    typeof (error as { status?: unknown }).status === "number"
  );
}

function errorText(error: unknown): string {
  if (error instanceof Error) {
    return `${error.name} ${error.message}`.toLowerCase();
  }
  return String(error).toLowerCase();
}

export function toApiError(error: unknown): ApiError {
  if (error instanceof ApiError) {
    return error;
  }
  const wrap = (code: ApiErrorCode) =>
    new ApiError(code, undefined, undefined, { cause: error });

  if (error instanceof OpenAiRequestError || hasStatus(error)) {
    const status = error.status;
    if (status === 429) {
      return wrap("rate_limited");
    }
  }

  const text = errorText(error);
  if (
    text.includes("aborterror") ||
    text.includes("timeout") ||
    text.includes("timed out")
  ) {
    return wrap("timeout");
  }

  if (text.includes("rate limit") || text.includes("too many requests")) {
    return wrap("rate_limited");
  }

  return wrap("provider_error");
}

export function errorResponse(error: ApiError): Response {
  const body: ApiErrorBody = {
    error: { code: error.code, message: error.safeMessage },
  };
  return Response.json(body, { status: error.httpStatus });
}
