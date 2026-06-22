type LogLevel = "info" | "warn" | "error";

/**
 * ログに載せてよいのはスカラーのメタ情報のみ。
 * 画像、OCR 本文、生成 Markdown、API キーなどの機微情報は型で弾く。
 */
export type SafeLogFields = Record<
  string,
  string | number | boolean | undefined
>;

/**
 * サーバー側の構造化ログ。1 行 1 JSON で出力する。
 * 機微情報は呼び出し側で渡さないこと（型でスカラーのみに制限している）。
 */
export function logServerEvent(
  level: LogLevel,
  event: string,
  fields: SafeLogFields = {},
): void {
  const payload = {
    level,
    event,
    at: new Date().toISOString(),
    ...fields,
  };
  const line = JSON.stringify(payload);

  if (level === "error") {
    console.error(line);
  } else if (level === "warn") {
    console.warn(line);
  } else {
    console.info(line);
  }
}
