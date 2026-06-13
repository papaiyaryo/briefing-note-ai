import { useState } from "react";

import { Button } from "../Button";
import { MarkdownPreview } from "../MarkdownPreview";

type EditorTab = "edit" | "preview";

interface MarkdownEditStepProps {
  markdownText: string;
  onChangeMarkdownText: (text: string) => void;
  onBack: () => void;
}

export function MarkdownEditStep({
  markdownText,
  onChangeMarkdownText,
  onBack,
}: MarkdownEditStepProps) {
  const [activeTab, setActiveTab] = useState<EditorTab>("edit");
  const isMarkdownEmpty = markdownText.trim() === "";

  const tabClassName = (tab: EditorTab) =>
    `px-1 pb-2 text-sm focus-visible:ring-2 focus-visible:ring-teal-700 focus-visible:ring-offset-2 ${
      activeTab === tab
        ? "border-b-2 border-teal-700 font-bold text-teal-700"
        : "text-slate-500"
    }`;

  return (
    <section aria-labelledby="markdown-step-heading" className="space-y-6">
      <div className="space-y-1">
        <h2
          id="markdown-step-heading"
          className="text-xl font-bold text-slate-900"
        >
          Markdown を編集してダウンロード
        </h2>
        <p className="text-sm text-slate-500">
          生成された企業メモを自分用に整え、.md としてダウンロードします。
        </p>
      </div>
      {/* タブは狭い画面用。md 以上では編集とプレビューを同時に表示する */}
      <div className="flex gap-4 border-b border-slate-200 md:hidden">
        <button
          type="button"
          onClick={() => setActiveTab("edit")}
          className={tabClassName("edit")}
        >
          編集
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("preview")}
          className={tabClassName("preview")}
        >
          プレビュー
        </button>
      </div>
      <div className="flex flex-col gap-6 md:flex-row">
        <div
          className={`flex-1 flex-col gap-2 ${
            activeTab === "edit" ? "flex" : "hidden md:flex"
          }`}
        >
          <label
            htmlFor="markdown-editor"
            className="text-sm font-medium text-slate-900"
          >
            Markdown
          </label>
          <textarea
            id="markdown-editor"
            value={markdownText}
            onChange={(event) => onChangeMarkdownText(event.target.value)}
            placeholder="Markdown がここに表示されます"
            className="h-96 w-full resize-y rounded-lg border border-slate-200 bg-white p-3 font-mono text-sm leading-relaxed text-slate-900 focus-visible:border-teal-700 focus-visible:ring-2 focus-visible:ring-teal-700"
          />
        </div>
        <div
          className={`min-w-0 flex-1 flex-col gap-2 ${
            activeTab === "preview" ? "flex" : "hidden md:flex"
          }`}
        >
          <p className="text-sm font-medium text-slate-900">プレビュー</p>
          <div className="h-96 overflow-y-auto rounded-lg border border-slate-200 bg-white p-4">
            <MarkdownPreview markdown={markdownText} />
          </div>
        </div>
      </div>
      {isMarkdownEmpty && (
        <p className="text-sm text-slate-500">
          内容が空のためダウンロードできません。Markdown を入力してください。
        </p>
      )}
      <div className="flex flex-col gap-3 sm:flex-row sm:justify-between">
        <Button variant="secondary" onClick={onBack}>
          OCR 確認に戻る
        </Button>
        {/* ダウンロード処理は Phase 4 で接続するため、配置のみ用意して disabled にする */}
        <Button disabled>.md をダウンロード</Button>
      </div>
    </section>
  );
}
