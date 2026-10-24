"use client";
import type { GeneratedCandidate } from "../../lib/workspace/contracts";
import type { CompanyMemoStructured } from "../../lib/structure/schema";
import { isSafeUrl } from "../../lib/workspace/validation";
import {
  buildMarkdownDownloadFileName,
  downloadMarkdownFile,
} from "../../lib/download";
import { MarkdownPreview } from "../MarkdownPreview";
export interface GenerationCandidateFieldsProps {
  value: GeneratedCandidate;
  onChange: (value: GeneratedCandidate) => void;
  disabled?: boolean;
}
const groups: {
  key: Exclude<keyof CompanyMemoStructured, "overview">;
  label: string;
}[] = [
  { key: "facts", label: "説明会の事実" },
  { key: "emphasizedPoints", label: "人事・社員の強調点" },
  { key: "business", label: "事業内容" },
  { key: "strengths", label: "強み" },
  { key: "idealCandidate", label: "求める人物像" },
  { key: "impressions", label: "個人の感想" },
  { key: "concerns", label: "懸念" },
  { key: "questions", label: "追加質問" },
  { key: "esPoints", label: "ES・面接材料" },
  { key: "nextResearch", label: "次に調べること" },
];
export function GenerationCandidateFields({
  value,
  onChange,
  disabled = false,
}: GenerationCandidateFieldsProps) {
  const update = (changes: Partial<GeneratedCandidate>) =>
    onChange({ ...value, ...changes });
  const structure = (structuredContent: CompanyMemoStructured) =>
    update({ structuredContent });
  return (
    <section aria-label="生成候補の確認と編集" className="min-w-0 space-y-5">
      <p>
        本文と構造化項目は別の正本です。片方の編集で他方を自動書換しません。
      </p>
      <fieldset disabled={disabled} className="min-w-0 space-y-4">
        <legend className="font-bold">保存する候補</legend>
        <label className="block">
          保存本文
          <textarea
            data-testid="generation-markdown"
            className="block w-full min-w-0 rounded border p-3"
            rows={12}
            value={value.markdown}
            onChange={(e) => update({ markdown: e.target.value })}
          />
        </label>
        <div aria-label="候補本文プレビュー" className="min-w-0 break-words">
          <MarkdownPreview markdown={value.markdown} />
        </div>
        <label className="block">
          訂正OCR原文
          <textarea
            data-testid="generation-corrected-ocr"
            className="block w-full rounded border p-3"
            rows={5}
            value={value.correctedOcr}
            onChange={(e) => update({ correctedOcr: e.target.value })}
          />
        </label>
        <fieldset className="space-y-3 rounded border p-3">
          <legend>説明会情報（保存先の企業名とは別）</legend>
          {(
            [
              ["companyName", "紙に記載の企業名"],
              ["eventName", "イベント名"],
              ["eventDate", "説明会日付（未確認は空欄）"],
            ] as const
          ).map(([key, label]) => (
            <label className="block" key={key}>
              {label}
              <input
                className="block w-full border p-2"
                data-testid={`generation-event-${key}`}
                value={value.event[key]}
                onChange={(e) =>
                  update({ event: { ...value.event, [key]: e.target.value } })
                }
              />
            </label>
          ))}
        </fieldset>
        <fieldset className="space-y-3 rounded border p-3">
          <legend>構造化した概要</legend>
          <p>
            日付の「要確認」は、確認したYYYY-MM-DDまたは空欄へ明示編集してください。本文は保持します。
          </p>
          {(
            [
              ["companyName", "生成結果の企業名"],
              ["eventName", "概要のイベント名"],
              ["eventDate", "概要の日付（未確認は空欄）"],
              ["speakers", "登壇者"],
            ] as const
          ).map(([key, label]) => (
            <label className="block" key={key}>
              {label}
              <input
                className="block w-full border p-2"
                data-testid={`generation-overview-${key}`}
                value={value.structuredContent.overview[key]}
                onChange={(e) =>
                  structure({
                    ...value.structuredContent,
                    overview: {
                      ...value.structuredContent.overview,
                      [key]: e.target.value,
                    },
                  })
                }
              />
            </label>
          ))}
        </fieldset>
        {groups.map(({ key, label }) => (
          <fieldset key={key} className="space-y-3 rounded border p-3">
            <legend>{label}</legend>
            {value.structuredContent[key].map((item, index) => (
              <div key={index}>
                <label className="block">
                  {label} {index + 1}
                  <textarea
                    className="block w-full border p-2"
                    data-testid={`generation-${key}-${index}`}
                    value={item}
                    onChange={(e) => {
                      const items = [...value.structuredContent[key]];
                      items[index] = e.target.value;
                      structure({ ...value.structuredContent, [key]: items });
                    }}
                  />
                </label>
                <button
                  type="button"
                  onClick={() =>
                    structure({
                      ...value.structuredContent,
                      [key]: value.structuredContent[key].filter(
                        (_, i) => i !== index,
                      ),
                    })
                  }
                >
                  {label} {index + 1}を削除
                </button>
              </div>
            ))}
            <button
              type="button"
              disabled={value.structuredContent[key].length >= 100}
              onClick={() =>
                structure({
                  ...value.structuredContent,
                  [key]: [...value.structuredContent[key], ""],
                })
              }
            >
              {label}を追加
            </button>
          </fieldset>
        ))}
        <label className="block">
          比較理由
          <textarea
            className="block w-full border p-2"
            value={value.comparisonReason ?? ""}
            onChange={(e) =>
              update({ comparisonReason: e.target.value || null })
            }
          />
        </label>
        <fieldset className="space-y-3 rounded border p-3">
          <legend>採用Web補足（紙メモ・個人の印象とは別区分）</legend>
          {value.adoptedWebSources.length === 0 ? (
            <p>採用したWeb補足なし</p>
          ) : (
            value.adoptedWebSources.map((source) => (
              <article
                key={source.id}
                className="min-w-0 space-y-2 break-words"
              >
                <h4>{source.category}</h4>
                <p className="whitespace-pre-wrap">{source.content}</p>
                {isSafeUrl(source.sourceUrl) ? (
                  <a
                    href={source.sourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {source.sourceUrl}
                  </a>
                ) : (
                  <p>出典URLは要確認</p>
                )}
                <p>取得日・日時：{source.fetchedAt}</p>
                <p>
                  {source.confidence === "requires_check"
                    ? "要確認"
                    : `確度：${source.confidence}`}
                </p>
                <button
                  type="button"
                  onClick={() =>
                    update({
                      adoptedWebSources: value.adoptedWebSources.filter(
                        (item) => item.id !== source.id,
                      ),
                    })
                  }
                >
                  このWeb補足を採用から外す
                </button>
              </article>
            ))
          )}
        </fieldset>
      </fieldset>
      <button
        type="button"
        disabled={!value.markdown.trim()}
        onClick={() =>
          downloadMarkdownFile(
            value.markdown,
            buildMarkdownDownloadFileName({
              companyName: value.event.companyName,
            }),
          )
        }
      >
        候補の.mdを出力
      </button>
    </section>
  );
}
