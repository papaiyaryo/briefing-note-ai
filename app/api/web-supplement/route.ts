import { NextResponse } from "next/server";

import type { WebSupplementApiRequest } from "../../../src/lib/openai/contracts";
import { getWebSupplementProvider } from "../../../src/lib/openai/provider";
import {
  ApiError,
  errorResponse,
  toApiError,
} from "../../../src/lib/server/errors";
import { logServerEvent } from "../../../src/lib/server/log";
import {
  isWebSupplementEnabled,
  runWebSupplement,
  WebSupplementError,
} from "../../../src/lib/server/webSupplement";

export const runtime = "nodejs";

function isWebSupplementRequest(
  value: unknown,
): value is WebSupplementApiRequest {
  if (typeof value !== "object" || value === null) return false;
  const record = value as Record<string, unknown>;
  return (
    typeof record.companyName === "string" && record.companyName.trim() !== ""
  );
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return errorResponse(new ApiError("invalid_input"));
  }

  if (!isWebSupplementRequest(body)) {
    return errorResponse(new ApiError("invalid_input"));
  }

  if (!isWebSupplementEnabled()) {
    logServerEvent("warn", "web_supplement.disabled", { provider: "disabled" });
    return errorResponse(new ApiError("not_configured"));
  }

  const provider = getWebSupplementProvider();
  if (provider === "openai" && !process.env.OPENAI_API_KEY) {
    logServerEvent("warn", "web_supplement.not_configured", { provider });
    return errorResponse(new ApiError("not_configured"));
  }

  try {
    const result = await runWebSupplement(body.companyName.trim());
    return NextResponse.json({ result, provider });
  } catch (error) {
    if (error instanceof WebSupplementError) {
      return errorResponse(new ApiError(error.code));
    }

    const apiError = toApiError(error);
    logServerEvent("error", "web_supplement.provider_failure", {
      provider,
      code: apiError.code,
      reason: error instanceof Error ? error.name : "unknown",
    });
    return errorResponse(apiError);
  }
}
