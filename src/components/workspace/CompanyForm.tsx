"use client";
import React, { useState } from "react";
import type { Company, CompanyFields } from "../../lib/workspace/contracts";
import {
  companyFieldsSchema,
  selectionStatuses,
} from "../../lib/workspace/schema";
import { statusLabels } from "../../lib/workspace/board";
const defaults: CompanyFields = {
  name: "",
  industry: null,
  interestLevel: null,
  personalNote: null,
  selectionStatus: "not_applied",
  nextSelectionDate: null,
  applicationDeadline: null,
  officialUrl: null,
};
export function CompanyForm({
  company,
  retained,
  onSubmit = async () => {},
  onCancel = () => {},
  onChange = () => {},
  busy = false,
  needsRebase = false,
}: {
  company?: Company;
  retained?: CompanyFields;
  onSubmit?: (fields: CompanyFields) => Promise<void>;
  onCancel?: () => void;
  onChange?: (fields: CompanyFields) => void;
  busy?: boolean;
  needsRebase?: boolean;
}) {
  const [fields, setFields] = useState<CompanyFields>(
      company
        ? (Object.fromEntries(
            Object.keys(defaults).map((key) => [
              key,
              company[key as keyof CompanyFields],
            ]),
          ) as unknown as CompanyFields)
        : defaults,
    ),
    [error, setError] = useState("");
  const change = (key: keyof CompanyFields, value: string) => {
    if (needsRebase) return;
    const next = { ...fields, [key]: value || null };
    if (key === "name") next.name = value;
    setFields(next);
    onChange(next);
  };
  return (
    <form
      className="space-y-4"
      onSubmit={async (event) => {
        event.preventDefault();
        if (busy || needsRebase) return;
        const result = companyFieldsSchema.safeParse(fields);
        if (!result.success) {
          setError(
            "入力内容を確認してください。企業名・日付・URL・文字数が有効か確認してください。",
          );
          return;
        }
        setError("");
        await onSubmit(result.data);
      }}
    >
      <h2 className="text-xl font-bold">
        {company ? "企業情報を編集" : "企業を登録"}
      </h2>
      {retained && (
        <aside className="rounded border p-3">
          <p>
            保持した未保存の企業入力があります。保存済みの最新と区別して再編集できます。
          </p>
          <dl className="break-words whitespace-pre-wrap">
            <dt>保持した企業名</dt>
            <dd>{retained.name}</dd>
            <dt>業界</dt>
            <dd>{retained.industry ?? "未設定"}</dd>
            <dt>志望度</dt>
            <dd>{retained.interestLevel ?? "未設定"}</dd>
            <dt>個人メモ</dt>
            <dd>{retained.personalNote ?? "未設定"}</dd>
            <dt>選考状態</dt>
            <dd>{statusLabels[retained.selectionStatus]}</dd>
            <dt>次の選考日</dt>
            <dd>{retained.nextSelectionDate ?? "未設定"}</dd>
            <dt>応募締切</dt>
            <dd>{retained.applicationDeadline ?? "未設定"}</dd>
            <dt>公式URL</dt>
            <dd>{retained.officialUrl ?? "未設定"}</dd>
          </dl>
          <button
            type="button"
            data-testid="company-restore-draft"
            onClick={() => {
              setFields(retained);
              onChange(retained);
            }}
          >
            保持した企業入力で再編集
          </button>
        </aside>
      )}
      {needsRebase && (
        <p role="status">
          以下は最新の保存内容です。保持した入力で再編集を選ぶまで保存できません。
        </p>
      )}
      <fieldset disabled={needsRebase}>
        {(
          [
            ["name", "企業名"],
            ["industry", "業界（任意）"],
            ["officialUrl", "公式URL（任意）"],
            ["nextSelectionDate", "次の選考日（任意）"],
            ["applicationDeadline", "応募締切（任意）"],
          ] as const
        ).map(([key, label]) => (
          <label key={key} className="block">
            {label}
            <input
              autoFocus={key === "name"}
              type={
                key.includes("Date") || key === "applicationDeadline"
                  ? "date"
                  : key === "officialUrl"
                    ? "url"
                    : "text"
              }
              required={key === "name"}
              value={fields[key] ?? ""}
              onChange={(e) => change(key, e.target.value)}
              data-testid={`company-${key}`}
              className="block w-full rounded border p-2"
            />
          </label>
        ))}
        <label className="block">
          企業の志望度
          <select
            value={fields.interestLevel ?? ""}
            onChange={(e) => change("interestLevel", e.target.value)}
            className="block border p-2"
          >
            <option value="">未設定</option>
            <option value="high">高</option>
            <option value="medium">中</option>
            <option value="low">低</option>
            <option value="undecided">未定</option>
          </select>
        </label>
        <label className="block">
          選考状態
          <select
            value={fields.selectionStatus}
            onChange={(e) => change("selectionStatus", e.target.value)}
            className="block border p-2"
          >
            {selectionStatuses.map((status) => (
              <option key={status} value={status}>
                {statusLabels[status]}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          個人メモ（任意）
          <textarea
            value={fields.personalNote ?? ""}
            onChange={(e) => change("personalNote", e.target.value)}
            className="block w-full rounded border p-2"
          />
        </label>
        {error && <p role="alert">{error}</p>}
      </fieldset>
      <div className="flex gap-4">
        <button type="button" onClick={onCancel} disabled={busy}>
          取消
        </button>
        <button type="submit" disabled={busy || needsRebase}>
          {busy ? "保存中…" : "企業情報を保存"}
        </button>
      </div>
    </form>
  );
}
