import type {
  ApiErrorBody,
  ApiErrorCode,
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
    readonly code?: ApiErrorCode,
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
        CLIENT_ERROR_MESSAGES[code] ??
          body.error?.message ??
          FALLBACK_ERROR_MESSAGE,
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
  options: { enabled?: boolean } = {},
): Promise<WebSupplementApiResponse> {
  if (!options.enabled) {
    throw new WebSupplementRequestError(
      CLIENT_ERROR_MESSAGES.not_configured,
      "not_configured",
    );
  }

  const response = await fetch("/api/web-supplement", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ companyName }),
  });
  if (!response.ok) throw await toWebSupplementError(response);
  return response.json() as Promise<WebSupplementApiResponse>;
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
    fetchedAt: item.retrievedAt,
    confidence: confidenceForItem(item),
    status: "pending",
  }));
}

export async function requestWebSupplements(
  _ocrText: string,
  companyEventInfo: CompanyEventInfo,
): Promise<WebSupplementItem[]> {
  const companyName = companyEventInfo.companyName.trim();
  if (!companyName) {
    return [];
  }

  try {
    const response = await requestWebSupplement(companyName, { enabled: true });
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
