import { useRef, useState, type DragEvent } from "react";

import {
  ACCEPTED_FORMATS_LABEL,
  ACCEPTED_IMAGE_MIME_TYPES,
  MAX_IMAGES,
  MAX_IMAGE_SIZE_MB,
  getUploadErrorMessage,
  validateImageFiles,
  type SelectedImage,
  type UploadValidationError,
} from "../../lib/upload";
import { type CompanyEventInfo } from "../../lib/markdown";
import { Button } from "../Button";
import { ErrorNotice } from "../ErrorNotice";

const textInputClassName =
  "w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-slate-900 focus-visible:border-teal-700 focus-visible:ring-2 focus-visible:ring-teal-700";

interface UploadStepProps {
  selectedImages: SelectedImage[];
  onAddImages: (images: SelectedImage[]) => void;
  onRemoveImage: (id: string) => void;
  companyEventInfo: CompanyEventInfo;
  onChangeCompanyEventInfo: (info: CompanyEventInfo) => void;
  isOcrRunning: boolean;
  ocrProgressLabel: string;
  onNext: () => void;
  onSimulateOcrFailure: () => void;
}

function createImageId(): string {
  return crypto.randomUUID();
}

export function UploadStep({
  selectedImages,
  onAddImages,
  onRemoveImage,
  companyEventInfo,
  onChangeCompanyEventInfo,
  isOcrRunning,
  ocrProgressLabel,
  onNext,
  onSimulateOcrFailure,
}: UploadStepProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<UploadValidationError | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const hasSelectedImages = selectedImages.length > 0;
  const openFilePicker = () => inputRef.current?.click();

  const handleFiles = (files: FileList | null) => {
    // OCR 実行中の差し替えは、実行中の処理との不整合を生むため受け付けない
    if (isOcrRunning || !files || files.length === 0) {
      return;
    }

    const incoming = Array.from(files);
    const { results, tooMany } = validateImageFiles(
      incoming,
      selectedImages.length,
    );
    const firstError =
      results.find((result) => result.error)?.error ??
      (tooMany ? "too-many-files" : null);

    setError(firstError);
    if (firstError) {
      return;
    }

    onAddImages(
      incoming.map((file) => ({
        id: createImageId(),
        file,
        previewUrl: URL.createObjectURL(file),
      })),
    );
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
          紙の企業説明会メモを撮影した画像を複数枚選択できます。
        </p>
      </div>
      {error && <ErrorNotice>{getUploadErrorMessage(error)}</ErrorNotice>}
      <label htmlFor="memo-image-input" className="sr-only">
        メモ画像を選択
      </label>
      <input
        ref={inputRef}
        id="memo-image-input"
        type="file"
        multiple
        accept={ACCEPTED_IMAGE_MIME_TYPES.join(",")}
        className="sr-only"
        onChange={(event) => {
          handleFiles(event.target.files);
          event.target.value = "";
        }}
      />
      {hasSelectedImages ? (
        <div className="space-y-4 rounded-lg border border-slate-200 bg-white p-4">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm font-medium text-slate-900">
              選択済み画像 {selectedImages.length} / {MAX_IMAGES} 枚
            </p>
            <Button
              variant="secondary"
              onClick={openFilePicker}
              disabled={isOcrRunning}
            >
              画像を追加
            </Button>
          </div>
          <ul className="space-y-2">
            {selectedImages.map((image, index) => (
              <li
                key={image.id}
                className="flex items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 p-3"
              >
                <span className="w-7 shrink-0 text-center text-sm font-semibold text-slate-500">
                  {index + 1}
                </span>
                {/* プレビューは blob URL のため next/image の最適化対象外 */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={image.previewUrl}
                  alt={`ページ ${index + 1}: ${image.file.name}`}
                  className="h-16 w-16 shrink-0 rounded border border-slate-200 bg-white object-contain"
                />
                <p className="min-w-0 flex-1 break-all text-sm text-slate-600">
                  {image.file.name}
                </p>
                <button
                  type="button"
                  onClick={() => onRemoveImage(image.id)}
                  disabled={isOcrRunning}
                  aria-label={`ページ ${index + 1} を削除`}
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded text-lg leading-none text-slate-400 hover:text-red-600 focus-visible:ring-2 focus-visible:ring-red-600 disabled:opacity-40"
                >
                  ×
                </button>
              </li>
            ))}
          </ul>
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
            対応形式: {ACCEPTED_FORMATS_LABEL}(最大 {MAX_IMAGE_SIZE_MB}MB、
            {MAX_IMAGES} 枚まで)
          </p>
          <Button
            variant="secondary"
            onClick={openFilePicker}
            disabled={isOcrRunning}
          >
            ファイルを選択
          </Button>
        </div>
      )}
      <fieldset className="space-y-4">
        <legend className="text-sm font-medium text-slate-900">
          企業・説明会情報(任意)
        </legend>
        <p className="text-sm text-slate-500">
          Markdown
          生成に使います。未入力の項目は「要確認」として出力され、未入力のままでも先に進めます。
        </p>
        <div className="space-y-1">
          <label
            htmlFor="company-name-input"
            className="text-sm font-medium text-slate-900"
          >
            企業名
          </label>
          <input
            id="company-name-input"
            type="text"
            value={companyEventInfo.companyName}
            onChange={(event) =>
              onChangeCompanyEventInfo({
                ...companyEventInfo,
                companyName: event.target.value,
              })
            }
            placeholder="例: サンプル株式会社"
            className={textInputClassName}
          />
        </div>
        <div className="space-y-1">
          <label
            htmlFor="event-name-input"
            className="text-sm font-medium text-slate-900"
          >
            イベント名
          </label>
          <input
            id="event-name-input"
            type="text"
            value={companyEventInfo.eventName}
            onChange={(event) =>
              onChangeCompanyEventInfo({
                ...companyEventInfo,
                eventName: event.target.value,
              })
            }
            placeholder="例: 夏季インターン説明会"
            className={textInputClassName}
          />
        </div>
        <div className="space-y-1">
          <label
            htmlFor="event-date-input"
            className="text-sm font-medium text-slate-900"
          >
            説明会日
          </label>
          <input
            id="event-date-input"
            type="date"
            value={companyEventInfo.eventDate}
            onChange={(event) =>
              onChangeCompanyEventInfo({
                ...companyEventInfo,
                eventDate: event.target.value,
              })
            }
            className={textInputClassName}
          />
        </div>
      </fieldset>
      <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
        <Button
          variant="secondary"
          onClick={onSimulateOcrFailure}
          disabled={!hasSelectedImages || isOcrRunning}
        >
          失敗状態を確認
        </Button>
        <Button onClick={onNext} disabled={!hasSelectedImages || isOcrRunning}>
          {isOcrRunning
            ? ocrProgressLabel || "OCR を実行しています…"
            : "OCR を実行する"}
        </Button>
      </div>
    </section>
  );
}
