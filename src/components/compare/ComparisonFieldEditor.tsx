"use client";
import { useId } from "react";
import { INTEREST_LEVEL_LABELS } from "../../lib/comparison";
import {
  ComparisonSession,
  fieldDirty,
  type ComparisonField,
} from "../../lib/companyComparison/session";
import type { ComparisonEdits } from "../../lib/companyComparison/edits";
import { useComparisonRevision } from "./ComparisonSessionProvider";
export function hasCommittedOutcome(field: ComparisonField) {
  if (field.status !== "committed" || !field.intent || !field.outcome)
    return false;
  try {
    const outcome = field.outcome;
    return (
      outcome.operationId === JSON.parse(field.intent.request.body).operationId &&
      outcome.companyId === field.companyId &&
      outcome.memoId === field.memoId &&
      outcome.action ===
        (field.kind === "interest" ? "company_update" : "memo_update") &&
      typeof outcome.resultingVersion === "string" &&
      outcome.resultingVersion.length > 0
    );
  } catch {
    return false;
  }
}
export function fieldReadError(field: ComparisonField) {
  return field.readbackState === "error" && !hasCommittedOutcome(field)
    ? "最新を取得できません。保持入力は変更していません。"
    : field.error;
}
export function ComparisonFieldEditor({
  session,
  edits,
  fieldKey,
  onSaved,
}: {
  session: ComparisonSession;
  edits: ComparisonEdits;
  fieldKey: string;
  onSaved?: () => Promise<void>;
}) {
  useComparisonRevision(session);
  const inputId = useId(),
    field = session.state.fields.get(fieldKey);
  if (!field) return null;
  const pending = field.status === "saving" || field.status === "unknown",
    available = session.isFieldAvailable(field),
    committed = hasCommittedOutcome(field),
    label = field.kind === "interest" ? "企業志望度" : "選択メモの比較理由";
  const act = async (action: () => Promise<void>) => {
    await action();
    if (hasCommittedOutcome(field)) await onSaved?.();
  };
  const status =
    field.status === "saving"
      ? "保存中"
      : field.status === "unknown"
        ? "結果不明・同じ要求を保持しています"
        : field.status === "conflict"
          ? "競合・保持入力と最新を確認してください"
          : committed
            ? field.readbackState === "error"
              ? "保存成功。最新の取得に失敗しました。"
              : "保存成功"
            : field.status === "committed"
              ? "確定結果を確認できません・入力を保持しています"
              : field.status === "rejected"
              ? "保存を拒否しました・入力を保持しています"
              : fieldDirty(field)
                ? "未保存"
                : "保存済みの値";
  return (
    <section className="min-w-0 space-y-2 rounded border p-3">
      <label htmlFor={inputId} className="block font-bold">
        {label}
      </label>
      {field.kind === "interest" ? (
        <select
          id={inputId}
          data-testid="comparison-field-input"
          className="w-full rounded border p-2"
          value={field.draftValue ?? ""}
          disabled={!available}
          onChange={(event) => {
            if (session.isFieldAvailable(field)) session.edit(fieldKey, event.target.value || null);
          }}
        >
          <option value="">未設定</option>
          {Object.entries(INTEREST_LEVEL_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      ) : (
        <>
          <p className="text-sm">
            任意・5000 Unicode文字まで。本文・構造化項目とは別保存です。
          </p>
          <textarea
            id={inputId}
            data-testid="comparison-field-input"
            className="min-h-28 w-full rounded border p-2"
            value={field.draftValue ?? ""}
            disabled={!available}
            onChange={(event) => {
              if (session.isFieldAvailable(field)) session.edit(fieldKey, event.target.value);
            }}
          />
        </>
      )}
      <button
        data-testid="comparison-field-save"
        className="rounded border px-3 py-2 disabled:opacity-50"
        disabled={
          pending ||
          !available ||
          field.status === "conflict" ||
          !fieldDirty(field) ||
          session.state.restorationRequired
        }
        onClick={() => act(() => edits.save(fieldKey))}
      >
        {label}だけ保存
      </button>
      <p role="status" aria-live="polite" className="whitespace-pre-wrap">
        {status}
      </p>
      {!available && <p role="status">対象なし／利用不可。入力・新規保存・基準更新は利用できません。保持入力と送信済み操作は残しています。最新を別領域に取得して対象を確認してください。</p>}
      {field.error && <p role="alert">{fieldReadError(field)}</p>}
      {committed && field.outcome && (
        <p className="break-all text-xs">
          確定操作 {field.outcome.operationId} / 確定版{" "}
          {field.outcome.resultingVersion}
        </p>
      )}
      {field.status === "unknown" && (
        <div className="flex flex-wrap gap-2">
          <button
            data-testid="comparison-field-lookup"
            className="rounded border p-2"
            onClick={() => act(() => edits.lookup(fieldKey))}
          >
            操作結果を確認
          </button>
          <button
            data-testid="comparison-field-retry"
            className="rounded border p-2"
            disabled={
              !field.intent?.lookupUnknown || session.state.restorationRequired
            }
            onClick={() => act(() => edits.retry(fieldKey))}
          >
            同じ要求・同じIDで再試行
          </button>
        </div>
      )}
      {(!available || field.status === "conflict" || field.readbackState === "error") && (
        <button
          data-testid="comparison-field-latest"
          className="rounded border p-2"
          onClick={() => edits.refreshLatest(fieldKey)}
        >
          最新を別領域に取得
        </button>
      )}
      {field.status === "conflict" && (
        <div className="space-y-2 rounded bg-amber-50 p-2">
          <p className="whitespace-pre-wrap">
            元の基準: {field.baseValue ?? "未設定"} / 版 {field.baseVersion}
          </p>
          <p className="whitespace-pre-wrap">
            保持入力: {field.draftValue ?? "未設定"}
          </p>
          {field.latest && (
            <>
              <p className="whitespace-pre-wrap">
                最新保存値: {field.latest.value ?? "未設定"} / 版{" "}
                {field.latest.version}
              </p>
              <button
                data-testid="comparison-field-rebase"
                className="rounded border p-2"
                disabled={!available}
                onClick={() => edits.rebase(fieldKey)}
              >
                保持入力のまま最新を基準に編集する
              </button>
            </>
          )}
        </div>
      )}
    </section>
  );
}
