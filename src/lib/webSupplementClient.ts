import { withGenerationResponse } from "./ocrClient";
import { isGenerationEnvelope } from "./openai/contracts";
import { validateWebSupplementResult } from "./webSupplement/validate";
import { isDateOnly, isSafeUrl } from "./workspace/validation";
import { z } from "zod";
import type {
  ApiErrorBody,
  ApiErrorCode,
  GenerationErrorCode,
  WebSupplementApiResponse,
} from "./openai/contracts";
import type { CompanyEventInfo, WebSupplementItem } from "./types";
import type {
  WebSupplementItem as WebSupplementResultItem,
  WebSupplementResult,
} from "./webSupplement/schema";

const FALLBACK_ERROR_MESSAGE =
  "Web 補足情報の取得に失敗しました。時間をおいて再試行してください。";

const CLIENT_ERROR_MESSAGES: Record<ApiErrorCode, string> = {
  invalid_input: "企業名を入力してください。",
  payload_too_large: "入力サイズが上限を超えています。",
  not_configured: "Web 補足サービスの設定が完了していません。",
  rate_limited:
    "Web 補足サービスが混み合っています。時間をおいて再試行してください。",
  timeout:
    "Web 補足情報の取得がタイムアウトしました。時間をおいて再試行してください。",
  provider_error: FALLBACK_ERROR_MESSAGE,
  validation_failed: "Web 補足情報の検証に失敗しました。",
  company_not_found: "企業名に対応する補足情報が見つかりませんでした。",
};

export class WebSupplementRequestError extends Error {
  constructor(
    message: string,
    readonly code?: GenerationErrorCode,
  ) {
    super(message);
    this.name = "WebSupplementRequestError";
  }
}

async function toWebSupplementError(
  response: Response,
): Promise<WebSupplementRequestError> {
  try {
    const body = (await response.json()) as Partial<ApiErrorBody>;
    const code = body.error?.code;
    if (code) {
      return new WebSupplementRequestError(
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
  return new WebSupplementRequestError(FALLBACK_ERROR_MESSAGE);
}

export async function requestWebSupplement(
  companyName: string,
  options: { enabled?: boolean; signal?: AbortSignal } = {},
): Promise<WebSupplementApiResponse> {
  if (!options.enabled) {
    throw new WebSupplementRequestError(
      CLIENT_ERROR_MESSAGES.not_configured,
      "not_configured",
    );
  }

  return withGenerationResponse(
    "/api/web-supplement",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ companyName }),
      signal: options.signal,
    },
    async (response) => {
      if (!response.ok) throw await toWebSupplementError(response);
      const data: unknown = await response.json().catch(() => {
        throw new WebSupplementRequestError(
          CLIENT_ERROR_MESSAGES.validation_failed,
          "validation_failed",
        );
      });
      if (!isGenerationEnvelope(data))
        throw new WebSupplementRequestError(
          CLIENT_ERROR_MESSAGES.validation_failed,
          "validation_failed",
        );
      const parsed = validateWebSupplementResult(
        (data as Partial<WebSupplementApiResponse>).result,
      );
      if (
        !parsed.ok ||
        parsed.result.items.some((item) => !isSafeUrl(item.sourceUrl))
      )
        throw new WebSupplementRequestError(
          CLIENT_ERROR_MESSAGES.validation_failed,
          "validation_failed",
        );
      parsed.result.items.forEach((item) =>
        normalizeRetrievalDate(item.retrievedAt),
      );
      return { ...data, result: parsed.result };
    },
  );
}

function normalizeRetrievalDate(value: string) {
  // A date-only provider value has day precision, not a measured retrieval instant.
  if (isDateOnly(value)) return `${value}T00:00:00Z`;
  if (
    !isDateOnly(value.slice(0, 10)) ||
    !z.iso.datetime({ offset: true }).safeParse(value).success
  )
    throw new WebSupplementRequestError(
      CLIENT_ERROR_MESSAGES.validation_failed,
      "validation_failed",
    );
  return value;
}

function confidenceForItem(
  item: WebSupplementResultItem,
): WebSupplementItem["confidence"] {
  if (item.needsVerification || item.sourceType === "non_official") {
    return "requires_check";
  }
  return item.confidence;
}

function toClientWebSupplementItems(
  result: WebSupplementResult,
): WebSupplementItem[] {
  return result.items.map((item, index) => ({
    id: `${index + 1}-${item.sourceUrl}`,
    category: item.title,
    content: item.summary,
    sourceUrl: item.sourceUrl,
    fetchedAt: normalizeRetrievalDate(item.retrievedAt),
    confidence: confidenceForItem(item),
    status: "pending",
  }));
}

export async function requestWebSupplements(
  _ocrText: string,
  companyEventInfo: CompanyEventInfo,
  signal?: AbortSignal,
): Promise<WebSupplementItem[]> {
  const companyName = companyEventInfo.companyName.trim();
  if (!companyName) {
    return [];
  }

  try {
    const response = await requestWebSupplement(companyName, {
      enabled: true,
      signal,
    });
    return toClientWebSupplementItems(response.result);
  } catch (error) {
    if (
      error instanceof WebSupplementRequestError &&
      (error.code === "not_configured" || error.code === "company_not_found")
    ) {
      return [];
    }
    throw error;
  }
}
