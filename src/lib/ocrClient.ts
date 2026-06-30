import { getSafeErrorMessage } from "./errorMessages";
import type {
  ApiErrorBody,
  ApiErrorCode,
  OcrApiResponse,
} from "./openai/contracts";

const FALLBACK_ERROR_MESSAGE =
  "AI サービスでエラーが発生しました。しばらくして再試行してください。";

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
        getSafeErrorMessage(code) ??
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
