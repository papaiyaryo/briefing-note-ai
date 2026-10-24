import type { CompanyMemoStructured } from "../structure/schema";
import type { WebSupplementResult } from "../webSupplement/schema";
import type { InterviewReviewStructured } from "../interviewReview/schema";
import type { CompanyEventInfo } from "../types";

export type LlmProvider = "dummy" | "openai";

export interface OcrApiResponse {
  generationReceipt?: string;
  text: string;
  provider: LlmProvider;
}

export interface StructureApiRequest {
  ocrText: string;
  companyEventInfo: CompanyEventInfo;
}

export interface StructureApiResponse {
  generationReceipt?: string;
  memo: CompanyMemoStructured;
  provider: LlmProvider;
}

export interface WebSupplementApiRequest {
  companyName: string;
}

export interface WebSupplementApiResponse {
  generationReceipt?: string;
  result: WebSupplementResult;
  provider: LlmProvider;
}

export interface InterviewReviewApiRequest {
  memo: CompanyMemoStructured;
  webSupplements?: import("../types").WebSupplementItem[];
  motivationMemo?: string;
}

export interface InterviewReviewApiResponse {
  generationReceipt?: string;
  review: InterviewReviewStructured;
  provider: LlmProvider;
}

export type ApiErrorCode =
  | "invalid_input"
  | "payload_too_large"
  | "not_configured"
  | "rate_limited"
  | "timeout"
  | "provider_error"
  | "validation_failed"
  | "company_not_found";

export type GenerationErrorCode =
  | ApiErrorCode
  | "unauthenticated"
  | "origin_forbidden";
export function isGenerationEnvelope(
  value: unknown,
): value is { provider: LlmProvider; generationReceipt?: string } {
  if (!value || typeof value !== "object") return false;
  const data = value as Record<string, unknown>;
  return (
    (data.provider === "dummy" || data.provider === "openai") &&
    (data.generationReceipt === undefined ||
      (typeof data.generationReceipt === "string" &&
        data.generationReceipt.length > 0 &&
        data.generationReceipt.length <= 4096))
  );
}
export interface ApiErrorBody {
  error: {
    code: GenerationErrorCode;
    message: string;
  };
}
