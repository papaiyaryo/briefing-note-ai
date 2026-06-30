import { type SelectedImage } from "../../lib/upload";
import { Button } from "../Button";
import { ErrorNotice } from "../ErrorNotice";

interface OcrReviewStepProps {
  selectedImages: SelectedImage[];
  ocrText: string;
  onChangeOcrText: (text: string) => void;
  hasOcrError: boolean;
  ocrErrorMessage: string;
  isOcrRunning: boolean;
  isGeneratingMarkdown: boolean;
  onBack: () => void;
  onRetryOcr: () => void;
  onNext: () => void;
}

export function OcrReviewStep({
  selectedImages,
  ocrText,
  onChangeOcrText,
  hasOcrError,
  ocrErrorMessage,
  isOcrRunning,
  isGeneratingMarkdown,
  onBack,
  onRetryOcr,
  onNext,
}: OcrReviewStepProps) {
  const isOcrTextEmpty = ocrText.trim() === "";
  const isBusy = isOcrRunning || isGeneratingMarkdown;

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
      {hasOcrError && (
        <ErrorNotice>
          {ocrErrorMessage ||
            "OCR に失敗しました。画像が暗い、ぼやけている、文字が小さい可能性があります。OCR を再実行するか、アップロードに戻って画像を選び直してください。"}
        </ErrorNotice>
      )}
      <div className="flex flex-col gap-6 md:flex-row">
        <div className="md:w-56 md:shrink-0">
          {selectedImages.length > 0 ? (
            <ul className="flex gap-3 overflow-x-auto md:max-h-96 md:flex-col md:overflow-y-auto md:overflow-x-hidden">
              {selectedImages.map((image, index) => (
                <li key={image.id} className="flex min-w-40 flex-col gap-1">
                  {selectedImages.length > 1 && (
                    <span className="text-xs font-medium text-slate-500">
                      ページ {index + 1}
                    </span>
                  )}
                  {/* プレビューは blob URL のため next/image の最適化対象外 */}
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={image.previewUrl}
                    alt={`アップロードしたメモ画像 ${index + 1}`}
                    className="h-40 w-full rounded-lg border border-slate-200 object-contain md:h-auto md:max-h-72"
                  />
                </li>
              ))}
            </ul>
          ) : (
            <div className="flex h-40 items-center justify-center rounded-lg border border-slate-200 bg-slate-100 md:h-80">
              <p className="px-3 text-center text-sm text-slate-500">
                画像が選択されていません
              </p>
            </div>
          )}
        </div>
        <div className="flex flex-1 flex-col gap-2">
          <label
            htmlFor="ocr-result-text"
            className="text-sm font-medium text-slate-900"
          >
            OCR 結果
          </label>
          <textarea
            id="ocr-result-text"
            value={ocrText}
            onChange={(event) => onChangeOcrText(event.target.value)}
            disabled={isBusy}
            placeholder="OCR 結果がここに表示されます"
            className="h-72 w-full resize-y rounded-lg border border-slate-200 bg-white p-3 font-mono text-sm leading-relaxed text-slate-900 focus-visible:border-teal-700 focus-visible:ring-2 focus-visible:ring-teal-700 md:h-96"
          />
          {isOcrTextEmpty && (
            <p className="text-sm text-slate-500">
              OCR
              結果が空です。テキストを直接入力するか、画像を選び直してください。
            </p>
          )}
        </div>
      </div>
      <div className="flex flex-col gap-3 sm:flex-row sm:justify-between">
        <div className="flex flex-col gap-3 sm:flex-row">
          <Button variant="secondary" onClick={onBack} disabled={isBusy}>
            アップロードに戻る
          </Button>
          <Button variant="secondary" onClick={onRetryOcr} disabled={isBusy}>
            {isOcrRunning ? "OCR を再実行しています…" : "OCR を再実行"}
          </Button>
        </div>
        <Button onClick={onNext} disabled={isOcrTextEmpty || isBusy}>
          {isGeneratingMarkdown
            ? "Markdown を生成しています…"
            : "Markdown を生成する"}
        </Button>
      </div>
    </section>
  );
}
