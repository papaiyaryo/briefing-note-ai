import { Button } from "../Button";

interface OcrReviewStepProps {
  onBack: () => void;
  onNext: () => void;
}

export function OcrReviewStep({ onBack, onNext }: OcrReviewStepProps) {
  return (
    <section aria-labelledby="ocr-step-heading" className="space-y-6">
      <div className="space-y-1">
        <h2 id="ocr-step-heading" className="text-xl font-bold text-slate-900">
          OCR 結果を確認
        </h2>
        <p className="text-sm text-slate-500">
          画像から読み取ったテキストを確認し、必要なら修正してから Markdown
          生成に進みます。
        </p>
      </div>
      <div className="flex flex-col gap-6 md:flex-row">
        <div className="flex h-40 items-center justify-center rounded-lg border border-slate-200 bg-slate-100 md:h-auto md:w-56 md:shrink-0">
          <p className="text-sm text-slate-500">画像プレビュー(準備中)</p>
        </div>
        <div className="flex min-h-40 flex-1 items-center justify-center rounded-lg border border-slate-200 bg-white p-3">
          <p className="text-sm text-slate-500">
            OCR 結果の表示機能は準備中です。
          </p>
        </div>
      </div>
      <div className="flex flex-col gap-3 sm:flex-row sm:justify-between">
        <Button variant="secondary" onClick={onBack}>
          アップロードに戻る
        </Button>
        <Button onClick={onNext}>Markdown を生成する</Button>
      </div>
    </section>
  );
}
