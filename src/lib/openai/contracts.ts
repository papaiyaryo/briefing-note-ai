import type { CompanyMemoStructured } from "../structure/schema";
import type { WebSupplementResult } from "../webSupplement/schema";
import type { CompanyEventInfo } from "../types";

export type LlmProvider = "dummy" | "openai";

export interface OcrApiResponse {
  text: string;
  provider: LlmProvider;
}

export interface StructureApiRequest {
  ocrText: string;
  companyEventInfo: CompanyEventInfo;
}

export interface StructureApiResponse {
  memo: CompanyMemoStructured;
  provider: LlmProvider;
}

export interface WebSupplementApiRequest {
  companyName: string;
}

export interface WebSupplementApiResponse {
  result: WebSupplementResult;
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

export interface ApiErrorBody {
  error: {
    code: ApiErrorCode;
    message: string;
  };
}
