"use client";
import React, { useRef } from "react";
import type { BoardSnapshot } from "../../lib/workspace/contracts";
import { hasActiveWarning, statusLabels } from "../../lib/workspace/board";
import { selectionStatuses } from "../../lib/workspace/schema";
export function CompanyBoard({
  snapshot,
  error,
  onToggle = () => {},
  onCreate = () => {},
  onOpen = () => {},
}: {
  snapshot?: BoardSnapshot;
  error?: string;
  onToggle?: () => void;
  onCreate?: () => void;
  onOpen?: (id: string) => void;
}) {
  const region = useRef<HTMLDivElement>(null);
  if (error) return <p role="alert">{error}</p>;
  if (!snapshot) return <p role="status">企業を取得しています…</p>;
  const statuses = selectionStatuses.filter(
    (s) => snapshot.showEnded || !["withdrawn", "rejected"].includes(s),
  );
  return (
    <section>
      <h1 tabIndex={-1} className="text-2xl font-bold">
        企業ボード
      </h1>
      <p className="my-3">
        保存 {snapshot.savedCompanyCount}社 ／ 表示{" "}
        {snapshot.visibleCompanyCount}社 ／ 対応中 {snapshot.activeCompanyCount}
        社
      </p>
      <p>対応中の目安は5〜15社です。</p>
      {hasActiveWarning(snapshot.activeCompanyCount) && (
        <p role="status" className="font-bold text-amber-900">
          対応中が15社以上です。応募先の優先順位を確認しましょう。
        </p>
      )}
      <div className="my-4 flex flex-wrap gap-4">
        <button onClick={onCreate} data-testid="create-company">
          企業を登録
        </button>
        <button
          onClick={onToggle}
          aria-controls="company-columns"
          aria-expanded={snapshot.showEnded}
        >
          {snapshot.showEnded ? "終了した企業を隠す" : "終了した企業を表示"}
        </button>
        <button
          onClick={() =>
            region.current?.scrollBy({ left: -320, behavior: "smooth" })
          }
          aria-label="ボードを左へ移動"
        >
          ← 左へ
        </button>
        <button
          onClick={() =>
            region.current?.scrollBy({ left: 320, behavior: "smooth" })
          }
          aria-label="ボードを右へ移動"
        >
          右へ →
        </button>
      </div>
      <p aria-live="polite">
        {snapshot.showEnded
          ? "終了した企業を含め8状態を表示"
          : "通常の6状態を表示"}
      </p>
      {snapshot.savedCompanyCount === 0 ? (
        <p>企業はまだ保存されていません。</p>
      ) : snapshot.visibleCompanyCount === 0 ? (
        <p>表示対象の企業がありません。終了した企業を表示できます。</p>
      ) : null}
      <div
        ref={region}
        id="company-columns"
        role="region"
        aria-label="選考状態ごとの企業"
        tabIndex={0}
        className="grid grid-cols-1 gap-4 md:flex md:overflow-x-auto"
      >
        {statuses.map((status) => (
          <section
            key={status}
            data-status={status}
            className="min-w-64 flex-1 rounded-xl border border-slate-200 bg-slate-50 p-3"
          >
            <h2 className="font-bold">
              {statusLabels[status]} {snapshot.countsByStatus[status]}社
            </h2>
            <ul>
              {snapshot.cards
                .filter((card) => card.selectionStatus === status)
                .map((card) => (
                  <li
                    key={card.companyId}
                    className="my-3 break-words rounded-lg border bg-white p-3"
                  >
                    <a
                      href={`/companies/${card.companyId}`}
                      onClick={(event) => {
                        event.preventDefault();
                        onOpen(card.companyId);
                      }}
                      className="font-semibold underline"
                    >
                      {card.name}
                    </a>
                    <div className="my-3 border-y py-2">
                      <p>次の選考日</p>
                      <p className="text-[25px] font-bold">
                        {card.nextSelectionDate ?? "未設定"}
                      </p>
                    </div>
                    <p>応募締切：{card.applicationDeadline ?? "未設定"}</p>
                    <p>
                      {card.industry ?? "業界未設定"} ／ 志望度{" "}
                      {card.interestLevel ?? "未設定"}
                    </p>
                    <p>保存メモ {card.memoCount}件</p>
                  </li>
                ))}
            </ul>
          </section>
        ))}
      </div>
    </section>
  );
}
