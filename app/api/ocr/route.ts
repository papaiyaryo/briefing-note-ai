import { NextResponse } from "next/server";

import type { OcrApiResponse } from "../../../src/lib/openai/contracts";
import { getOcrProvider } from "../../../src/lib/openai/provider";
import {
  ApiError,
  errorResponse,
  toApiError,
} from "../../../src/lib/server/errors";
import { logApiEvent } from "../../../src/lib/server/logger";
import { runOcr } from "../../../src/lib/server/ocr";
import { validateImageFile } from "../../../src/lib/upload";

export const runtime = "nodejs";

function getRequestFile(formData: FormData): File | null {
  const file = formData.get("file");
  return file instanceof File ? file : null;
}

function durationSince(startedAt: number): number {
  return performance.now() - startedAt;
}

export async function POST(request: Request) {
  const startedAt = performance.now();
  const provider = getOcrProvider();

  try {
    let formData: FormData;
    try {
      formData = await request.formData();
    } catch {
      throw new ApiError("invalid_input");
    }

    const file = getRequestFile(formData);
    if (!file) {
      throw new ApiError("invalid_input");
    }

    const validationError = validateImageFile({
      name: file.name,
      type: file.type,
      size: file.size,
    });

    if (validationError === "unsupported-format") {
      throw new ApiError("invalid_input");
    }
    if (validationError === "file-too-large") {
      throw new ApiError("payload_too_large");
    }

    if (provider === "openai" && !process.env.OPENAI_API_KEY) {
      throw new ApiError("not_configured");
    }

    const bytes = new Uint8Array(await file.arrayBuffer());
    const result = await runOcr({ bytes, mimeType: file.type });
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

    logApiEvent({
      stage: "ocr",
      code: apiError.code,
      durationMs: durationSince(startedAt),
      provider,
    });

    return errorResponse(apiError);
  }
}
