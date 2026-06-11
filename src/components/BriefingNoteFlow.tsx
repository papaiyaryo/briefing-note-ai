"use client";

import { useEffect, useState } from "react";

import {
  getNextStepId,
  getPreviousStepId,
  type StepId,
} from "../lib/flow";
import {
  EMPTY_COMPANY_EVENT_INFO,
  buildMarkdownTemplate,
  type CompanyEventInfo,
} from "../lib/markdown";
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
  const [markdownText, setMarkdownText] = useState("");
  const [companyEventInfo, setCompanyEventInfo] = useState<CompanyEventInfo>(
    EMPTY_COMPANY_EVENT_INFO,
  );
  const [isOcrRunning, setIsOcrRunning] = useState(false);
  const [isGeneratingMarkdown, setIsGeneratingMarkdown] = useState(false);
  const [hasOcrError, setHasOcrError] = useState(false);
  const [hasGenerationError, setHasGenerationError] = useState(false);

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

  // 実 OCR は Phase 4 で接続する。ここでは処理中表示と二重実行防止のため、
  // 短い待機を挟んでから次のステップへ進む。失敗時は setHasOcrError(true) を呼ぶ。
  const handleRunOcr = () => {
    if (isOcrRunning) {
      return;
    }
    setHasOcrError(false);
    setIsOcrRunning(true);
    window.setTimeout(() => {
      setIsOcrRunning(false);
      goNext();
    }, 600);
  };

  // 実際の Markdown 生成(LLM)は Phase 4 で接続する。
  // ここでは出力形式のテンプレートを初期値として用意し、編集済みの内容は上書きしない。
  // 失敗時は setHasGenerationError(true) を呼ぶ。
  const handleGenerateMarkdown = () => {
    if (isGeneratingMarkdown) {
      return;
    }
    setHasGenerationError(false);
    setIsGeneratingMarkdown(true);
    window.setTimeout(() => {
      setMarkdownText((current) =>
        current.trim() === ""
          ? buildMarkdownTemplate({
              companyName: companyEventInfo.companyName,
              eventName: companyEventInfo.eventName,
              eventDate: companyEventInfo.eventDate,
              ocrText,
              imageFileName: selectedImage?.file.name,
            })
          : current,
      );
      setIsGeneratingMarkdown(false);
      goNext();
    }, 600);
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
            onSelectImage={setSelectedImage}
            companyEventInfo={companyEventInfo}
            onChangeCompanyEventInfo={setCompanyEventInfo}
            isOcrRunning={isOcrRunning}
            onNext={handleRunOcr}
          />
        )}
        {currentStepId === "ocr" && (
          <OcrReviewStep
            selectedImage={selectedImage}
            ocrText={ocrText}
            onChangeOcrText={setOcrText}
            hasOcrError={hasOcrError}
            isGeneratingMarkdown={isGeneratingMarkdown}
            onBack={goBack}
            onNext={handleGenerateMarkdown}
          />
        )}
        {currentStepId === "markdown" && (
          <MarkdownEditStep
            markdownText={markdownText}
            onChangeMarkdownText={setMarkdownText}
            hasGenerationError={hasGenerationError}
            onBack={goBack}
          />
        )}
      </div>
    </div>
  );
}
