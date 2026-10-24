import { withGenerationResponse } from "./ocrClient";
import { isGenerationEnvelope } from "./openai/contracts";
import { validateCompanyMemo } from "./structure/validate";
import type {
  ApiErrorBody,
  ApiErrorCode,
  GenerationErrorCode,
  StructureApiRequest,
  StructureApiResponse,
} from "./openai/contracts";

const FALLBACK_ERROR_MESSAGE =
  "Markdown 生成に失敗しました。時間をおいて再試行してください。";

const CLIENT_ERROR_MESSAGES: Record<ApiErrorCode, string> = {
  invalid_input: "OCR 結果または企業情報を確認してください。",
  payload_too_large: "入力サイズが上限を超えています。",
  not_configured: "Markdown 生成サービスの設定が完了していません。",
  rate_limited:
    "Markdown 生成サービスが混み合っています。時間をおいて再試行してください。",
  timeout:
    "Markdown 生成がタイムアウトしました。時間をおいて再試行してください。",
  provider_error: FALLBACK_ERROR_MESSAGE,
  validation_failed: "構造化結果の検証に失敗しました。",
  company_not_found: "企業名に対応する補足情報が見つかりませんでした。",
};

export class StructureRequestError extends Error {
  constructor(
    message: string,
    readonly code?: GenerationErrorCode,
  ) {
    super(message);
    this.name = "StructureRequestError";
  }
}

async function toStructureError(
  response: Response,
): Promise<StructureRequestError> {
  try {
    const body = (await response.json()) as Partial<ApiErrorBody>;
    const code = body.error?.code;
    if (code) {
      return new StructureRequestError(
        code === "unauthenticated"
          ? "本人のログインが必要です。"
          : code === "origin_forbidden"
            ? "この画面から操作してください。"
            : (CLIENT_ERROR_MESSAGES[code] ?? FALLBACK_ERROR_MESSAGE),
        code,
      );
    }
  } catch {
    // JSON でないエラーも安全な汎用メッセージに丸める。
  }
  return new StructureRequestError(FALLBACK_ERROR_MESSAGE);
}

export async function requestStructure(
  ocrText: string,
  companyEventInfo: StructureApiRequest["companyEventInfo"],
  signal?: AbortSignal,
): Promise<StructureApiResponse> {
  return withGenerationResponse(
    "/api/structure",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ocrText, companyEventInfo }),
      signal,
    },
    async (response) => {
      if (!response.ok) throw await toStructureError(response);
      const data: unknown = await response.json().catch(() => {
        throw new StructureRequestError(
          CLIENT_ERROR_MESSAGES.validation_failed,
          "validation_failed",
        );
      });
      if (!isGenerationEnvelope(data))
        throw new StructureRequestError(
          CLIENT_ERROR_MESSAGES.validation_failed,
          "validation_failed",
        );
      const parsed = validateCompanyMemo(
        (data as Partial<StructureApiResponse>).memo,
      );
      if (!parsed.ok)
        throw new StructureRequestError(
          CLIENT_ERROR_MESSAGES.validation_failed,
          "validation_failed",
        );
      return { ...data, memo: parsed.memo };
    },
  );
}
