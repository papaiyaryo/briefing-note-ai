interface OpenAiClientEnv {
  OPENAI_API_KEY?: string;
  [key: string]: string | undefined;
}

export interface OpenAiResponsesClient {
  createResponse(body: unknown): Promise<unknown>;
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
        throw new Error(`OpenAI API request failed with ${response.status}`);
      }

      return response.json();
    },
  };
}
