import type { ApiErrorCode } from "../openai/contracts";
import { getStructureProvider } from "../openai/provider";
import { buildDummyStructure } from "../structure/dummyStructure";
import {
  companyMemoJsonSchema,
  type CompanyMemoStructured,
} from "../structure/schema";
import { validateCompanyMemo } from "../structure/validate";
import type { CompanyEventInfo } from "../types";
import {
  createOpenAiClient,
  getOpenAiTimeoutMs,
  type OpenAiResponsesClient,
} from "./openaiClient";
import { requestProvider } from "./generation/request";
interface RunStructureOptions {
  env?: Record<string, string | undefined>;
  client?: OpenAiResponsesClient;
  signal?: AbortSignal;
}

export class StructureError extends Error {
  constructor(readonly code: ApiErrorCode) {
    super(code);
    this.name = "StructureError";
  }
}

function extractResponseText(response: unknown): string | null {
  if (typeof response !== "object" || response === null) return null;
  const record = response as Record<string, unknown>;
  if (typeof record.output_text === "string") return record.output_text;
  const output = record.output;
  if (!Array.isArray(output)) return null;
  for (const item of output) {
    if (typeof item !== "object" || item === null) continue;
    const content = (item as Record<string, unknown>).content;
    if (!Array.isArray(content)) continue;
    for (const part of content) {
      if (typeof part === "object" && part !== null) {
        const text = (part as Record<string, unknown>).text;
        if (typeof text === "string") return text;
      }
    }
  }
  return null;
}

async function runOpenAiStructure(
  ocrText: string,
  info: CompanyEventInfo,
  options: RunStructureOptions,
): Promise<CompanyMemoStructured> {
  const env = options.env ?? process.env;
  const client = options.client ?? createOpenAiClient(env);
  const response = await requestProvider(
    client,
    {
      model: env.OPENAI_STRUCTURE_MODEL ?? "gpt-4o-mini",
      input: [
        {
          role: "system",
          content:
            "OCRにない会社事実を作らない。不確実な値は要確認にする。事実、所感、HR・社員の強調点、質問、ES材料を必ず分離する。impressions/esPointsは断定できなければ空配列でよい。",
        },
        {
          role: "user",
          content: JSON.stringify({ companyEventInfo: info, ocrText }),
        },
      ],
      text: {
        format: {
          type: "json_schema",
          name: "company_memo",
          strict: true,
          schema: companyMemoJsonSchema,
        },
      },
    },
    { signal: options.signal, timeoutMs: getOpenAiTimeoutMs(env) },
  );
  const text = extractResponseText(response);
  if (!text) throw new StructureError("validation_failed");
  const parsed = validateCompanyMemo(JSON.parse(text));
  if (!parsed.ok) throw new StructureError(parsed.code);
  return parsed.memo;
}

export async function runStructure(
  ocrText: string,
  info: CompanyEventInfo,
  options: RunStructureOptions = {},
): Promise<CompanyMemoStructured> {
  options.signal?.throwIfAborted();
  if (getStructureProvider(options.env ?? process.env) === "dummy") {
    return buildDummyStructure(ocrText, info);
  }
  return runOpenAiStructure(ocrText, info, options);
}
