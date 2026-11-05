import { runDummyOcr } from "../dummyOcr";
import { getOcrProvider } from "../openai/provider";
import type { LlmProvider } from "../openai/contracts";
import type { OcrResult } from "../types";
import { requestProvider } from "./generation/request";
import type { LoggableError, SafeLogFields } from "./log";
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
  signal?: AbortSignal;
}

const DEFAULT_OPENAI_OCR_MODEL = "gpt-4.1-mini";

const OCR_PROMPT = [
  "手書きの日本語の会社説明会メモを、そのまま文字起こししてください。",
  "解釈・要約・補完・企業情報の推測はしないでください。",
  "読めない箇所は [判読不可] と書いてください。",
  "出力は文字起こし本文のみとし、Markdown の見出しや説明文は追加しないでください。",
].join("\n");

/**
 * OpenAI は成功応答を返したが文字起こし本文が空だったことを表す。
 * 原因（途中終了・拒否など）の分類だけを保持し、応答本文は保持しない。
 */
export class OcrEmptyOutputError extends Error implements LoggableError {
  readonly responseStatus?: string;
  readonly incompleteReason?: string;
  readonly refused: boolean;
  readonly outputItems: number;

  constructor(response: unknown) {
    super("OpenAI OCR response did not include output text");
    this.name = "OcrEmptyOutputError";
    const record =
      response && typeof response === "object"
        ? (response as Record<string, unknown>)
        : {};
    this.responseStatus =
      typeof record.status === "string" ? record.status : undefined;
    const incomplete = record.incomplete_details as
      | Record<string, unknown>
      | null
      | undefined;
    this.incompleteReason =
      incomplete && typeof incomplete.reason === "string"
        ? incomplete.reason
        : undefined;
    const output = Array.isArray(record.output) ? record.output : [];
    this.outputItems = output.length;
    this.refused = output.some(
      (item) =>
        item &&
        typeof item === "object" &&
        Array.isArray((item as Record<string, unknown>).content) &&
        ((item as Record<string, unknown>).content as unknown[]).some(
          (block) =>
            block &&
            typeof block === "object" &&
            (block as Record<string, unknown>).type === "refusal",
        ),
    );
  }

  toLogFields(): SafeLogFields {
    return {
      responseStatus: this.responseStatus,
      incompleteReason: this.incompleteReason,
      refused: this.refused,
      outputItems: this.outputItems,
    };
  }
}

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
  signal?: AbortSignal,
): Promise<OcrResult> {
  const response = await requestProvider(
    client,
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
    { signal, timeoutMs: getOpenAiTimeoutMs(env) },
  );

  const text = extractOutputText(response);
  if (!text) {
    throw new OcrEmptyOutputError(response);
  }

  return { text };
}

export function resolveOcrProvider(env: OcrEnv = process.env): LlmProvider {
  return getOcrProvider(env);
}

export async function runOcr(
  input: OcrInput,
  options: RunOcrOptions = {},
): Promise<OcrResult> {
  const env = options.env ?? process.env;
  options.signal?.throwIfAborted();
  const provider = resolveOcrProvider(env);

  if (provider === "dummy") {
    const result = runDummyOcr("success");
    return { text: result.status === "success" ? result.text : "" };
  }

  return runOpenAiOcr(input, env, options.client, options.signal);
}
