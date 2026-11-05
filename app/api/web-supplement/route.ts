import { NextResponse } from "next/server";

import type { WebSupplementApiRequest } from "../../../src/lib/openai/contracts";
import { getWebSupplementProvider } from "../../../src/lib/openai/provider";
import {
  ApiError,
  errorResponse,
  toApiError,
} from "../../../src/lib/server/errors";
import { describeError, logServerEvent } from "../../../src/lib/server/log";
import {
  isWebSupplementEnabled,
  runWebSupplement,
  WebSupplementError,
} from "../../../src/lib/server/webSupplement";

export const runtime = "nodejs";
import {
  guardExisting,
  type GenerationContext,
} from "../../../src/lib/server/workspace/http";

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
  return guardExisting(request, (context) => handle(request, context));
}
async function handle(request: Request, context: GenerationContext) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    logServerEvent("warn", "web_supplement.rejected", {
      code: "invalid_input",
      reason: "body_not_json",
    });
    return errorResponse(new ApiError("invalid_input"));
  }

  if (!isWebSupplementRequest(body)) {
    logServerEvent("warn", "web_supplement.rejected", {
      code: "invalid_input",
      reason: "body_shape_invalid",
    });
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
    const result = await runWebSupplement(body.companyName.trim(), {
      signal: context.signal,
    });
    context.signal.throwIfAborted();
    return NextResponse.json({ result, provider });
  } catch (error) {
    if (error instanceof WebSupplementError) {
      logServerEvent("warn", "web_supplement.failed", {
        provider,
        code: error.code,
        ...describeError(error),
      });
      return errorResponse(new ApiError(error.code));
    }

    const apiError = toApiError(error);
    logServerEvent("error", "web_supplement.provider_failure", {
      provider,
      code: apiError.code,
      ...describeError(error),
    });
    return errorResponse(apiError);
  }
}
