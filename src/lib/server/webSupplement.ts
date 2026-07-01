import type { ApiErrorCode } from "../openai/contracts";
import { getWebSupplementProvider } from "../openai/provider";
import { buildDummyWebSupplement } from "../webSupplement/dummy";
import {
  webSupplementJsonSchema,
  type WebSupplementResult,
} from "../webSupplement/schema";
import { validateWebSupplementResult } from "../webSupplement/validate";
import { createOpenAiClient } from "./openaiClient";

export class WebSupplementError extends Error {
  constructor(readonly code: ApiErrorCode) {
    super(code);
    this.name = "WebSupplementError";
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

async function runOpenAiWebSupplement(
  companyName: string,
): Promise<WebSupplementResult> {
  const client = createOpenAiClient();
  const retrievedAt = new Date().toISOString().slice(0, 10);
  const response = await client.createResponse({
    model: process.env.OPENAI_WEB_SUPPLEMENT_MODEL ?? "gpt-5.5",
    tools: [{ type: "web_search" }],
    input: [
      {
        role: "system",
        content:
          "企業の公式サイトや採用サイトを優先して、出典 URL 付きの補足候補だけを JSON で返す。紙メモ由来情報や個人の印象とは混ぜない。不確実情報、非公式情報、信頼度 medium/low は必ず needsVerification を true にする。企業が特定できない場合は items を空配列にする。",
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
  });

  const text = extractResponseText(response);
  if (!text) throw new WebSupplementError("validation_failed");
  const parsed = validateWebSupplementResult(JSON.parse(text));
  if (!parsed.ok) throw new WebSupplementError(parsed.code);
  if (parsed.result.items.length === 0) {
    throw new WebSupplementError("company_not_found");
  }
  return parsed.result;
}

export async function runWebSupplement(
  companyName: string,
): Promise<WebSupplementResult> {
  if (getWebSupplementProvider() === "dummy") {
    return buildDummyWebSupplement(companyName);
  }
  return runOpenAiWebSupplement(companyName);
}
