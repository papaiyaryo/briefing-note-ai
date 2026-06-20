import type { CompanyEventInfo } from "../types";

export type LlmProvider = "dummy" | "openai";

// POST /api/ocr
export interface OcrApiResponse {
  text: string;
  provider: LlmProvider;
}

// POST /api/structure
export interface StructureApiRequest {
  ocrText: string;
  companyEventInfo: CompanyEventInfo;
}

// CompanyMemoStructured は Issue #35 で定義する。
// StructureApiResponse は #35 が完成次第 { memo: CompanyMemoStructured, provider: LlmProvider } となる。

export type ApiErrorCode =
  | "invalid_input"
  | "payload_too_large"
  | "not_configured"
  | "rate_limited"
  | "timeout"
  | "provider_error"
  | "validation_failed";

export interface ApiErrorBody {
  error: { code: ApiErrorCode; message: string };
}
