interface OpenAiClientEnv {
  OPENAI_API_KEY?: string;
  [key: string]: string | undefined;
}

export interface OpenAiResponsesClient {
  createResponse(body: unknown, signal?: AbortSignal): Promise<unknown>;
}

/**
 * OpenAI へのリクエストが失敗したことを表すエラー。
 * 呼び出し側で分類・ログできるよう HTTP ステータスのみを保持する。
 * レスポンス本文は機微情報を含みうるため保持しない。
 */
export class OpenAiRequestError extends Error {
  readonly status: number;

  constructor(status: number) {
    super(`OpenAI API request failed with ${status}`);
    this.name = "OpenAiRequestError";
    this.status = status;
  }
}

export const DEFAULT_OPENAI_TIMEOUT_MS = 30_000;

export function getOpenAiTimeoutMs(env: OpenAiClientEnv = process.env): number {
  const value = Number(env.OPENAI_TIMEOUT_MS);
  return Number.isFinite(value) && value > 0
    ? value
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
        throw new OpenAiRequestError(response.status);
      }

      return response.json();
    },
  };
}
