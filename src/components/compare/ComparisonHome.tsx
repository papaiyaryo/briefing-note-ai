"use client";
import { useEffect, useRef, useState } from "react";
import { ComparisonSession } from "../../lib/companyComparison/session";
import {
  useOptionalComparisonSession,
  useComparisonRevision,
} from "./ComparisonSessionProvider";
import { ServerCompanyComparison } from "./ServerCompanyComparison";
import { LegacyComparisonBoundary } from "./LegacyComparisonBoundary";
export function ComparisonHome({
  session: provided,
}: {
  session?: ComparisonSession;
}) {
  const context = useOptionalComparisonSession(),
    session = provided ?? context;
  if (!session) throw Error("比較の状態がありません。");
  useComparisonRevision(session);
  const [legacy, setLegacy] = useState(false),
    [confirm, setConfirm] = useState(false),
    heading = useRef<HTMLHeadingElement>(null),
    trigger = useRef<HTMLButtonElement>(null),
    cancel = useRef<HTMLButtonElement>(null),
    dialog = useRef<HTMLDivElement>(null);
  useEffect(() => {
    heading.current?.focus();
  }, [legacy]);
  useEffect(() => {
    if (confirm) cancel.current?.focus();
  }, [confirm]);
  const stay = () => {
    setConfirm(false);
    trigger.current?.focus();
  };
  return (
    <div className="mx-auto min-w-0 max-w-6xl space-y-6">
      <h1
        ref={heading}
        tabIndex={-1}
        data-testid="comparison-heading"
        className="text-2xl font-bold"
      >
        保存した企業を比較
      </h1>
      <p>
        各企業から構造化メモを1つ選びます。企業志望度と選択メモの比較理由は別保存です。
      </p>
      <div className="flex flex-wrap gap-3">
        <button
          data-testid="comparison-server-entry"
          className="rounded border p-3"
          aria-pressed={!legacy}
          onClick={() => setLegacy(false)}
        >
          保存した企業を比較
        </button>
        <button
          ref={trigger}
          data-testid="comparison-legacy-entry"
          className="rounded border p-3"
          aria-pressed={legacy}
          onClick={() => {
            if (session.hasUnsaved()) setConfirm(true);
            else setLegacy(true);
          }}
        >
          このブラウザの旧比較
        </button>
      </div>
      {legacy ? (
        <LegacyComparisonBoundary />
      ) : (
        <ServerCompanyComparison session={session} />
      )}
      {confirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div
            ref={dialog}
            role="dialog"
            aria-modal="true"
            aria-labelledby="comparison-discard-title"
            className="max-h-full w-full max-w-md overflow-auto rounded bg-white p-5"
            onKeyDown={(event) => {
              if (event.key === "Escape") {
                event.preventDefault();
                stay();
              }
              if (event.key === "Tab") {
                const items =
                    dialog.current?.querySelectorAll<HTMLButtonElement>(
                      "button",
                    ),
                  first = items?.[0],
                  last = items?.[items.length - 1];
                if (event.shiftKey && document.activeElement === first) {
                  event.preventDefault();
                  last?.focus();
                } else if (!event.shiftKey && document.activeElement === last) {
                  event.preventDefault();
                  first?.focus();
                }
              }
            }}
          >
            <h2 id="comparison-discard-title" className="font-bold">
              未保存の追加入力を破棄して旧比較へ移動しますか
            </h2>
            <p>
              送信済みの意図と結果不明は保持します。移動してもサーバーの処理は取消しません。
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <button
                ref={cancel}
                data-testid="comparison-stay"
                className="rounded border p-3"
                onClick={stay}
              >
                取消・編集を続ける
              </button>
              <button
                data-testid="comparison-discard"
                className="rounded border p-3"
                onClick={() => {
                  session.discard();
                  setConfirm(false);
                  setLegacy(true);
                }}
              >
                追加入力を破棄して移動
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
