"use client";

import { useEffect, useMemo, useState } from "react";

import { Button } from "../Button";
import {
  COMPARISON_POINTS,
  INTEREST_LEVEL_LABELS,
  type InterestLevel,
  loadSavedCompanyMemos,
  type SavedCompanyMemo,
  toComparisonMarkdown,
  updateInterestNote,
} from "../../lib/comparison";
import { downloadMarkdownFile } from "../../lib/download";

export function CompanyComparePage() {
  const [memos, setMemos] = useState<SavedCompanyMemo[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  useEffect(() => {
    const loaded = loadSavedCompanyMemos();
    setMemos(loaded);
    setSelectedIds(loaded.slice(0, 3).map((item) => item.id));
  }, []);

  const selectedMemos = useMemo(
    () => memos.filter((memo) => selectedIds.includes(memo.id)),
    [memos, selectedIds],
  );
  const comparisonMarkdown = useMemo(
    () => toComparisonMarkdown(selectedMemos),
    [selectedMemos],
  );

  const toggleSelected = (id: string) => {
    setSelectedIds((current) =>
      current.includes(id)
        ? current.filter((item) => item !== id)
        : [...current, id],
    );
  };

  const changeInterest = (
    memo: SavedCompanyMemo,
    next: Partial<SavedCompanyMemo["interestNote"]>,
  ) => {
    const updated = updateInterestNote(memo.id, {
      ...memo.interestNote,
      ...next,
    });
    setMemos(updated);
  };

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-8">
      <header className="space-y-2">
        <p className="text-sm font-bold text-teal-700">Phase 9</p>
        <h1 className="text-3xl font-bold text-slate-900">企業比較テーブル</h1>
        <p className="text-sm text-slate-600">
          保存済みの企業メモを選び、同じ観点で強み・懸念・自分との接点を比較します。
          Web 補足情報は混在させず、志望度メモはユーザー編集情報として扱います。
        </p>
      </header>

      <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-bold text-slate-900">比較するメモを選択</h2>
        {memos.length === 0 ? (
          <p className="mt-3 text-sm text-slate-500">
            保存済みメモがありません。Markdown
            編集画面で「比較用に保存」を押してください。
          </p>
        ) : (
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {memos.map((memo) => (
              <label
                key={memo.id}
                className="flex gap-3 rounded-lg border border-slate-200 p-3 text-sm"
              >
                <input
                  type="checkbox"
                  checked={selectedIds.includes(memo.id)}
                  onChange={() => toggleSelected(memo.id)}
                  className="mt-1"
                />
                <span>
                  <span className="block font-bold text-slate-900">
                    {memo.memo.overview.companyName || "要確認"}
                  </span>
                  <span className="text-slate-500">
                    {memo.memo.overview.eventName || "イベント名未入力"}
                  </span>
                </span>
              </label>
            ))}
          </div>
        )}
      </section>

      {selectedMemos.length > 0 && (
        <>
          <section className="overflow-x-auto rounded-lg border border-slate-200 bg-white shadow-sm">
            <table className="min-w-full border-collapse text-left text-sm">
              <thead className="bg-slate-50">
                <tr>
                  <th className="border-b border-slate-200 p-3">比較観点</th>
                  {selectedMemos.map((memo) => (
                    <th key={memo.id} className="border-b border-slate-200 p-3">
                      {memo.memo.overview.companyName || "要確認"}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {COMPARISON_POINTS.map((point) => (
                  <tr key={point.key}>
                    <th className="w-48 border-t border-slate-100 p-3 align-top text-slate-900">
                      {point.label}
                    </th>
                    {selectedMemos.map((memo) => (
                      <td
                        key={memo.id}
                        className="min-w-64 border-t border-slate-100 p-3 align-top text-slate-600"
                      >
                        <ul className="list-disc space-y-1 pl-5">
                          {(memo.memo[point.key].filter(Boolean).length > 0
                            ? memo.memo[point.key]
                            : ["要確認"]
                          ).map((item, index) => (
                            <li key={index}>{item}</li>
                          ))}
                        </ul>
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </section>

          <section className="grid gap-4 md:grid-cols-2">
            {selectedMemos.map((memo) => (
              <div
                key={memo.id}
                className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm"
              >
                <h2 className="font-bold text-slate-900">
                  {memo.memo.overview.companyName || "要確認"}
                </h2>
                <label className="mt-3 block text-sm font-medium text-slate-900">
                  志望度
                  <select
                    value={memo.interestNote.level}
                    onChange={(event) =>
                      changeInterest(memo, {
                        level: event.target.value as InterestLevel,
                      })
                    }
                    className="mt-1 w-full rounded-lg border border-slate-200 p-2"
                  >
                    {Object.entries(INTEREST_LEVEL_LABELS).map(
                      ([value, label]) => (
                        <option key={value} value={value}>
                          {label}
                        </option>
                      ),
                    )}
                  </select>
                </label>
                <label className="mt-3 block text-sm font-medium text-slate-900">
                  志望度メモ
                  <textarea
                    value={memo.interestNote.memo}
                    onChange={(event) =>
                      changeInterest(memo, { memo: event.target.value })
                    }
                    className="mt-1 h-28 w-full rounded-lg border border-slate-200 p-2"
                    placeholder="志望理由、懸念、次に確認することを書く"
                  />
                </label>
              </div>
            ))}
          </section>

          <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <h2 className="text-lg font-bold text-slate-900">
                Markdown 出力
              </h2>
              <Button
                onClick={() =>
                  downloadMarkdownFile(
                    comparisonMarkdown,
                    "company-comparison.md",
                  )
                }
              >
                比較結果を .md でダウンロード
              </Button>
            </div>
            <textarea
              readOnly
              value={comparisonMarkdown}
              className="mt-4 h-72 w-full rounded-lg border border-slate-200 bg-slate-50 p-3 font-mono text-sm"
            />
          </section>
        </>
      )}
    </div>
  );
}
