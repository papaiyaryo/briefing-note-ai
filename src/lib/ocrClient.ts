import { getSafeErrorMessage } from "./errorMessages";
import { protectedProviderFetch } from "./workspace/client";
import { isGenerationEnvelope } from "./openai/contracts";
import type {
  ApiErrorBody,
  GenerationErrorCode,
  OcrApiResponse,
} from "./openai/contracts";

const FALLBACK_ERROR_MESSAGE =
  "AI サービスでエラーが発生しました。しばらくして再試行してください。";

export class OcrRequestError extends Error {
  constructor(
    message: string,
    readonly code?: GenerationErrorCode,
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
        code === "unauthenticated"
          ? "本人のログインが必要です。"
          : code === "origin_forbidden"
            ? "この画面から操作してください。"
            : (getSafeErrorMessage(code) ?? FALLBACK_ERROR_MESSAGE),
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

  return withGenerationResponse(
    "/api/ocr",
    {
      method: "POST",
      body: form,
      signal,
    },
    async (response) => {
      if (!response.ok) throw await toOcrError(response);
      const data: unknown = await response.json().catch(() => {
        throw new OcrRequestError(
          "OCR応答を確認できません。",
          "validation_failed",
        );
      });
      if (
        !isGenerationEnvelope(data) ||
        typeof (data as OcrApiResponse).text !== "string" ||
        !(data as OcrApiResponse).text.trim()
      )
        throw new OcrRequestError(
          "OCR応答を確認できません。",
          "validation_failed",
        );
      return data as OcrApiResponse;
    },
  );
}

/** Includes headers, JSON decoding and cancellation; late results cannot become success. */
export async function withGenerationResponse<T>(
  input: RequestInfo | URL,
  init: RequestInit,
  read: (response: Response) => Promise<T>,
): Promise<T> {
  const controller = new AbortController(),
    external = init.signal;
  const forward = () => controller.abort();
  if (external?.aborted) controller.abort();
  else external?.addEventListener("abort", forward, { once: true });
  const timer = setTimeout(forward, 45000);
  let stop: () => void = () => {};
  try {
    return await new Promise<T>((resolve, reject) => {
      stop = () =>
        reject(new DOMException("生成要求を中断しました。", "AbortError"));
      controller.signal.addEventListener("abort", stop, { once: true });
      if (controller.signal.aborted) {
        stop();
        return;
      }
      protectedProviderFetch(input, { ...init, signal: controller.signal })
        .then((response) => {
          controller.signal.throwIfAborted();
          return read(response);
        })
        .then(
          (value) => (controller.signal.aborted ? stop() : resolve(value)),
          reject,
        );
    });
  } finally {
    clearTimeout(timer);
    external?.removeEventListener("abort", forward);
    controller.signal.removeEventListener("abort", stop);
  }
}
