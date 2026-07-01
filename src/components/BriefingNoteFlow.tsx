"use client";

import { useEffect, useRef, useState } from "react";

import { getPreviousStepId, type StepId } from "../lib/flow";
import {
  EMPTY_COMPANY_EVENT_INFO,
  type CompanyEventInfo,
} from "../lib/markdown";
import { runDummyOcr } from "../lib/dummyOcr";
import { requestOcr } from "../lib/ocrClient";
import { toMarkdown } from "../lib/structure/toMarkdown";
import { requestStructure } from "../lib/structureClient";
import { type WebSupplementItem } from "../lib/types";
import { type SelectedImage } from "../lib/upload";
import { requestWebSupplements } from "../lib/webSupplementClient";
import { StepIndicator } from "./StepIndicator";
import { MarkdownEditStep } from "./steps/MarkdownEditStep";
import { OcrReviewStep } from "./steps/OcrReviewStep";
import { UploadStep } from "./steps/UploadStep";
import { WebSupplementStep } from "./steps/WebSupplementStep";

export function BriefingNoteFlow() {
  const [currentStepId, setCurrentStepId] = useState<StepId>("upload");
  const [selectedImages, setSelectedImages] = useState<SelectedImage[]>([]);
  const [ocrText, setOcrText] = useState("");
  const [ocrProgressLabel, setOcrProgressLabel] = useState("");
  const [markdownText, setMarkdownText] = useState("");
  const [isMarkdownDirty, setIsMarkdownDirty] = useState(false);
  const [webSupplements, setWebSupplements] = useState<WebSupplementItem[]>([]);
  const [isLoadingWebSupplements, setIsLoadingWebSupplements] = useState(false);
  const [companyEventInfo, setCompanyEventInfo] = useState<CompanyEventInfo>(
    EMPTY_COMPANY_EVENT_INFO,
  );
  const [isOcrRunning, setIsOcrRunning] = useState(false);
  const [isGeneratingMarkdown, setIsGeneratingMarkdown] = useState(false);
  const [hasOcrError, setHasOcrError] = useState(false);
  const [ocrErrorMessage, setOcrErrorMessage] = useState("");
  const [hasGenerationError, setHasGenerationError] = useState(false);

  const pendingTimerRef = useRef<number | null>(null);
  const ocrAbortControllerRef = useRef<AbortController | null>(null);
  const selectedImagesRef = useRef<SelectedImage[]>([]);

  useEffect(() => {
    selectedImagesRef.current = selectedImages;
  }, [selectedImages]);

  // アンマウント時に未発火のタイマー、OCR リクエスト、プレビュー URL を解放する
  useEffect(() => {
    return () => {
      if (pendingTimerRef.current !== null) {
        window.clearTimeout(pendingTimerRef.current);
      }
      ocrAbortControllerRef.current?.abort();
      selectedImagesRef.current.forEach((image) => {
        URL.revokeObjectURL(image.previewUrl);
      });
    };
  }, []);

  const resetGeneratedState = () => {
    setOcrText("");
    setOcrProgressLabel("");
    setMarkdownText("");
    setIsMarkdownDirty(false);
    setWebSupplements([]);
    setIsLoadingWebSupplements(false);
    setHasOcrError(false);
    setOcrErrorMessage("");
    setHasGenerationError(false);
  };

  const goBack = () =>
    setCurrentStepId((stepId) => getPreviousStepId(stepId) ?? stepId);

  // 画像が変わったら、前の画像に対する OCR 結果と生成 Markdown は無効になるためクリアする
  const handleAddImages = (images: SelectedImage[]) => {
    if (images.length === 0) {
      return;
    }
    resetGeneratedState();
    setSelectedImages((prev) => [...prev, ...images]);
  };

  const handleRemoveImage = (id: string) => {
    resetGeneratedState();
    setSelectedImages((prev) => {
      const removed = prev.find((image) => image.id === id);
      if (removed) {
        URL.revokeObjectURL(removed.previewUrl);
      }
      return prev.filter((image) => image.id !== id);
    });
  };

  // ユーザーが手で編集した Markdown は、テンプレート再生成で上書きしない
  const handleChangeMarkdownText = (text: string) => {
    setIsMarkdownDirty(true);
    setMarkdownText(text);
  };

  // OCR API は単一画像のままにし、複数画像はクライアント側で順次処理して連結する。
  const handleRunOcr = async () => {
    if (isOcrRunning || selectedImages.length === 0) {
      return;
    }

    ocrAbortControllerRef.current?.abort();
    const controller = new AbortController();
    ocrAbortControllerRef.current = controller;

    setHasOcrError(false);
    setOcrErrorMessage("");
    setIsOcrRunning(true);

    try {
      const parts: string[] = [];
      for (let index = 0; index < selectedImages.length; index += 1) {
        if (controller.signal.aborted) {
          return;
        }
        if (selectedImages.length > 1) {
          setOcrProgressLabel(
            `OCR を実行しています… (${index + 1}/${selectedImages.length})`,
          );
        } else {
          setOcrProgressLabel("OCR を実行しています…");
        }

        const result = await requestOcr(
          selectedImages[index].file,
          controller.signal,
        );
        parts.push(
          selectedImages.length > 1
            ? `[ページ ${index + 1}]\n${result.text}`
            : result.text,
        );
      }

      if (controller.signal.aborted) {
        return;
      }
      setOcrText(parts.join("\n\n"));
      setHasOcrError(false);
      setOcrErrorMessage("");
    } catch (error) {
      if (controller.signal.aborted) {
        return;
      }
      const message =
        error instanceof Error
          ? error.message
          : "OCR 処理に失敗しました。時間をおいて再試行してください。";
      setOcrText("");
      setHasOcrError(true);
      setOcrErrorMessage(message);
    } finally {
      if (!controller.signal.aborted) {
        setOcrProgressLabel("");
        setIsOcrRunning(false);
        setCurrentStepId("ocr");
      }
      if (ocrAbortControllerRef.current === controller) {
        ocrAbortControllerRef.current = null;
      }
    }
  };

  const handleSimulateOcrFailure = () => {
    if (isOcrRunning || selectedImages.length === 0) {
      return;
    }
    setHasOcrError(false);
    setOcrErrorMessage("");
    setOcrProgressLabel("OCR を実行しています…");
    setIsOcrRunning(true);
    pendingTimerRef.current = window.setTimeout(() => {
      pendingTimerRef.current = null;
      const result = runDummyOcr("failure");
      setOcrText("");
      setHasOcrError(true);
      setOcrErrorMessage(
        result.status === "failure"
          ? result.errorMessage
          : "OCR 失敗の確認に失敗しました。",
      );
      setOcrProgressLabel("");
      setIsOcrRunning(false);
      setCurrentStepId("ocr");
    }, 600);
  };

  const handlePrepareWebSupplements = async () => {
    if (isLoadingWebSupplements) {
      return;
    }
    setIsLoadingWebSupplements(true);
    try {
      setWebSupplements(await requestWebSupplements(ocrText, companyEventInfo));
    } finally {
      setIsLoadingWebSupplements(false);
      setCurrentStepId("web-supplement");
    }
  };

  const handleSetWebSupplementStatus = (
    id: string,
    status: WebSupplementItem["status"],
  ) => {
    setWebSupplements((items) =>
      items.map((item) => (item.id === id ? { ...item, status } : item)),
    );
  };

  const handleSkipWebSupplements = () => {
    setWebSupplements((items) =>
      items.map((item) =>
        item.status === "pending" ? { ...item, status: "rejected" } : item,
      ),
    );
    void handleGenerateMarkdown([]);
  };

  // OCR テキストを直接 Markdown 化せず、サーバー側で構造化 JSON を生成・検証してから、
  // クライアント側の純粋関数で Markdown に変換する。編集済みなら上書きしない。
  const handleGenerateMarkdown = async (supplements = webSupplements) => {
    if (isGeneratingMarkdown) {
      return;
    }
    setHasGenerationError(false);
    setIsGeneratingMarkdown(true);

    try {
      const result = await requestStructure(ocrText, companyEventInfo);
      if (!isMarkdownDirty) {
        setMarkdownText(
          toMarkdown(result.memo, {
            imageFileNames: selectedImages.map((image) => image.file.name),
            ocrText,
            webSupplements: supplements.filter(
              (item) => item.status === "adopted",
            ),
          }),
        );
      }
      setCurrentStepId("markdown");
    } catch {
      setHasGenerationError(true);
      setCurrentStepId("markdown");
    } finally {
      setIsGeneratingMarkdown(false);
    }
  };

  const cardMaxWidth =
    currentStepId === "markdown" || currentStepId === "web-supplement"
      ? "max-w-5xl"
      : "max-w-3xl";

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
            selectedImages={selectedImages}
            onAddImages={handleAddImages}
            onRemoveImage={handleRemoveImage}
            companyEventInfo={companyEventInfo}
            onChangeCompanyEventInfo={setCompanyEventInfo}
            isOcrRunning={isOcrRunning}
            ocrProgressLabel={ocrProgressLabel}
            onNext={handleRunOcr}
            onSimulateOcrFailure={handleSimulateOcrFailure}
          />
        )}
        {currentStepId === "ocr" && (
          <OcrReviewStep
            selectedImages={selectedImages}
            ocrText={ocrText}
            onChangeOcrText={setOcrText}
            hasOcrError={hasOcrError}
            ocrErrorMessage={ocrErrorMessage}
            isOcrRunning={isOcrRunning}
            isGeneratingMarkdown={isGeneratingMarkdown}
            onBack={goBack}
            onRetryOcr={handleRunOcr}
            onNext={handlePrepareWebSupplements}
          />
        )}
        {currentStepId === "web-supplement" && (
          <WebSupplementStep
            supplements={webSupplements}
            isLoading={isLoadingWebSupplements}
            onSetStatus={handleSetWebSupplementStatus}
            onBack={goBack}
            onNext={() => void handleGenerateMarkdown()}
            onSkip={handleSkipWebSupplements}
          />
        )}
        {currentStepId === "markdown" && (
          <MarkdownEditStep
            markdownText={markdownText}
            companyName={companyEventInfo.companyName}
            onChangeMarkdownText={handleChangeMarkdownText}
            hasGenerationError={hasGenerationError}
            onBack={goBack}
          />
        )}
      </div>
    </div>
  );
}
