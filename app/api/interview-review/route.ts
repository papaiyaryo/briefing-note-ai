import { NextResponse } from "next/server";

import type { InterviewReviewApiRequest } from "../../../src/lib/openai/contracts";
import { getInterviewReviewProvider } from "../../../src/lib/openai/provider";
import { companyMemoSchema } from "../../../src/lib/structure/schema";
import {
  ApiError,
  errorResponse,
  toApiError,
} from "../../../src/lib/server/errors";
import { logServerEvent } from "../../../src/lib/server/log";
import {
  InterviewReviewError,
  runInterviewReview,
} from "../../../src/lib/server/interviewReview";

export const runtime = "nodejs";

function isInterviewReviewRequest(
  value: unknown,
): value is InterviewReviewApiRequest {
  if (typeof value !== "object" || value === null) return false;
  const record = value as Record<string, unknown>;
  return companyMemoSchema.safeParse(record.memo).success;
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return errorResponse(new ApiError("invalid_input"));
  }

  if (!isInterviewReviewRequest(body)) {
    return errorResponse(new ApiError("invalid_input"));
  }

  const provider = getInterviewReviewProvider();
  if (provider === "openai" && !process.env.OPENAI_API_KEY) {
    logServerEvent("warn", "interview_review.not_configured", { provider });
    return errorResponse(new ApiError("not_configured"));
  }

  try {
    const review = await runInterviewReview(
      body.memo,
      body.webSupplements,
      body.motivationMemo,
    );
    return NextResponse.json({ review, provider });
  } catch (error) {
    if (error instanceof InterviewReviewError) {
      return errorResponse(new ApiError(error.code));
    }

    const apiError = toApiError(error);
    logServerEvent("error", "interview_review.provider_failure", {
      provider,
      code: apiError.code,
      reason: error instanceof Error ? error.name : "unknown",
    });
    return errorResponse(apiError);
  }
}
