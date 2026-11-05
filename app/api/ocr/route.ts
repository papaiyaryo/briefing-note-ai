import { NextResponse } from "next/server";

import type { OcrApiResponse } from "../../../src/lib/openai/contracts";
import { getOcrProvider } from "../../../src/lib/openai/provider";
import {
  ApiError,
  errorResponse,
  toApiError,
} from "../../../src/lib/server/errors";
import { logApiEvent } from "../../../src/lib/server/logger";
import { describeError, logServerEvent } from "../../../src/lib/server/log";
import { runOcr } from "../../../src/lib/server/ocr";
import { validateImageFile } from "../../../src/lib/upload";

export const runtime = "nodejs";
import {
  guardExisting,
  type GenerationContext,
} from "../../../src/lib/server/workspace/http";

function getRequestFile(formData: FormData): File | null {
  const file = formData.get("file");
  return file instanceof File ? file : null;
}

function durationSince(startedAt: number): number {
  return performance.now() - startedAt;
}

export async function POST(request: Request) {
  return guardExisting(request, (context) => handle(request, context));
}
async function handle(request: Request, context: GenerationContext) {
  const startedAt = performance.now();
  const provider = getOcrProvider();
  // 画像そのものは記録しない。形式とサイズだけを原因調査用に残す。
  let fileMeta: { mimeType?: string; fileSize?: number } = {};

  try {
    let formData: FormData;
    try {
      formData = await request.formData();
    } catch (error) {
      throw new ApiError("invalid_input", undefined, undefined, {
        reason: "form_parse_failed",
        cause: error,
      });
    }

    const file = getRequestFile(formData);
    if (!file) {
      throw ApiError.rejected("invalid_input", "missing_file");
    }
    fileMeta = { mimeType: file.type || "(empty)", fileSize: file.size };

    const validationError = validateImageFile({
      name: file.name,
      type: file.type,
      size: file.size,
    });

    if (validationError === "unsupported-format") {
      throw ApiError.rejected("invalid_input", "unsupported_format");
    }
    if (validationError === "file-too-large") {
      throw ApiError.rejected("payload_too_large", "file_too_large");
    }

    if (provider === "openai" && !process.env.OPENAI_API_KEY) {
      throw ApiError.rejected("not_configured", "missing_env:OPENAI_API_KEY");
    }

    const bytes = new Uint8Array(await file.arrayBuffer());
    const result = await runOcr(
      { bytes, mimeType: file.type },
      { signal: context.signal },
    );
    context.signal.throwIfAborted();
    const body: OcrApiResponse = { text: result.text, provider };

    logApiEvent({
      stage: "ocr",
      code: "ok",
      durationMs: durationSince(startedAt),
      provider,
    });

    return NextResponse.json(body);
  } catch (error) {
    const apiError = toApiError(error);

    logServerEvent(
      apiError.httpStatus >= 500 || apiError.code === "rate_limited"
        ? "error"
        : "warn",
      "ocr.failed",
      {
        provider,
        code: apiError.code,
        httpStatus: apiError.httpStatus,
        durationMs: Math.round(durationSince(startedAt)),
        reason: apiError.reason,
        ...fileMeta,
        ...describeError(error),
      },
    );

    logApiEvent({
      stage: "ocr",
      code: apiError.code,
      durationMs: durationSince(startedAt),
      provider,
    });

    return errorResponse(apiError);
  }
}
