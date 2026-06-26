import type { ApiErrorBody, ApiErrorCode } from "../openai/contracts";
import { getSafeErrorMessage } from "../errorMessages";
import { OpenAiRequestError } from "./openaiClient";

const HTTP_STATUS_BY_CODE: Record<ApiErrorCode, number> = {
  invalid_input: 400,
  payload_too_large: 413,
  not_configured: 503,
  rate_limited: 429,
  timeout: 504,
  provider_error: 502,
  validation_failed: 422,
};

export class ApiError extends Error {
  constructor(
    readonly code: ApiErrorCode,
    readonly httpStatus = HTTP_STATUS_BY_CODE[code],
    readonly safeMessage = getSafeErrorMessage(code),
  ) {
    super(code);
    this.name = "ApiError";
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

  if (error instanceof OpenAiRequestError || hasStatus(error)) {
    const status = error.status;
    if (status === 429) {
      return new ApiError("rate_limited");
    }
  }

  const text = errorText(error);
  if (
    text.includes("aborterror") ||
    text.includes("timeout") ||
    text.includes("timed out")
  ) {
    return new ApiError("timeout");
  }

  if (text.includes("rate limit") || text.includes("too many requests")) {
    return new ApiError("rate_limited");
  }

  return new ApiError("provider_error");
}

export function errorResponse(error: ApiError): Response {
  const body: ApiErrorBody = {
    error: { code: error.code, message: error.safeMessage },
  };
  return Response.json(body, { status: error.httpStatus });
}
