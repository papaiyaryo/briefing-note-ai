import type { LoggableError, SafeLogFields } from "./log";

interface OpenAiClientEnv {
  OPENAI_API_KEY?: string;
  [key: string]: string | undefined;
}

export interface OpenAiResponsesClient {
  createResponse(body: unknown, signal?: AbortSignal): Promise<unknown>;
}

export interface OpenAiErrorDetails {
  /** OpenAI の error.code（例: invalid_api_key, insufficient_quota, model_not_found） */
  code?: string;
  /** OpenAI の error.type（例: invalid_request_error） */
  type?: string;
  /** OpenAI の error.param（どの入力項目が原因か） */
  param?: string;
  /** OpenAI の error.message。ログ出力時に秘密情報は伏せる。 */
  message?: string;
  /** OpenAI 側のリクエストID（x-request-id）。問い合わせ時の照合に使う。 */
  requestId?: string;
}

/**
 * OpenAI へのリクエストが失敗したことを表すエラー。
 * 原因調査のため、HTTP ステータスと OpenAI のエラー分類（code/type/param/message）を保持する。
 * 利用者の入力や生成本文は保持しない。
 */
export class OpenAiRequestError extends Error implements LoggableError {
  readonly status: number;
  readonly details: OpenAiErrorDetails;

  constructor(status: number, details: OpenAiErrorDetails = {}) {
    super(`OpenAI API request failed with ${status}`);
    this.name = "OpenAiRequestError";
    this.status = status;
    this.details = details;
  }

  toLogFields(): SafeLogFields {
    return {
      upstreamStatus: this.status,
      upstreamCode: this.details.code,
      upstreamType: this.details.type,
      upstreamParam: this.details.param,
      upstreamMessage: this.details.message,
      upstreamRequestId: this.details.requestId,
    };
  }
}

const asString = (value: unknown) =>
  typeof value === "string" && value ? value : undefined;

async function readErrorDetails(
  response: Response,
): Promise<OpenAiErrorDetails> {
  const details: OpenAiErrorDetails = {
    requestId: response.headers.get("x-request-id") ?? undefined,
  };
  try {
    const body = (await response.json()) as { error?: Record<string, unknown> };
    const error = body?.error;
    if (error && typeof error === "object") {
      details.code = asString(error.code);
      details.type = asString(error.type);
      details.param = asString(error.param);
      details.message = asString(error.message);
    }
  } catch {
    /* 本文が JSON でない場合はステータスとリクエストIDだけで判断する */
  }
  return details;
}

export const DEFAULT_OPENAI_TIMEOUT_MS = 30_000;

export function getOpenAiTimeoutMs(env: OpenAiClientEnv = process.env): number {
  const value = Number(env.OPENAI_TIMEOUT_MS);
  return Number.isFinite(value) && value > 0
    ? Math.min(value, DEFAULT_OPENAI_TIMEOUT_MS)
    : DEFAULT_OPENAI_TIMEOUT_MS;
}

export function createOpenAiClient(
  env: OpenAiClientEnv = process.env,
): OpenAiResponsesClient {
  const apiKey = env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is not configured");
  }

  return {
    async createResponse(body: unknown, signal?: AbortSignal) {
      const response = await fetch("https://api.openai.com/v1/responses", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
        signal,
      });

      if (!response.ok) {
        throw new OpenAiRequestError(
          response.status,
          await readErrorDetails(response),
        );
      }

      return response.json();
    },
  };
}
