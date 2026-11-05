import { AsyncLocalStorage } from "node:async_hooks";

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
 * 例外が自分の診断情報（上流のエラーコードなど）をログへ渡すための口。
 * 返す値は機微情報を含まないスカラーに限る。
 */
export interface LoggableError {
  toLogFields(): SafeLogFields;
}

const requestContext = new AsyncLocalStorage<SafeLogFields>();

/** fn の中（非同期の続きも含む）で出るすべてのログに fields を付ける。 */
export function withLogContext<T>(fields: SafeLogFields, fn: () => T): T {
  const parent = requestContext.getStore();
  return requestContext.run({ ...parent, ...fields }, fn);
}

export function getLogContext(): SafeLogFields | undefined {
  return requestContext.getStore();
}

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
    ...requestContext.getStore(),
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

const MAX_MESSAGE = 300;
const MAX_STACK = 1200;
const MAX_CAUSE_DEPTH = 2;

/** API キー・Bearer トークン・接続文字列の資格情報を伏せる。 */
export function redact(text: string): string {
  return text
    .replace(/\bsk-[A-Za-z0-9_*-]{6,}/g, "sk-[redacted]")
    .replace(/\bsb_(secret|publishable)_[A-Za-z0-9_-]+/g, "sb_$1_[redacted]")
    .replace(/Bearer\s+[^\s"']+/gi, "Bearer [redacted]")
    .replace(/eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/g, "[jwt]")
    .replace(/([a-z][a-z0-9+.-]*:\/\/)[^\s/@]+@/gi, "$1[redacted]@");
}

function clip(text: string, max: number): string {
  const single = redact(text).replace(/\s+/g, " ").trim();
  return single.length > max ? `${single.slice(0, max)}…` : single;
}

function stackFrames(stack: string | undefined): string | undefined {
  if (!stack) return undefined;
  const frames = stack
    .split("\n")
    .slice(1)
    .map((line) => line.trim())
    .filter((line) => line.startsWith("at "))
    .slice(0, 6)
    .join(" | ");
  return frames ? clip(frames, MAX_STACK) : undefined;
}

function isLoggable(value: unknown): value is LoggableError {
  return (
    typeof value === "object" &&
    value !== null &&
    typeof (value as Partial<LoggableError>).toLogFields === "function"
  );
}

function scalarCode(value: unknown): string | number | undefined {
  if (!value || typeof value !== "object" || !("code" in value))
    return undefined;
  const code = (value as { code?: unknown }).code;
  return typeof code === "string" || typeof code === "number"
    ? code
    : undefined;
}

/**
 * 例外を、原因調査に必要で安全なログ項目へ変換する。
 * - SyntaxError（JSON.parse 失敗）は入力本文を含みうるのでメッセージを落とす
 * - 秘密情報らしき文字列は伏せ、長さを制限する
 * - cause を 2 段までたどり、`cause*` / `causeCause*` として並べる
 */
export function describeError(
  error: unknown,
  prefix = "",
  depth = 0,
): SafeLogFields {
  const key = (name: string) =>
    prefix ? `${prefix}${name[0].toUpperCase()}${name.slice(1)}` : name;
  const fields: SafeLogFields = {};

  if (error instanceof Error) {
    fields[key("errorName")] = error.name;
    fields[key("errorMessage")] =
      error instanceof SyntaxError
        ? "[omitted: may contain request body]"
        : clip(error.message, MAX_MESSAGE);
    fields[key("errorCode")] = scalarCode(error);
    if (!prefix) fields.errorStack = stackFrames(error.stack);
  } else if (error === undefined || error === null) {
    fields[key("errorName")] = String(error);
  } else {
    fields[key("errorName")] = "NonError";
    fields[key("errorMessage")] = clip(
      typeof error === "string" ? error : safeStringify(error),
      MAX_MESSAGE,
    );
    fields[key("errorCode")] = scalarCode(error);
  }

  if (isLoggable(error)) {
    for (const [name, value] of Object.entries(error.toLogFields())) {
      fields[key(name)] =
        typeof value === "string" ? clip(value, MAX_MESSAGE) : value;
    }
  }

  const cause =
    error instanceof Error ? (error as { cause?: unknown }).cause : undefined;
  if (cause !== undefined && depth < MAX_CAUSE_DEPTH) {
    const nextPrefix = prefix ? `${prefix}Cause` : "cause";
    const nested = describeError(cause, nextPrefix, depth + 1);
    // cause 側の名前は prefix 付きで作られるので、ここで errorName → Name に寄せる
    for (const [name, value] of Object.entries(nested)) {
      fields[name.replace(/Error(Name|Message|Code)$/, "$1")] = value;
    }
  }

  for (const name of Object.keys(fields))
    if (fields[name] === undefined) delete fields[name];
  return fields;
}

function safeStringify(value: unknown): string {
  try {
    return JSON.stringify(value) ?? String(value);
  } catch {
    return Object.prototype.toString.call(value);
  }
}
