import type {
  ApiErrorBody,
  ApiErrorCode,
  InterviewReviewApiResponse,
} from "./openai/contracts";
import type { CompanyMemoStructured } from "./structure/schema";
import type { WebSupplementItem } from "./types";

const FALLBACK_ERROR_MESSAGE =
  "面接前復習メモの生成に失敗しました。時間をおいて再試行してください。";

const CLIENT_ERROR_MESSAGES: Record<ApiErrorCode, string> = {
  invalid_input: "構造化済みメモを確認してください。",
  payload_too_large: "入力サイズが上限を超えています。",
  not_configured: "面接前復習サービスの設定が完了していません。",
  rate_limited:
    "面接前復習サービスが混み合っています。時間をおいて再試行してください。",
  timeout:
    "面接前復習メモの生成がタイムアウトしました。時間をおいて再試行してください。",
  provider_error: FALLBACK_ERROR_MESSAGE,
  validation_failed: "面接前復習メモの検証に失敗しました。",
  company_not_found: "企業情報が見つかりませんでした。",
};

export class InterviewReviewRequestError extends Error {
  constructor(
    message: string,
    readonly code?: ApiErrorCode,
  ) {
    super(message);
    this.name = "InterviewReviewRequestError";
  }
}

async function toInterviewReviewError(
  response: Response,
): Promise<InterviewReviewRequestError> {
  try {
    const body = (await response.json()) as Partial<ApiErrorBody>;
    const code = body.error?.code;
    if (code) {
      return new InterviewReviewRequestError(
        CLIENT_ERROR_MESSAGES[code] ??
          body.error?.message ??
          FALLBACK_ERROR_MESSAGE,
        code,
      );
    }
  } catch {
    // JSON でないエラーも安全な汎用メッセージに丸める。
  }
  return new InterviewReviewRequestError(FALLBACK_ERROR_MESSAGE);
}

export async function requestInterviewReview(
  memo: CompanyMemoStructured,
  webSupplements?: WebSupplementItem[],
  signal?: AbortSignal,
): Promise<InterviewReviewApiResponse> {
  const response = await fetch("/api/interview-review", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ memo, webSupplements }),
    signal,
  });
  if (!response.ok) throw await toInterviewReviewError(response);
  return response.json() as Promise<InterviewReviewApiResponse>;
}
