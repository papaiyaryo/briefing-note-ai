import { runDummyOcr } from "../dummyOcr";
import { getOcrProvider } from "../openai/provider";
import type { LlmProvider } from "../openai/contracts";
import type { OcrResult } from "../types";
import {
  createOpenAiClient,
  getOpenAiTimeoutMs,
  type OpenAiResponsesClient,
} from "./openaiClient";

export interface OcrInput {
  bytes: Uint8Array;
  mimeType: string;
}

interface OcrEnv {
  OPENAI_API_KEY?: string;
  OCR_PROVIDER?: string;
  OPENAI_OCR_MODEL?: string;
  [key: string]: string | undefined;
}

interface RunOcrOptions {
  env?: OcrEnv;
  client?: OpenAiResponsesClient;
}

const DEFAULT_OPENAI_OCR_MODEL = "gpt-4.1-mini";

const OCR_PROMPT = [
  "手書きの日本語の会社説明会メモを、そのまま文字起こししてください。",
  "解釈・要約・補完・企業情報の推測はしないでください。",
  "読めない箇所は [判読不可] と書いてください。",
  "出力は文字起こし本文のみとし、Markdown の見出しや説明文は追加しないでください。",
].join("\n");

function toDataUrl(input: OcrInput): string {
  const base64 = Buffer.from(input.bytes).toString("base64");
  return `data:${input.mimeType};base64,${base64}`;
}

function extractOutputText(response: unknown): string {
  if (!response || typeof response !== "object") {
    return "";
  }

  const record = response as Record<string, unknown>;

  // SDK 互換: 直下に output_text があればそれを使う
  if (typeof record.output_text === "string") {
    return record.output_text.trim();
  }

  // 生の Responses API: output[].content[].text を連結する
  if (!Array.isArray(record.output)) {
    return "";
  }

  const parts: string[] = [];
  for (const item of record.output) {
    if (!item || typeof item !== "object") continue;
    const content = (item as Record<string, unknown>).content;
    if (!Array.isArray(content)) continue;
    for (const block of content) {
      if (!block || typeof block !== "object") continue;
      const text = (block as Record<string, unknown>).text;
      if (typeof text === "string") {
        parts.push(text);
      }
    }
  }

  return parts.join("").trim();
}

async function runOpenAiOcr(
  input: OcrInput,
  env: OcrEnv,
  client = createOpenAiClient(env),
): Promise<OcrResult> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), getOpenAiTimeoutMs(env));

  try {
    const response = await client.createResponse(
      {
        model: env.OPENAI_OCR_MODEL || DEFAULT_OPENAI_OCR_MODEL,
        input: [
          {
            role: "user",
            content: [
              { type: "input_text", text: OCR_PROMPT },
              {
                type: "input_image",
                image_url: toDataUrl(input),
                detail: "high",
              },
            ],
          },
        ],
      },
      controller.signal,
    );

    const text = extractOutputText(response);
    if (!text) {
      throw new Error("OpenAI OCR response did not include output text");
    }

    return { text };
  } finally {
    clearTimeout(timer);
  }
}

export function resolveOcrProvider(env: OcrEnv = process.env): LlmProvider {
  return getOcrProvider(env);
}

export async function runOcr(
  input: OcrInput,
  options: RunOcrOptions = {},
): Promise<OcrResult> {
  const env = options.env ?? process.env;
  const provider = resolveOcrProvider(env);

  if (provider === "dummy") {
    const result = runDummyOcr("success");
    return { text: result.status === "success" ? result.text : "" };
  }

  return runOpenAiOcr(input, env, options.client);
}
