import { NextResponse } from "next/server";
import { z } from "zod";
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

const clientWebSupplementSchema = z.object({
  id: z.string().min(1),
  category: z.string().min(1),
  content: z.string().min(1),
  sourceUrl: z.string().url(),
  fetchedAt: z.string().min(1),
  confidence: z.enum(["high", "medium", "low", "requires_check"]),
  status: z.enum(["pending", "adopted", "rejected"]),
});

const interviewReviewRequestSchema = z.object({
  memo: companyMemoSchema,
  webSupplements: z.array(clientWebSupplementSchema).optional(),
  motivationMemo: z.string().optional(),
});

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return errorResponse(new ApiError("invalid_input"));
  }

  const parsed = interviewReviewRequestSchema.safeParse(body);
  if (!parsed.success) {
    return errorResponse(new ApiError("invalid_input"));
  }

  const provider = getInterviewReviewProvider();
  if (provider === "openai" && !process.env.OPENAI_API_KEY) {
    logServerEvent("warn", "interview_review.not_configured", { provider });
    return errorResponse(new ApiError("not_configured"));
  }

  const { memo, motivationMemo } = parsed.data;
  const adoptedWebSupplements = parsed.data.webSupplements?.filter(
    (item) => item.status === "adopted",
  );

  try {
    const review = await runInterviewReview(
      memo,
      adoptedWebSupplements,
      motivationMemo,
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
