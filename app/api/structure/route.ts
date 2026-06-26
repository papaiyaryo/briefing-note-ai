import { NextResponse } from "next/server";

import type {
  ApiErrorBody,
  ApiErrorCode,
  StructureApiRequest,
} from "../../../src/lib/openai/contracts";
import { getStructureProvider } from "../../../src/lib/openai/provider";
import { logServerEvent } from "../../../src/lib/server/log";
import { OpenAiRequestError } from "../../../src/lib/server/openaiClient";
import { runStructure, StructureError } from "../../../src/lib/server/structure";

export const runtime = "nodejs";

const SAFE_ERROR_MESSAGES: Record<ApiErrorCode, string> = {
  invalid_input: "入力内容を確認してください。",
  payload_too_large: "入力サイズが上限を超えています。",
  not_configured: "構造化サービスの設定が完了していません。",
  rate_limited: "構造化サービスが混み合っています。時間をおいて再試行してください。",
  timeout: "構造化処理がタイムアウトしました。時間をおいて再試行してください。",
  provider_error: "構造化処理に失敗しました。時間をおいて再試行してください。",
  validation_failed: "構造化結果の検証に失敗しました。",
};

function errorResponse(code: ApiErrorCode, status: number) {
  const body: ApiErrorBody = { error: { code, message: SAFE_ERROR_MESSAGES[code] } };
  return NextResponse.json(body, { status });
}

function isStructureRequest(value: unknown): value is StructureApiRequest {
  if (typeof value !== "object" || value === null) return false;
  const record = value as Record<string, unknown>;
  const info = record.companyEventInfo;
  return (
    typeof record.ocrText === "string" &&
    record.ocrText.trim() !== "" &&
    typeof info === "object" &&
    info !== null &&
    typeof (info as Record<string, unknown>).companyName === "string" &&
    typeof (info as Record<string, unknown>).eventName === "string" &&
    typeof (info as Record<string, unknown>).eventDate === "string"
  );
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return errorResponse("invalid_input", 400);
  }

  if (!isStructureRequest(body)) {
    return errorResponse("invalid_input", 400);
  }

  const provider = getStructureProvider();
  if (provider === "openai" && !process.env.OPENAI_API_KEY) {
    logServerEvent("warn", "structure.not_configured", { provider });
    return errorResponse("not_configured", 500);
  }

  try {
    const memo = await runStructure(body.ocrText, body.companyEventInfo);
    return NextResponse.json({ memo, provider });
  } catch (error) {
    if (error instanceof StructureError) {
      return errorResponse(error.code, 422);
    }

    const upstreamStatus =
      error instanceof OpenAiRequestError ? error.status : undefined;
    const code: ApiErrorCode = upstreamStatus === 429 ? "rate_limited" : "provider_error";
    logServerEvent("error", "structure.provider_failure", {
      provider,
      upstreamStatus,
      code,
      reason: error instanceof Error ? error.name : "unknown",
    });
    return errorResponse(code, code === "rate_limited" ? 429 : 502);
  }
}
