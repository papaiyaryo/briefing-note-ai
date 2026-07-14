import type { ApiErrorCode } from "../openai/contracts";
import {
  interviewReviewSchema,
  type InterviewReviewStructured,
} from "./schema";

export interface InterviewReviewValidationSuccess {
  ok: true;
  result: InterviewReviewStructured;
}

export interface InterviewReviewValidationFailure {
  ok: false;
  code: ApiErrorCode;
}

export function normalizeInterviewReview(
  value: unknown,
): InterviewReviewStructured {
  return interviewReviewSchema.parse(value);
}

export function validateInterviewReview(
  value: unknown,
): InterviewReviewValidationSuccess | InterviewReviewValidationFailure {
  const parsed = interviewReviewSchema.safeParse(value);
  if (!parsed.success) return { ok: false, code: "validation_failed" };
  return { ok: true, result: parsed.data };
}
