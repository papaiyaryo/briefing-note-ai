"use client";

import { useEffect, useRef, useState } from "react";

import { getPreviousStepId, type StepId } from "../lib/flow";
import {
  EMPTY_COMPANY_EVENT_INFO,
  buildMarkdownTemplateFromBriefingNote,
  type CompanyEventInfo,
} from "../lib/markdown";
import { runDummyOcr, type DummyOcrMode } from "../lib/dummyOcr";
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
  const [isMarkdownDirty, setIsMarkdownDirty] = useState(false);
  const [companyEventInfo, setCompanyEventInfo] = useState<CompanyEventInfo>(
    EMPTY_COMPANY_EVENT_INFO,
  );
  const [isOcrRunning, setIsOcrRunning] = useState(false);
  const [isGeneratingMarkdown, setIsGeneratingMarkdown] = useState(false);
  const [hasOcrError, setHasOcrError] = useState(false);
  const [ocrErrorMessage, setOcrErrorMessage] = useState("");
  const [hasGenerationError, setHasGenerationError] = useState(false);

  const pendingTimerRef = useRef<number | null>(null);

  // アンマウント時に未発火のタイマーを解除し、破棄後の state 更新を防ぐ
  useEffect(() => {
    return () => {
      if (pendingTimerRef.current !== null) {
        window.clearTimeout(pendingTimerRef.current);
      }
    };
  }, []);

  // 画像の差し替え時とアンマウント時に、古いプレビュー URL を解放する
  useEffect(() => {
    const previewUrl = selectedImage?.previewUrl;
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [selectedImage]);

  const goBack = () =>
    setCurrentStepId((stepId) => getPreviousStepId(stepId) ?? stepId);

  // 画像を差し替えたら、前の画像に対する OCR 結果と生成 Markdown は無効になるためクリアする
  const handleSelectImage = (image: SelectedImage) => {
    if (selectedImage) {
      setOcrText("");
      setMarkdownText("");
      setIsMarkdownDirty(false);
      setHasOcrError(false);
      setOcrErrorMessage("");
      setHasGenerationError(false);
    }
    setSelectedImage(image);
  };

  // ユーザーが手で編集した Markdown は、テンプレート再生成で上書きしない
  const handleChangeMarkdownText = (text: string) => {
    setIsMarkdownDirty(true);
    setMarkdownText(text);
  };

  // 実 OCR 連携前の MVP 確認用に、固定サンプルを返すダミー OCR を使う。
  // 完了時の遷移は、待機中の操作に影響されないよう絶対遷移にする。
  const startDummyOcr = (mode: DummyOcrMode = "success") => {
    if (isOcrRunning) {
      return;
    }
    setHasOcrError(false);
    setOcrErrorMessage("");
    setIsOcrRunning(true);
    pendingTimerRef.current = window.setTimeout(() => {
      pendingTimerRef.current = null;
      const result = runDummyOcr(mode);
      if (result.status === "success") {
        setOcrText(result.text);
        setHasOcrError(false);
        setOcrErrorMessage("");
      } else {
        setOcrText("");
        setHasOcrError(true);
        setOcrErrorMessage(result.errorMessage);
      }
      setIsOcrRunning(false);
      setCurrentStepId("ocr");
    }, 600);
  };

  const handleRunOcr = () => startDummyOcr("success");
  const handleSimulateOcrFailure = () => startDummyOcr("failure");

  // 実際の Markdown 生成(LLM)は Phase 4 で接続する。
  // 未編集なら最新の入力(企業情報・OCR 結果)でテンプレートを再生成し、編集済みなら保持する。
  // 失敗時は setHasGenerationError(true) を呼ぶ。
  const handleGenerateMarkdown = () => {
    if (isGeneratingMarkdown) {
      return;
    }
    setHasGenerationError(false);
    setIsGeneratingMarkdown(true);
    pendingTimerRef.current = window.setTimeout(() => {
      pendingTimerRef.current = null;
      if (!isMarkdownDirty) {
        setMarkdownText(
          buildMarkdownTemplateFromBriefingNote({
            companyEventInfo,
            imageFileName: selectedImage?.file.name,
            ocrText,
          }),
        );
      }
      setIsGeneratingMarkdown(false);
      setCurrentStepId("markdown");
    }, 600);
  };

  const cardMaxWidth = currentStepId === "markdown" ? "max-w-5xl" : "max-w-3xl";

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
            companyEventInfo={companyEventInfo}
            onChangeCompanyEventInfo={setCompanyEventInfo}
            isOcrRunning={isOcrRunning}
            onNext={handleRunOcr}
            onSimulateOcrFailure={handleSimulateOcrFailure}
          />
        )}
        {currentStepId === "ocr" && (
          <OcrReviewStep
            selectedImage={selectedImage}
            ocrText={ocrText}
            onChangeOcrText={setOcrText}
            hasOcrError={hasOcrError}
            ocrErrorMessage={ocrErrorMessage}
            isOcrRunning={isOcrRunning}
            isGeneratingMarkdown={isGeneratingMarkdown}
            onBack={goBack}
            onRetryOcr={handleRunOcr}
            onNext={handleGenerateMarkdown}
          />
        )}
        {currentStepId === "markdown" && (
          <MarkdownEditStep
            markdownText={markdownText}
            onChangeMarkdownText={handleChangeMarkdownText}
            hasGenerationError={hasGenerationError}
            onBack={goBack}
          />
        )}
      </div>
    </div>
  );
}
