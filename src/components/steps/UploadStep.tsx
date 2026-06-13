import { Button } from "../Button";

interface UploadStepProps {
  onNext: () => void;
}

export function UploadStep({ onNext }: UploadStepProps) {
  return (
    <section aria-labelledby="upload-step-heading" className="space-y-6">
      <div className="space-y-1">
        <h2
          id="upload-step-heading"
          className="text-xl font-bold text-slate-900"
        >
          メモ画像をアップロード
        </h2>
        <p className="text-sm text-slate-500">
          紙の企業説明会メモを撮影した画像を 1 枚選択します。
        </p>
      </div>
      <div className="rounded-lg border-2 border-dashed border-slate-300 bg-white px-6 py-10 text-center">
        <p className="text-base text-slate-600">
          画像アップロード機能は準備中です。
        </p>
        <p className="mt-2 text-sm text-slate-500">
          対応形式: PNG / JPG / JPEG / WebP
        </p>
      </div>
      <div className="flex justify-end">
        <Button onClick={onNext}>OCR を実行する</Button>
      </div>
    </section>
  );
}
