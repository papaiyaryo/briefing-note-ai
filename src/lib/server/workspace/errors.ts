import { randomUUID } from "node:crypto";
import type { ContractError, ErrorCode } from "../../workspace/contracts";

const messages: Record<ErrorCode, string> = {
  invalid_input: "入力内容を確認してください。",
  payload_too_large: "入力サイズが上限を超えています。",
  unauthenticated: "本人のログインが必要です。",
  origin_forbidden: "この操作元は許可されていません。",
  not_found: "対象が見つかりません。",
  version_conflict: "保存済みの内容が変わりました。最新を確認してください。",
  confirmation_changed: "削除対象が変わりました。内容を再確認してください。",
  confirmation_expired: "削除確認の期限が切れました。",
  operation_reused: "同じ操作IDを別の内容に使用できません。",
  operation_unknown: "保存結果を確認できません。操作結果を照合してください。",
  rate_limited: "時間をおいて再試行してください。",
  unavailable:
    "保存・認証サービスに接続できません。設定と操作結果を確認してください。",
  internal_error: "処理を完了できませんでした。操作結果を確認してください。",
};
export class WorkspaceError extends Error {
  constructor(
    readonly code: ErrorCode,
    readonly fields?: Record<string, string>,
  ) {
    super(messages[code]);
    this.name = "WorkspaceError";
  }
}
export function contractProblem(
  error: unknown,
  requestId = randomUUID(),
): ContractError {
  const problem =
    error instanceof WorkspaceError
      ? error
      : new WorkspaceError("internal_error");
  return {
    error: {
      code: problem.code,
      message: problem.message,
      requestId,
      ...(problem.fields ? { fields: problem.fields } : {}),
    },
  };
}
export function sqlProblem(error: unknown) {
  if (error instanceof WorkspaceError) return error;
  const code =
    error && typeof error === "object" && "code" in error ? error.code : null;
  if (code === "23505") return new WorkspaceError("operation_reused");
  if (["23503", "23514", "22P02"].includes(String(code)))
    return new WorkspaceError("invalid_input");
  return new WorkspaceError("unavailable");
}
