interface OpenAiClientEnv {
  OPENAI_API_KEY?: string;
  [key: string]: string | undefined;
}

export interface OpenAiResponsesClient {
  createResponse(body: unknown): Promise<unknown>;
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

export function createOpenAiClient(
  env: OpenAiClientEnv = process.env,
): OpenAiResponsesClient {
  const apiKey = env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is not configured");
  }

  return {
    async createResponse(body: unknown) {
      const response = await fetch("https://api.openai.com/v1/responses", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        throw new OpenAiRequestError(response.status);
      }

      return response.json();
    },
  };
}
