import { Button } from "../Button";

interface MarkdownEditStepProps {
  onBack: () => void;
}

export function MarkdownEditStep({ onBack }: MarkdownEditStepProps) {
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
      <div className="flex flex-col gap-6 md:flex-row">
        <div className="flex min-h-40 flex-1 items-center justify-center rounded-lg border border-slate-200 bg-white p-3">
          <p className="text-sm text-slate-500">
            Markdown エディタは準備中です。
          </p>
        </div>
        <div className="hidden min-h-40 flex-1 items-center justify-center rounded-lg border border-slate-200 bg-white p-4 md:flex">
          <p className="text-sm text-slate-500">プレビューは準備中です。</p>
        </div>
      </div>
      <div className="flex flex-col gap-3 sm:flex-row sm:justify-between">
        <Button variant="secondary" onClick={onBack}>
          OCR 確認に戻る
        </Button>
        <Button disabled>.md をダウンロード</Button>
      </div>
    </section>
  );
}
