"use client";
import type { ComparisonSnapshot } from "../../lib/workspace/contracts";
import { comparisonRows, originLabel } from "../../lib/companyComparison/model";
import { isSafeUrl } from "../../lib/workspace/validation";
import { INTEREST_LEVEL_LABELS } from "../../lib/comparison";
export function ComparisonTable({
  snapshot,
}: {
  snapshot: ComparisonSnapshot;
}) {
  const rows = comparisonRows(snapshot);
  return (
    <div className="min-w-0 space-y-5 break-words">
      <div
        data-testid="comparison-table-scroll"
        role="region"
        aria-label="保存企業の7観点比較表・横にスクロール可能"
        tabIndex={0}
        className="hidden max-w-full overflow-x-auto rounded border md:block"
      >
        <table className="w-full border-collapse text-left text-sm">
          <caption className="p-3 text-left font-bold">
            選択した保存メモの7観点（未記載は評価ではありません）
          </caption>
          <thead>
            <tr>
              <th scope="col" className="border p-3">
                比較観点
              </th>
              {snapshot.sources.map((s) => (
                <th
                  scope="col"
                  key={s.company.companyId}
                  className="min-w-64 border p-3"
                >
                  {s.company.name}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.key}>
                <th scope="row" className="min-w-40 border p-3 align-top">
                  {row.label}
                </th>
                {row.values.map((items, index) => (
                  <td
                    key={snapshot.sources[index].company.companyId}
                    className="border p-3 align-top"
                  >
                    <ul className="space-y-2">
                      {items.map((item, i) => (
                        <li key={i} className="whitespace-pre-wrap">
                          {item}
                        </li>
                      ))}
                    </ul>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div
        data-testid="comparison-mobile-points"
        className="space-y-5 md:hidden"
      >
        {rows.map((row) => (
          <section key={row.key} className="rounded border p-3">
            <h3 className="font-bold">{row.label}</h3>
            {row.values.map((items, index) => (
              <div
                key={snapshot.sources[index].company.companyId}
                className="mt-3"
              >
                <h4 className="font-semibold">
                  {snapshot.sources[index].company.name}
                </h4>
                <ul className="space-y-2">
                  {items.map((item, i) => (
                    <li key={i} className="whitespace-pre-wrap">
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </section>
        ))}
      </div>
      {snapshot.sources.map(({ company, memo }) => (
        <section key={company.companyId} className="min-w-0 rounded border p-4">
          <h3 className="font-bold">{company.name}の参照と出典</h3>
          <p>{originLabel(memo)}</p>
          <p>保存企業志望度: {company.interestLevel === null ? "未設定" : INTEREST_LEVEL_LABELS[company.interestLevel]}</p>
          <p className="whitespace-pre-wrap">保存メモ比較理由: {memo.comparisonReason ?? "未記載"}</p>
          <p className="text-sm">
            企業ID {company.companyId} / 版 {company.version}
          </p>
          <p className="text-sm">
            選択メモ {memo.memoId} / 版 {memo.version} / 更新 {memo.updatedAt}
          </p>
          <p>
            イベント{" "}
            {memo.event?.eventName ||
              memo.structuredContent.overview.eventName ||
              "未記載"}{" "}
            /{" "}
            {memo.event?.eventDate ||
              memo.structuredContent.overview.eventDate ||
              "未記載"}
          </p>
          <h4 className="mt-3 font-bold">採用Web（紙由来の7観点とは別区分）</h4>
          {memo.adoptedWebSources.length === 0 ? (
            <p>採用Webなし</p>
          ) : (
            <ul className="space-y-3">
              {memo.adoptedWebSources.map((source) => (
                <li key={source.id}>
                  <p className="whitespace-pre-wrap">
                    {source.category}: {source.content}
                  </p>
                  {isSafeUrl(source.sourceUrl) ? (
                    <a
                      data-testid="comparison-source-link"
                      href={new URL(source.sourceUrl).href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="break-all underline"
                    >
                      {source.sourceUrl}
                    </a>
                  ) : (
                    <span>不正な出典URL</span>
                  )}
                  <p>
                    取得日時 {source.fetchedAt} / id {source.id} / confidence{" "}
                    {source.confidence} / {source.status}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </section>
      ))}
    </div>
  );
}
