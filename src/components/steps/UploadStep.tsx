import { useRef, useState, type DragEvent } from "react";

import {
  ACCEPTED_FORMATS_LABEL,
  ACCEPTED_IMAGE_MIME_TYPES,
  MAX_IMAGE_SIZE_MB,
  getUploadErrorMessage,
  validateImageFile,
  type SelectedImage,
  type UploadValidationError,
} from "../../lib/upload";
import { Button } from "../Button";

interface UploadStepProps {
  selectedImage: SelectedImage | null;
  onSelectImage: (image: SelectedImage) => void;
  onNext: () => void;
}

export function UploadStep({
  selectedImage,
  onSelectImage,
  onNext,
}: UploadStepProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<UploadValidationError | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const openFilePicker = () => inputRef.current?.click();

  const handleFiles = (files: FileList | null) => {
    const file = files?.[0];
    if (!file) {
      return;
    }
    const validationError = validateImageFile(file);
    if (validationError) {
      setError(validationError);
      return;
    }
    setError(null);
    onSelectImage({ file, previewUrl: URL.createObjectURL(file) });
  };

  const handleDragOver = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (event: DragEvent<HTMLDivElement>) => {
    // 子要素間の移動で leave が発火してハイライトがチラつくのを防ぐ
    if (event.currentTarget.contains(event.relatedTarget as Node | null)) {
      return;
    }
    setIsDragging(false);
  };

  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(false);
    handleFiles(event.dataTransfer.files);
  };

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
      {error && (
        <p
          role="alert"
          className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600"
        >
          {getUploadErrorMessage(error)}
        </p>
      )}
      <label htmlFor="memo-image-input" className="sr-only">
        メモ画像を選択
      </label>
      <input
        ref={inputRef}
        id="memo-image-input"
        type="file"
        accept={ACCEPTED_IMAGE_MIME_TYPES.join(",")}
        className="sr-only"
        onChange={(event) => {
          handleFiles(event.target.files);
          event.target.value = "";
        }}
      />
      {selectedImage ? (
        <div className="space-y-4 rounded-lg border border-slate-200 bg-white p-4">
          {/* プレビューは blob URL のため next/image の最適化対象外 */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={selectedImage.previewUrl}
            alt="アップロードしたメモ画像"
            className="mx-auto max-h-80 rounded-lg"
          />
          <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm break-all text-slate-600">
              {selectedImage.file.name}
            </p>
            <Button variant="secondary" onClick={openFilePicker}>
              別の画像を選択
            </Button>
          </div>
        </div>
      ) : (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`flex flex-col items-center gap-3 rounded-lg border-2 border-dashed bg-white px-6 py-10 text-center ${
            isDragging ? "border-teal-700" : "border-slate-300"
          }`}
        >
          <p className="text-base text-slate-600">
            ここに画像をドラッグ&ドロップ、またはファイルを選択してください。
          </p>
          <p className="text-sm text-slate-500">
            対応形式: {ACCEPTED_FORMATS_LABEL}(最大 {MAX_IMAGE_SIZE_MB}MB)
          </p>
          <Button variant="secondary" onClick={openFilePicker}>
            ファイルを選択
          </Button>
        </div>
      )}
      <div className="flex justify-end">
        <Button onClick={onNext} disabled={!selectedImage}>
          OCR を実行する
        </Button>
      </div>
    </section>
  );
}
