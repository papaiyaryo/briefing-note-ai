import type { ApiErrorCode } from "../openai/contracts";
import { getWebSupplementProvider } from "../openai/provider";
import { buildDummyWebSupplement } from "../webSupplement/dummy";
import {
  webSupplementJsonSchema,
  type WebSupplementResult,
} from "../webSupplement/schema";
import { validateWebSupplementResult } from "../webSupplement/validate";
import {
  createOpenAiClient,
  getOpenAiTimeoutMs,
  type OpenAiResponsesClient,
} from "./openaiClient";

export class WebSupplementError extends Error {
  constructor(readonly code: ApiErrorCode) {
    super(code);
    this.name = "WebSupplementError";
  }
}

interface WebSupplementEnv {
  OPENAI_API_KEY?: string;
  OPENAI_WEB_SUPPLEMENT_MODEL?: string;
  WEB_SUPPLEMENT_ENABLED?: string;
  WEB_SUPPLEMENT_PROVIDER?: string;
  OPENAI_TIMEOUT_MS?: string;
  [key: string]: string | undefined;
}

interface RunWebSupplementOptions {
  env?: WebSupplementEnv;
  client?: OpenAiResponsesClient;
}

export function isWebSupplementEnabled(env: WebSupplementEnv = process.env) {
  return env.WEB_SUPPLEMENT_ENABLED === "true";
}

export function extractWebSupplementResponseText(response: unknown): string {
  if (!response || typeof response !== "object") return "";
  const record = response as Record<string, unknown>;

  if (typeof record.output_text === "string") {
    return record.output_text.trim();
  }

  if (!Array.isArray(record.output)) return "";

  const parts: string[] = [];
  for (const item of record.output) {
    if (!item || typeof item !== "object") continue;
    const content = (item as Record<string, unknown>).content;
    if (!Array.isArray(content)) continue;
    for (const block of content) {
      if (!block || typeof block !== "object") continue;
      const text = (block as Record<string, unknown>).text;
      if (typeof text === "string") parts.push(text);
    }
  }

  return parts.join("").trim();
}

function parseWebSupplementJson(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    throw new WebSupplementError("validation_failed");
  }
}

async function runOpenAiWebSupplement(
  companyName: string,
  env: WebSupplementEnv,
  client = createOpenAiClient(env),
): Promise<WebSupplementResult> {
  if (!env.OPENAI_WEB_SUPPLEMENT_MODEL) {
    throw new WebSupplementError("not_configured");
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), getOpenAiTimeoutMs(env));
  const retrievedAt = new Date().toISOString().slice(0, 10);

  try {
    const response = await client.createResponse(
      {
        model: env.OPENAI_WEB_SUPPLEMENT_MODEL,
        tools: [{ type: "web_search" }],
        input: [
          {
            role: "system",
            content:
              "企業の公式サイトや採用サイトを優先して、出典 URL 付きの補足候補だけを JSON で返す。紙メモ由来情報や個人の印象とは混ぜない。不確実情報、非公式情報、信頼度 medium/low は必ず needsVerification を true にする。企業が特定できない場合は items を空配列にする。retrievedAt は YYYY-MM-DD 形式で返す。",
          },
          {
            role: "user",
            content: JSON.stringify({ companyName, retrievedAt }),
          },
        ],
        text: {
          format: {
            type: "json_schema",
            name: "web_supplement_result",
            strict: true,
            schema: webSupplementJsonSchema,
          },
        },
      },
      controller.signal,
    );

    const text = extractWebSupplementResponseText(response);
    if (!text) throw new WebSupplementError("validation_failed");
    const parsed = validateWebSupplementResult(parseWebSupplementJson(text));
    if (!parsed.ok) throw new WebSupplementError(parsed.code);
    if (parsed.result.items.length === 0) {
      throw new WebSupplementError("company_not_found");
    }
    return parsed.result;
  } finally {
    clearTimeout(timer);
  }
}

export async function runWebSupplement(
  companyName: string,
  options: RunWebSupplementOptions = {},
): Promise<WebSupplementResult> {
  const env = options.env ?? process.env;

  if (!isWebSupplementEnabled(env)) {
    throw new WebSupplementError("not_configured");
  }

  if (getWebSupplementProvider(env as WebSupplementEnv) === "dummy") {
    return buildDummyWebSupplement(companyName);
  }
  return runOpenAiWebSupplement(companyName, env, options.client);
}
