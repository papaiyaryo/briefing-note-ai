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

export type ApiErrorCode =
  | "invalid_input"
  | "payload_too_large"
  | "not_configured"
  | "rate_limited"
  | "timeout"
  | "provider_error"
  | "validation_failed";

export interface ApiErrorBody {
  error: {
    code: ApiErrorCode;
    message: string;
  };
}
