import { NextResponse } from "next/server";

import type {
  ApiErrorBody,
  ApiErrorCode,
  OcrApiResponse,
} from "../../../src/lib/openai/contracts";
import { getOcrProvider } from "../../../src/lib/openai/provider";
import { logServerEvent } from "../../../src/lib/server/log";
import { OpenAiRequestError } from "../../../src/lib/server/openaiClient";
import { runOcr } from "../../../src/lib/server/ocr";
import { validateImageFile } from "../../../src/lib/upload";

export const runtime = "nodejs";

const SAFE_ERROR_MESSAGES: Record<ApiErrorCode, string> = {
  invalid_input:
    "対応していない画像形式です。PNG / JPG / JPEG / WebP の画像を選択してください。",
  payload_too_large:
    "画像サイズが上限を超えています。10MB 以下の画像を選択してください。",
  not_configured: "OCR サービスの設定が完了していません。",
  rate_limited:
    "OCR サービスが混み合っています。時間をおいて再試行してください。",
  timeout: "OCR 処理がタイムアウトしました。時間をおいて再試行してください。",
  provider_error: "OCR 処理に失敗しました。時間をおいて再試行してください。",
  validation_failed: "OCR 結果の検証に失敗しました。",
};

function errorResponse(code: ApiErrorCode, status: number) {
  const body: ApiErrorBody = {
    error: { code, message: SAFE_ERROR_MESSAGES[code] },
  };
  return NextResponse.json(body, { status });
}

function getRequestFile(formData: FormData): File | null {
  const file = formData.get("file");
  return file instanceof File ? file : null;
}

export async function POST(request: Request) {
  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return errorResponse("invalid_input", 400);
  }

  const file = getRequestFile(formData);
  if (!file) {
    return errorResponse("invalid_input", 400);
  }

  const validationError = validateImageFile({
    name: file.name,
    type: file.type,
    size: file.size,
  });

  if (validationError === "unsupported-format") {
    return errorResponse("invalid_input", 400);
  }
  if (validationError === "file-too-large") {
    return errorResponse("payload_too_large", 400);
  }

  const provider = getOcrProvider();
  if (provider === "openai" && !process.env.OPENAI_API_KEY) {
    logServerEvent("warn", "ocr.not_configured", { provider });
    return errorResponse("not_configured", 500);
  }

  try {
    const bytes = new Uint8Array(await file.arrayBuffer());
    const result = await runOcr({ bytes, mimeType: file.type });
    const body: OcrApiResponse = { text: result.text, provider };
    return NextResponse.json(body);
  } catch (error) {
    const upstreamStatus =
      error instanceof OpenAiRequestError ? error.status : undefined;
    const code: ApiErrorCode =
      upstreamStatus === 429 ? "rate_limited" : "provider_error";
    const httpStatus = code === "rate_limited" ? 429 : 502;

    // 画像・OCR 本文・例外メッセージは載せず、分類に必要なメタ情報のみ記録する。
    logServerEvent("error", "ocr.provider_failure", {
      provider,
      upstreamStatus,
      code,
    });

    return errorResponse(code, httpStatus);
  }
}
