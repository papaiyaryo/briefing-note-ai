"use client";

import { useEffect, useState } from "react";

import {
  getNextStepId,
  getPreviousStepId,
  type StepId,
} from "../lib/flow";
import { type SelectedImage } from "../lib/upload";
import { StepIndicator } from "./StepIndicator";
import { MarkdownEditStep } from "./steps/MarkdownEditStep";
import { OcrReviewStep } from "./steps/OcrReviewStep";
import { UploadStep } from "./steps/UploadStep";

export function BriefingNoteFlow() {
  const [currentStepId, setCurrentStepId] = useState<StepId>("upload");
  const [selectedImage, setSelectedImage] = useState<SelectedImage | null>(
    null,
  );
  const [ocrText, setOcrText] = useState("");

  // 画像の差し替え時とアンマウント時に、古いプレビュー URL を解放する
  useEffect(() => {
    const previewUrl = selectedImage?.previewUrl;
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [selectedImage]);

  const goNext = () =>
    setCurrentStepId((stepId) => getNextStepId(stepId) ?? stepId);
  const goBack = () =>
    setCurrentStepId((stepId) => getPreviousStepId(stepId) ?? stepId);

  // 画像を差し替えたら、前の画像に対する OCR 結果は無効になるためクリアする
  const handleSelectImage = (image: SelectedImage) => {
    if (selectedImage) {
      setOcrText("");
    }
    setSelectedImage(image);
  };

  const cardMaxWidth =
    currentStepId === "markdown" ? "max-w-5xl" : "max-w-3xl";

  return (
    <div className="flex flex-col items-center gap-8">
      <header className="w-full max-w-3xl space-y-2">
        <h1 className="text-3xl font-bold text-slate-900">Briefing Note AI</h1>
        <p className="text-base text-slate-600">
          企業説明会の紙メモを、就活で使える Markdown に変換します。
        </p>
      </header>
      <StepIndicator currentStepId={currentStepId} />
      <div
        className={`w-full rounded-lg border border-slate-200 bg-white p-6 shadow-sm sm:p-8 ${cardMaxWidth}`}
      >
        {currentStepId === "upload" && (
          <UploadStep
            selectedImage={selectedImage}
            onSelectImage={handleSelectImage}
            onNext={goNext}
          />
        )}
        {currentStepId === "ocr" && (
          <OcrReviewStep
            selectedImage={selectedImage}
            ocrText={ocrText}
            onChangeOcrText={setOcrText}
            onBack={goBack}
            onNext={goNext}
          />
        )}
        {currentStepId === "markdown" && <MarkdownEditStep onBack={goBack} />}
      </div>
    </div>
  );
}
