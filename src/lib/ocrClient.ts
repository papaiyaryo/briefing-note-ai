import type {
  ApiErrorBody,
  ApiErrorCode,
  OcrApiResponse,
} from "./openai/contracts";

const FALLBACK_ERROR_MESSAGE =
  "OCR 処理に失敗しました。時間をおいて再試行してください。";

const CLIENT_ERROR_MESSAGES: Record<ApiErrorCode, string> = {
  invalid_input:
    "画像形式を確認してください。PNG / JPG / JPEG / WebP に対応しています。",
  payload_too_large:
    "画像サイズが上限を超えています。10MB 以下の画像を選択してください。",
  not_configured: "OCR サービスの設定が完了していません。",
  rate_limited:
    "OCR サービスが混み合っています。時間をおいて再試行してください。",
  timeout: "OCR 処理がタイムアウトしました。時間をおいて再試行してください。",
  provider_error: FALLBACK_ERROR_MESSAGE,
  validation_failed: "OCR 結果の検証に失敗しました。",
};

export class OcrRequestError extends Error {
  constructor(
    message: string,
    readonly code?: ApiErrorCode,
  ) {
    super(message);
    this.name = "OcrRequestError";
  }
}

async function toOcrError(response: Response): Promise<OcrRequestError> {
  try {
    const body = (await response.json()) as Partial<ApiErrorBody>;
    const code = body.error?.code;
    if (code) {
      return new OcrRequestError(
        CLIENT_ERROR_MESSAGES[code] ??
          body.error?.message ??
          FALLBACK_ERROR_MESSAGE,
        code,
      );
    }
  } catch {
    // レスポンス本文が JSON でない場合も、安全な汎用メッセージだけを返す。
  }

  return new OcrRequestError(FALLBACK_ERROR_MESSAGE);
}

export async function requestOcr(
  file: File,
  signal?: AbortSignal,
): Promise<OcrApiResponse> {
  const form = new FormData();
  form.append("file", file);

  const response = await fetch("/api/ocr", {
    method: "POST",
    body: form,
    signal,
  });

  if (!response.ok) {
    throw await toOcrError(response);
  }

  return response.json() as Promise<OcrApiResponse>;
}
