import type { ErrorCode } from "./contracts";
export interface FixedRequest {
  readonly path: string;
  readonly method: "POST" | "PATCH";
  readonly body: string;
}
export class ClientFailure extends Error {
  constructor(
    readonly code: ErrorCode | "cancelled",
    readonly status = 0,
    readonly unknown = false,
  ) {
    super(
      code === "unauthenticated"
        ? "本人のログインが必要です。"
        : code === "version_conflict"
          ? "保存済みの内容が変わりました。入力を保持して最新を確認してください。"
          : code === "confirmation_changed"
            ? "削除対象が変わりました。最新の内容を再確認してください。"
            : code === "confirmation_expired"
              ? "削除確認の期限が切れました。"
              : code === "invalid_input"
                ? "入力内容を確認してください。"
                : unknown
                  ? "保存結果が不明です。操作結果を確認してください。"
                  : "取得・操作を完了できません。再取得してください。",
    );
    this.name = "ClientFailure";
  }
}
let authGeneration = 0;
export function advanceAuthGeneration() {
  authGeneration++;
}
export function notifyUnauthorized(expected = authGeneration) {
  if (expected !== authGeneration) return;
  advanceAuthGeneration();
  if (typeof window !== "undefined")
    window.dispatchEvent(new Event("workspace:unauthenticated"));
}
export async function protectedProviderFetch(
  input: RequestInfo | URL,
  init: RequestInit = {},
) {
  const authVersion = authGeneration;
  const timeout = AbortSignal.timeout(45000);
  const response = await fetch(input, {
    ...init,
    credentials: "same-origin",
    cache: "no-store",
    signal: init.signal ? AbortSignal.any([init.signal, timeout]) : timeout,
  });
  if (response.status === 401 && !init.signal?.aborted)
    notifyUnauthorized(authVersion);
  return response;
}
async function wait(ms: number, signal: AbortSignal) {
  await new Promise<void>((resolve, reject) => {
    if (signal.aborted) return reject(new Error("aborted"));
    const timer = setTimeout(() => {
      signal.removeEventListener("abort", abort);
      resolve();
    }, ms);
    const abort = () => {
      clearTimeout(timer);
      reject(new Error("aborted"));
    };
    signal.addEventListener("abort", abort, { once: true });
  });
}
const codes = new Set<ErrorCode>([
  "invalid_input",
  "payload_too_large",
  "unauthenticated",
  "origin_forbidden",
  "not_found",
  "version_conflict",
  "confirmation_changed",
  "confirmation_expired",
  "operation_reused",
  "operation_unknown",
  "rate_limited",
  "unavailable",
  "internal_error",
]);
export class WorkspaceClient {
  constructor(
    private readonly options: {
      fetch?: typeof fetch;
      sleep?: (ms: number, signal: AbortSignal) => Promise<void>;
      onUnauthorized?: () => void;
      timeoutMs?: number;
    } = {},
  ) {}
  prepare(path: string, method: "POST" | "PATCH", body: unknown): FixedRequest {
    this.checkPath(path);
    return Object.freeze({ path, method, body: JSON.stringify(body) });
  }
  get<T>(path: string, signal?: AbortSignal): Promise<T> {
    return this.request(path, "GET", undefined, signal);
  }
  send<T>(request: FixedRequest, signal?: AbortSignal): Promise<T> {
    return this.request(request.path, request.method, request.body, signal);
  }
  private checkPath(path: string) {
    if (!/^\/api\/v1\/[a-zA-Z0-9/?=&_%.-]+$/.test(path) || path.includes(".."))
      throw new ClientFailure("invalid_input");
  }
  private async request<T>(
    path: string,
    method: string,
    body?: string,
    external?: AbortSignal,
  ): Promise<T> {
    this.checkPath(path);
    const authVersion = authGeneration;
    const timeout = AbortSignal.timeout(
      Math.min(this.options.timeoutMs ?? 15000, 15000),
    );
    const signal = external ? AbortSignal.any([external, timeout]) : timeout;
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        if (signal.aborted) throw new Error("aborted");
        const response = await (this.options.fetch ?? fetch)(path, {
          method,
          credentials: "same-origin",
          cache: "no-store",
          signal,
          ...(body !== undefined
            ? { headers: { "Content-Type": "application/json" }, body }
            : {}),
        });
        if (response.status === 503 && method === "GET" && attempt === 0) {
          await (this.options.sleep ?? wait)(500, signal);
          continue;
        }
        if (!response.ok) {
          let code: ErrorCode =
            response.status === 401
              ? "unauthenticated"
              : response.status === 404
                ? "not_found"
                : "unavailable";
          try {
            const data = await response.json();
            if (codes.has(data?.error?.code)) code = data.error.code;
          } catch {
            /* 外部本文は表示しない。 */
          }
          if (
            response.status === 401 &&
            authVersion === authGeneration &&
            !signal.aborted
          ) {
            if (this.options.onUnauthorized) {
              advanceAuthGeneration();
              this.options.onUnauthorized();
            } else notifyUnauthorized(authVersion);
          }
          throw new ClientFailure(
            code,
            response.status,
            method !== "GET" &&
              (response.status >= 500 || code === "operation_unknown"),
          );
        }
        return (await response.json()) as T;
      } catch (error) {
        if (error instanceof ClientFailure) throw error;
        if (external?.aborted)
          throw new ClientFailure("cancelled", 0, method !== "GET");
        if (method === "GET" && attempt === 0 && !signal.aborted) {
          await (this.options.sleep ?? wait)(500, signal);
          continue;
        }
        throw new ClientFailure("unavailable", 0, method !== "GET");
      }
    }
    throw new ClientFailure("unavailable");
  }
}
