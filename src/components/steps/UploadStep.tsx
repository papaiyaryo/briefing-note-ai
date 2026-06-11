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
import { type CompanyEventInfo } from "../../lib/markdown";
import { Button } from "../Button";
import { ErrorNotice } from "../ErrorNotice";

const textInputClassName =
  "w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-slate-900 focus-visible:border-teal-700 focus-visible:ring-2 focus-visible:ring-teal-700";

interface UploadStepProps {
  selectedImage: SelectedImage | null;
  onSelectImage: (image: SelectedImage) => void;
  companyEventInfo: CompanyEventInfo;
  onChangeCompanyEventInfo: (info: CompanyEventInfo) => void;
  isOcrRunning: boolean;
  onNext: () => void;
}

export function UploadStep({
  selectedImage,
  onSelectImage,
  companyEventInfo,
  onChangeCompanyEventInfo,
  isOcrRunning,
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
      {error && <ErrorNotice>{getUploadErrorMessage(error)}</ErrorNotice>}
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
      <div className="flex justify-end">
        <Button onClick={onNext} disabled={!selectedImage || isOcrRunning}>
          {isOcrRunning ? "OCR を実行しています…" : "OCR を実行する"}
        </Button>
      </div>
    </section>
  );
}
