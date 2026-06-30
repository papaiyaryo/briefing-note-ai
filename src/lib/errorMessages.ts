import type { ApiErrorCode } from "./openai/contracts";

export const ERROR_MESSAGES: Record<ApiErrorCode, string> = {
  invalid_input:
    "画像形式を確認してください。PNG / JPG / JPEG / WebP に対応しています。",
  payload_too_large:
    "画像サイズが大きすぎます。10MB 以下の画像を使用してください。",
  not_configured: "OpenAI が未設定です。ダミーモードで動作しています。",
  rate_limited: "混み合っています。少し時間をおいて再試行してください。",
  timeout: "応答に時間がかかりました。再試行してください。",
  provider_error:
    "AI サービスでエラーが発生しました。しばらくして再試行してください。",
  validation_failed: "生成結果を確認できませんでした。再試行してください。",
};

export function getSafeErrorMessage(code: ApiErrorCode): string {
  return ERROR_MESSAGES[code];
}
