"use client";
import React, { useState } from "react";
import type { Memo, MemoFields } from "../../lib/workspace/contracts";
import type { CompanyMemoStructured } from "../../lib/structure/schema";
import { memoFieldsSchema } from "../../lib/workspace/schema";
import { isSafeUrl as safeUrl } from "../../lib/workspace/validation";
import {
  buildMarkdownDownloadFileName,
  downloadMarkdownFile,
} from "../../lib/download";
import { MarkdownPreview } from "../MarkdownPreview";
const empty = (): CompanyMemoStructured => ({
  overview: { companyName: "", eventName: "", eventDate: "", speakers: "" },
  facts: [],
  emphasizedPoints: [],
  business: [],
  strengths: [],
  idealCandidate: [],
  impressions: [],
  concerns: [],
  questions: [],
  esPoints: [],
  nextResearch: [],
});
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
const blank: MemoFields = {
  markdown: "",
  structuredContent: null,
  correctedOcr: null,
  event: null,
  adoptedWebSources: [],
  comparisonReason: null,
};
function TabButtons({
  labels,
  selected,
  onSelect,
}: {
  labels: string[];
  selected: number;
  onSelect: (index: number) => void;
}) {
  return (
    <div
      role="tablist"
      aria-label="メモの表示区分"
      className="my-4 flex flex-wrap gap-3"
    >
      {labels.map((label, index) => (
        <button
          key={label}
          type="button"
          role="tab"
          aria-selected={selected === index}
          tabIndex={selected === index ? 0 : -1}
          aria-controls={`memo-panel-${index}`}
          id={`memo-tab-${index}`}
          onClick={() => onSelect(index)}
          onKeyDown={(event) => {
            const keys = ["ArrowLeft", "ArrowRight", "Home", "End"];
            if (!keys.includes(event.key)) return;
            event.preventDefault();
            const buttons =
              event.currentTarget.parentElement?.querySelectorAll<HTMLButtonElement>(
                '[role="tab"]',
              );
            const next =
              event.key === "Home"
                ? 0
                : event.key === "End"
                  ? labels.length - 1
                  : (index +
                      (event.key === "ArrowRight" ? 1 : -1) +
                      labels.length) %
                    labels.length;
            buttons?.[next]?.focus();
          }}
        >
          {label}
        </button>
      ))}
    </div>
  );
}
export function MemoEditor({
  initial,
  onSave = async () => {},
  onChange = () => {},
  onCancel = () => {},
  busy = false,
  error: externalError,
  retained,
  onRestore,
  needsRebase = false,
}: {
  initial?: Memo;
  onSave?: (changes: Partial<MemoFields>) => Promise<void>;
  onChange?: (fields: MemoFields) => void;
  onCancel?: () => void;
  busy?: boolean;
  error?: string;
  retained?: MemoFields;
  onRestore?: () => void;
  needsRebase?: boolean;
}) {
  const [fields, setFields] = useState<MemoFields>(
      initial
        ? {
            markdown: initial.markdown,
            structuredContent: initial.structuredContent,
            correctedOcr: initial.correctedOcr,
            event: initial.event,
            adoptedWebSources: initial.adoptedWebSources,
            comparisonReason: initial.comparisonReason,
          }
        : blank,
    ),
    [tab, setTab] = useState(0),
    [preview, setPreview] = useState(false),
    [error, setError] = useState("");
  const change = (changes: Partial<MemoFields>) => {
    if (needsRebase) return;
    const value = { ...fields, ...changes };
    setFields(value);
    onChange(value);
  };
  const structured = (value: CompanyMemoStructured) =>
    change({ structuredContent: value });
  const save = async (changes: Partial<MemoFields>) => {
    if (busy || needsRebase) return;
    const parsed = memoFieldsSchema.safeParse({ ...fields, ...changes });
    if (!parsed.success) {
      setError(
        "文字数・日付・構造化項目を確認してください。本文は空白だけにできません。",
      );
      return;
    }
    setError("");
    await onSave(initial ? changes : parsed.data);
  };
  return (
    <section className="space-y-4">
      <h2 className="text-xl font-bold">
        {initial ? "保存メモを編集" : "手入力メモを作成"}
      </h2>
      {initial?.origin === "generated" && (
        <p>
          {initial.providerOrigin === "dummy"
            ? "検証用dummyの生成メモ"
            : "生成メモ"}
        </p>
      )}
      {retained && (
        <aside className="rounded border p-3">
          <p>
            保持した未保存入力があります。現在の保存版を確認してから明示的に再編集してください。
          </p>
          <p>保持した本文</p>
          <pre className="break-words whitespace-pre-wrap">
            {retained.markdown}
          </pre>
          <p>保持した比較理由：{retained.comparisonReason ?? "未設定"}</p>
          {retained.structuredContent && (
            <details>
              <summary>保持した比較用項目</summary>
              <p>
                {Object.values(retained.structuredContent.overview).join(
                  " ／ ",
                )}
              </p>
              {groups.map(({ key, label }) => (
                <div key={key}>
                  <h3>{label}</h3>
                  <p className="break-words whitespace-pre-wrap">
                    {retained.structuredContent![key].join("\n") || "未記載"}
                  </p>
                </div>
              ))}
            </details>
          )}
          <button
            type="button"
            data-testid="memo-restore-draft"
            onClick={() => {
              setFields(retained);
              onChange(retained);
              onRestore?.();
            }}
          >
            保持した入力で再編集
          </button>
        </aside>
      )}
      {needsRebase && (
        <p role="status">
          以下は最新の保存内容です。保持した入力で再編集を選ぶまで保存できません。
        </p>
      )}
      <TabButtons
        labels={["本文", "比較用項目", "原文・出典"]}
        selected={tab}
        onSelect={setTab}
      />
      <fieldset data-testid="memo-edit-fields" disabled={needsRebase}>
        <div
          id="memo-panel-0"
          role="tabpanel"
          aria-labelledby="memo-tab-0"
          hidden={tab !== 0}
        >
          <div className="mb-3 flex gap-4">
            <button
              type="button"
              aria-pressed={!preview}
              onClick={() => setPreview(false)}
            >
              編集
            </button>
            <button
              type="button"
              aria-pressed={preview}
              onClick={() => setPreview(true)}
            >
              プレビュー
            </button>
          </div>
          <div hidden={preview}>
            <label>
              本文
              <textarea
                value={fields.markdown}
                onChange={(e) => change({ markdown: e.target.value })}
                rows={16}
                className="block w-full rounded border p-3"
                data-testid="memo-markdown"
              />
            </label>
          </div>
          <div hidden={!preview} aria-label="本文プレビュー">
            <MarkdownPreview markdown={fields.markdown} />
          </div>
          <button
            type="button"
            disabled={busy}
            onClick={() => save({ markdown: fields.markdown })}
          >
            本文を保存
          </button>
          <button
            type="button"
            className="ml-4"
            onClick={() =>
              downloadMarkdownFile(
                fields.markdown,
                buildMarkdownDownloadFileName({
                  companyName: fields.structuredContent?.overview.companyName,
                }),
              )
            }
          >
            Markdownを出力
          </button>
          <p className="text-sm">出力するのは表示・編集中の本文です。</p>
        </div>
        <div
          id="memo-panel-1"
          role="tabpanel"
          aria-labelledby="memo-tab-1"
          hidden={tab !== 1}
        >
          {!fields.structuredContent ? (
            <>
              <p>構造化項目なし。本文から事実や感想を自動で補いません。</p>
              <button type="button" onClick={() => structured(empty())}>
                比較用項目を追加
              </button>
            </>
          ) : (
            <>
              <fieldset className="space-y-3 rounded border p-3">
                <legend>説明会の概要</legend>
                {(
                  [
                    ["companyName", "説明会に記載の企業名"],
                    ["eventName", "イベント名"],
                    ["eventDate", "説明会の日付"],
                    ["speakers", "登壇者"],
                  ] as const
                ).map(([key, label]) => (
                  <label key={key} className="block">
                    {label}
                    <input
                      type={key === "eventDate" ? "date" : "text"}
                      className="block w-full border p-2"
                      value={fields.structuredContent!.overview[key]}
                      onChange={(e) =>
                        structured({
                          ...fields.structuredContent!,
                          overview: {
                            ...fields.structuredContent!.overview,
                            [key]: e.target.value,
                          },
                        })
                      }
                    />
                  </label>
                ))}
              </fieldset>
              {groups.map(({ key, label }) => (
                <fieldset
                  key={key}
                  className="my-4 space-y-2 rounded border p-3"
                >
                  <legend>{label}</legend>
                  {fields.structuredContent![key].map((item, index) => (
                    <div key={index}>
                      <label>
                        {label} {index + 1}
                        <textarea
                          className="block w-full border p-2"
                          value={item}
                          onChange={(e) => {
                            const items = [...fields.structuredContent![key]];
                            items[index] = e.target.value;
                            structured({
                              ...fields.structuredContent!,
                              [key]: items,
                            });
                          }}
                        />
                      </label>
                      <button
                        type="button"
                        onClick={() =>
                          structured({
                            ...fields.structuredContent!,
                            [key]: fields.structuredContent![key].filter(
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
                    disabled={fields.structuredContent![key].length >= 100}
                    onClick={() =>
                      structured({
                        ...fields.structuredContent!,
                        [key]: [...fields.structuredContent![key], ""],
                      })
                    }
                  >
                    {label}を追加
                  </button>
                </fieldset>
              ))}
              <button
                disabled={busy}
                type="button"
                onClick={() =>
                  save({ structuredContent: fields.structuredContent })
                }
              >
                比較用項目を保存
              </button>
            </>
          )}
          <label className="mt-4 block">
            比較理由
            <textarea
              className="block w-full border p-2"
              value={fields.comparisonReason ?? ""}
              onChange={(e) =>
                change({ comparisonReason: e.target.value || null })
              }
            />
          </label>
          <button
            disabled={busy}
            type="button"
            onClick={() => save({ comparisonReason: fields.comparisonReason })}
          >
            比較理由を保存
          </button>
        </div>
        <div
          id="memo-panel-2"
          role="tabpanel"
          aria-labelledby="memo-tab-2"
          hidden={tab !== 2}
        >
          <h3 className="font-bold">訂正OCR原文</h3>
          <pre className="break-words whitespace-pre-wrap">
            {fields.correctedOcr ?? "保存したOCR原文なし"}
          </pre>
          <h3 className="mt-4 font-bold">説明会情報</h3>
          {fields.event ? (
            <dl>
              <dt>企業名</dt>
              <dd>{fields.event.companyName || "未設定"}</dd>
              <dt>イベント名</dt>
              <dd>{fields.event.eventName || "未設定"}</dd>
              <dt>日付</dt>
              <dd>{fields.event.eventDate || "未設定"}</dd>
            </dl>
          ) : (
            <p>説明会情報なし</p>
          )}
          <h3 className="mt-4 font-bold">Web補足（説明会の事実とは別区分）</h3>
          {fields.adoptedWebSources.length === 0 ? (
            <p>採用したWeb補足なし</p>
          ) : (
            fields.adoptedWebSources.map((source) => (
              <article key={source.id} className="my-3 border p-3">
                <h4>{source.category}</h4>
                <p className="whitespace-pre-wrap">{source.content}</p>
                {safeUrl(source.sourceUrl) ? (
                  <a
                    href={source.sourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    出典を開く
                  </a>
                ) : (
                  <p>出典URLは要確認</p>
                )}
                <p>取得日時：{source.fetchedAt}</p>
                <p>
                  {source.confidence === "requires_check"
                    ? "要確認"
                    : `確度：${source.confidence}`}
                </p>
              </article>
            ))
          )}
        </div>
        {(error || externalError) && (
          <p role="alert">{error || externalError}</p>
        )}
      </fieldset>
      <button type="button" onClick={onCancel} disabled={busy}>
        編集を閉じる
      </button>
    </section>
  );
}
