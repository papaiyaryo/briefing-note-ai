"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  GenerationSavePanel,
  GenerationSaveSession,
  type GenerationTarget,
} from "./generation/GenerationSavePanel";
import { ConfirmDialog } from "./workspace/ConfirmDialog";
import { generationDrafts } from "../lib/generation/draft";
import { mapGeneratedCandidate } from "../lib/generation/candidate";
import { GenerationSaveIntent } from "../lib/generation/save";
import { RequestGeneration } from "../lib/workspace/draft";
import type {
  Company,
  GeneratedCandidate,
  Memo,
  OperationLookup,
} from "../lib/workspace/contracts";

import { getPreviousStepId, type StepId } from "../lib/flow";
import {
  EMPTY_COMPANY_EVENT_INFO,
  type CompanyEventInfo,
} from "../lib/markdown";
import { runDummyOcr } from "../lib/dummyOcr";
import { requestInterviewReview } from "../lib/interviewReviewClient";
import type { InterviewReviewStructured } from "../lib/interviewReview/schema";
import { requestOcr } from "../lib/ocrClient";
import { toMarkdown } from "../lib/structure/toMarkdown";
import type { CompanyMemoStructured } from "../lib/structure/schema";
import { requestStructure } from "../lib/structureClient";
import { type WebSupplementItem } from "../lib/types";
import { type SelectedImage } from "../lib/upload";
import { requestWebSupplements } from "../lib/webSupplementClient";
import { InterviewReviewView } from "./InterviewReviewView";
import { StepIndicator } from "./StepIndicator";
import { MarkdownEditStep } from "./steps/MarkdownEditStep";
import { OcrReviewStep } from "./steps/OcrReviewStep";
import { UploadStep } from "./steps/UploadStep";
import { WebSupplementStep } from "./steps/WebSupplementStep";

function retainedGeneration(target: GenerationTarget) {
  const draft = generationDrafts.recover(
    target.ownerId,
    target.companyId,
    target.version,
  );
  if (draft) return draft;
  const pending = generationDrafts.pending(target.ownerId, target.companyId);
  if (!pending) return null;
  try {
    const intent = GenerationSaveIntent.restore(
      target.client,
      target.companyId,
      pending,
    );
    const candidate: GeneratedCandidate = JSON.parse(
      intent.request.body,
    ).candidate;
    return {
      value: {
        candidate,
        correctedOcr: candidate.correctedOcr,
        event: candidate.event,
      },
      baseVersion: target.version,
      needsRebase: false,
    };
  } catch {
    return null;
  }
}
export function BriefingNoteFlow({
  target,
  onClose,
  onOpenSaved,
}: {
  target?: GenerationTarget;
  onClose?: () => void;
  onOpenSaved?: (memo: Memo) => Promise<void>;
} = {}) {
  const [currentStepId, setCurrentStepId] = useState<StepId>("upload");
  const [selectedImages, setSelectedImages] = useState<SelectedImage[]>([]);
  const [ocrText, setOcrText] = useState("");
  const [ocrProgressLabel, setOcrProgressLabel] = useState("");
  const [markdownText, setMarkdownText] = useState("");
  const [structuredMemo, setStructuredMemo] =
    useState<CompanyMemoStructured | null>(null);
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
  const [interviewReview, setInterviewReview] =
    useState<InterviewReviewStructured | null>(null);
  const [isGeneratingInterviewReview, setIsGeneratingInterviewReview] =
    useState(false);
  const [hasInterviewReviewError, setHasInterviewReviewError] = useState(false);

  const pendingTimerRef = useRef<number | null>(null);
  const ocrAbortControllerRef = useRef<AbortController | null>(null);
  const selectedImagesRef = useRef<SelectedImage[]>([]);
  const currentStepIdRef = useRef<StepId>(currentStepId);
  const webSupplementRequestIdRef = useRef(0);
  const markdownGenerationRequestIdRef = useRef(0);
  const interviewReviewRequestIdRef = useRef(0);
  const interviewReviewAbortControllerRef = useRef<AbortController | null>(
    null,
  );
  const isLoadingWebSupplementsRef = useRef(false);
  const isGeneratingMarkdownRef = useRef(false);
  const isGeneratingInterviewReviewRef = useRef(false);

  const targetKey = target
    ? `${target.ownerId}:${target.companyId}`
    : "standalone";
  const currentTargetKey = useRef(targetKey);
  currentTargetKey.current = targetKey;
  const targetRef = useRef(target);
  targetRef.current = target;
  const workflow = useRef(new RequestGeneration());
  const saveSession = useRef(new GenerationSaveSession());
  const targetHeading = useRef<HTMLHeadingElement>(null);
  const hasTarget = !!target;
  const incomingImages = useRef<SelectedImage[]>([]);
  const [boundTarget, setBoundTarget] = useState(targetKey);
  const [targetCandidate, setTargetCandidate] =
    useState<GeneratedCandidate | null>(null);
  const candidateRef = useRef(targetCandidate);
  candidateRef.current = targetCandidate;
  const committedCallback = useRef<(sent: GeneratedCandidate) => void>(
    () => {},
  );
  const [targetDirty, setTargetDirty] = useState(false);
  const [discard, setDiscard] = useState<{
    action: () => void;
    cancel?: () => void;
  } | null>(null);
  const [notice, setNotice] = useState("");
  const [retained, setRetained] = useState(() =>
    target ? retainedGeneration(target) : null,
  );
  useEffect(() => {
    if (hasTarget && boundTarget === targetKey) targetHeading.current?.focus();
  }, [hasTarget, boundTarget, targetKey]);
  const releaseImages = useCallback(() => {
    selectedImagesRef.current.forEach((image) =>
      URL.revokeObjectURL(image.previewUrl),
    );
    selectedImagesRef.current = [];
    setSelectedImages([]);
  }, []);

  useEffect(() => {
    selectedImagesRef.current = selectedImages;
  }, [selectedImages]);

  useEffect(() => {
    currentStepIdRef.current = currentStepId;
  }, [currentStepId]);

  // アンマウント時に未発火のタイマー、OCR リクエスト、プレビュー URL を解放する
  useEffect(() => {
    const generation = workflow.current;
    return () => {
      if (pendingTimerRef.current !== null) {
        window.clearTimeout(pendingTimerRef.current);
      }
      ocrAbortControllerRef.current?.abort();
      generation.invalidate();
      saveSession.current.dispose();
      incomingImages.current.forEach((image) =>
        URL.revokeObjectURL(image.previewUrl),
      );
      incomingImages.current = [];
      webSupplementRequestIdRef.current += 1;
      markdownGenerationRequestIdRef.current += 1;
      interviewReviewRequestIdRef.current += 1;
      interviewReviewAbortControllerRef.current?.abort();
      selectedImagesRef.current.forEach((image) => {
        URL.revokeObjectURL(image.previewUrl);
      });
    };
  }, []);

  const resetGeneratedState = useCallback(() => {
    saveSession.current.dispose();
    saveSession.current = new GenerationSaveSession();
    workflow.current.invalidate();
    ocrAbortControllerRef.current?.abort();
    if (pendingTimerRef.current !== null) {
      window.clearTimeout(pendingTimerRef.current);
      pendingTimerRef.current = null;
    }
    setIsOcrRunning(false);
    setTargetCandidate(null);
    setTargetDirty(false);
    setNotice("");
    setOcrText("");
    setOcrProgressLabel("");
    setMarkdownText("");
    setStructuredMemo(null);
    setIsMarkdownDirty(false);
    webSupplementRequestIdRef.current += 1;
    markdownGenerationRequestIdRef.current += 1;
    interviewReviewRequestIdRef.current += 1;
    interviewReviewAbortControllerRef.current?.abort();
    interviewReviewAbortControllerRef.current = null;
    isLoadingWebSupplementsRef.current = false;
    isGeneratingMarkdownRef.current = false;
    isGeneratingInterviewReviewRef.current = false;
    setWebSupplements([]);
    setIsLoadingWebSupplements(false);
    setHasOcrError(false);
    setOcrErrorMessage("");
    setHasGenerationError(false);
    setInterviewReview(null);
    setIsGeneratingInterviewReview(false);
    setHasInterviewReviewError(false);
  }, []);

  useEffect(() => {
    if (boundTarget === targetKey) return;
    resetGeneratedState();
    releaseImages();
    setCurrentStepId("upload");
    setCompanyEventInfo(EMPTY_COMPANY_EVENT_INFO);
    incomingImages.current.forEach((image) =>
      URL.revokeObjectURL(image.previewUrl),
    );
    incomingImages.current = [];
    setDiscard(null);
    setRetained(
      targetRef.current ? retainedGeneration(targetRef.current) : null,
    );
    setBoundTarget(targetKey);
  }, [boundTarget, targetKey, resetGeneratedState, releaseImages]);
  const draftOwner = target?.ownerId,
    draftCompany = target?.companyId,
    draftVersion = target?.version;
  useEffect(() => {
    if (
      draftOwner &&
      draftCompany &&
      draftVersion &&
      boundTarget === targetKey &&
      targetDirty
    )
      generationDrafts.put(
        draftOwner,
        draftCompany,
        {
          correctedOcr: ocrText,
          event: companyEventInfo,
          candidate: targetCandidate,
        },
        draftVersion,
      );
  }, [
    draftOwner,
    draftCompany,
    draftVersion,
    boundTarget,
    targetKey,
    targetDirty,
    ocrText,
    companyEventInfo,
    targetCandidate,
  ]);
  const confirmDiscard = (action: () => void, cancel?: () => void) => {
    if (target && targetDirty) setDiscard({ action, cancel });
    else action();
  };
  const close = () =>
    confirmDiscard(() => {
      if (target) generationDrafts.discard(target.ownerId, target.companyId);
      workflow.current.invalidate();
      saveSession.current.dispose();
      releaseImages();
      onClose?.();
    });
  const changeCandidate = (value: GeneratedCandidate) => {
    const previous = candidateRef.current;
    workflow.current.invalidate();
    interviewReviewRequestIdRef.current++;
    interviewReviewAbortControllerRef.current?.abort();
    setTargetCandidate(value);
    setMarkdownText(value.markdown);
    setStructuredMemo(value.structuredContent);
    if (!previous || previous.correctedOcr !== value.correctedOcr)
      setOcrText(value.correctedOcr);
    if (
      !previous ||
      (["companyName", "eventName", "eventDate"] as const).some(
        (key) => previous.event[key] !== value.event[key],
      )
    )
      setCompanyEventInfo(value.event);
    if (
      !previous ||
      JSON.stringify(previous.adoptedWebSources) !==
        JSON.stringify(value.adoptedWebSources)
    )
      setWebSupplements(value.adoptedWebSources);
    setTargetDirty(true);
    setInterviewReview(null);
  };
  const workingInputChanged = (value: GeneratedCandidate) => {
    const sources = webSupplements.filter((item) => item.status === "adopted");
    return (
      ocrText !== value.correctedOcr ||
      (["companyName", "eventName", "eventDate"] as const).some(
        (key) => companyEventInfo[key] !== value.event[key],
      ) ||
      sources.length !== value.adoptedWebSources.length ||
      sources.some((source, index) =>
        (
          [
            "id",
            "category",
            "content",
            "sourceUrl",
            "fetchedAt",
            "confidence",
            "status",
          ] as const
        ).some((key) => source[key] !== value.adoptedWebSources[index]?.[key]),
      )
    );
  };
  const committed = (sent: GeneratedCandidate) => {
    releaseImages();
    let changed = true;
    try {
      changed =
        JSON.stringify(mapGeneratedCandidate(candidateRef.current)) !==
          JSON.stringify(sent) || workingInputChanged(sent);
    } catch {}
    setTargetDirty(changed);
    if (!changed && target)
      generationDrafts.discard(target.ownerId, target.companyId);
  };
  // A save can finish while its panel is hidden and working OCR has changed.
  committedCallback.current = committed;
  const resume = async () => {
    if (!target || !retained) return;
    const token = workflow.current.next(),
      key = targetKey;
    try {
      const latest = await target.client.get<Company>(
        `/api/v1/companies/${target.companyId}`,
        token.signal,
      );
      if (latest.companyId !== target.companyId) throw new Error();
      const pending = generationDrafts.pending(
        target.ownerId,
        target.companyId,
      );
      if (pending) {
        const intent = GenerationSaveIntent.restore(
          target.client,
          target.companyId,
          pending,
        );
        await target.client.get<OperationLookup>(
          `/api/v1/operations/${intent.ids.operationId}`,
          token.signal,
        );
      }
      if (currentTargetKey.current !== key || !workflow.current.accepts(token))
        return;
      setOcrText(retained.value.correctedOcr);
      setCompanyEventInfo(retained.value.event);
      const value = retained.value.candidate;
      setTargetCandidate(value);
      setMarkdownText(value?.markdown ?? "");
      setStructuredMemo(value?.structuredContent ?? null);
      setWebSupplements(value?.adoptedWebSources ?? []);
      setTargetDirty(true);
      setCurrentStepId(value ? "markdown" : "ocr");
      setRetained(null);
      setNotice(
        latest.version !== retained.baseVersion
          ? "保存先の版が変わりました。最新企業と保持入力を確認してください。"
          : "保持入力を再開しました。画像は復元しません。",
      );
    } catch {
      if (currentTargetKey.current === key && workflow.current.accepts(token))
        setNotice(
          "保存先・本人・操作結果を確認できません。保持入力はそのままです。",
        );
    }
  };

  const goBack = () =>
    setCurrentStepId((stepId) => getPreviousStepId(stepId) ?? stepId);

  // 画像が変わったら、前の画像に対する OCR 結果と生成 Markdown は無効になるためクリアする
  const handleAddImages = (images: SelectedImage[]) => {
    if (images.length === 0) {
      return;
    }
    const apply = () => {
      incomingImages.current = [];
      resetGeneratedState();
      const next = [...selectedImagesRef.current, ...images];
      selectedImagesRef.current = next;
      setSelectedImages(next);
      if (target) setTargetDirty(true);
    };
    if (target && targetDirty) incomingImages.current = images;
    confirmDiscard(apply, () => {
      images.forEach((image) => URL.revokeObjectURL(image.previewUrl));
      incomingImages.current = [];
    });
  };

  const handleRemoveImage = (id: string) => {
    confirmDiscard(() => {
      resetGeneratedState();
      const removed = selectedImagesRef.current.find(
        (image) => image.id === id,
      );
      if (removed) URL.revokeObjectURL(removed.previewUrl);
      const next = selectedImagesRef.current.filter((image) => image.id !== id);
      selectedImagesRef.current = next;
      setSelectedImages(next);
      if (target) setTargetDirty(true);
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

    const binding = targetKey,
      token = target ? workflow.current.next() : null;
    ocrAbortControllerRef.current?.abort();
    const controller = new AbortController();
    ocrAbortControllerRef.current = controller;

    setHasOcrError(false);
    setOcrErrorMessage("");
    setIsOcrRunning(true);

    try {
      const parts: string[] = [];
      for (let index = 0; index < selectedImages.length; index += 1) {
        if (
          controller.signal.aborted ||
          (target &&
            (currentTargetKey.current !== binding ||
              (token && !workflow.current.accepts(token))))
        ) {
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
          token
            ? AbortSignal.any([controller.signal, token.signal])
            : controller.signal,
        );
        parts.push(
          selectedImages.length > 1
            ? `[ページ ${index + 1}]\n${result.text}`
            : result.text,
        );
      }

      if (
        controller.signal.aborted ||
        (target &&
          (currentTargetKey.current !== binding ||
            (token && !workflow.current.accepts(token))))
      ) {
        return;
      }
      setOcrText(parts.join("\n\n"));
      if (target) setTargetDirty(true);
      setHasOcrError(false);
      setOcrErrorMessage("");
    } catch (error) {
      if (
        controller.signal.aborted ||
        (target &&
          (currentTargetKey.current !== binding ||
            (token && !workflow.current.accepts(token))))
      ) {
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
      if (
        !(
          controller.signal.aborted ||
          (target &&
            (currentTargetKey.current !== binding ||
              (token && !workflow.current.accepts(token))))
        )
      ) {
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
    if (isLoadingWebSupplementsRef.current) {
      return;
    }

    const binding = targetKey,
      token = target ? workflow.current.next() : null;
    const requestId = webSupplementRequestIdRef.current + 1;
    webSupplementRequestIdRef.current = requestId;
    const startStepId = currentStepIdRef.current;
    isLoadingWebSupplementsRef.current = true;
    setIsLoadingWebSupplements(true);

    try {
      const supplements = await requestWebSupplements(
        ocrText,
        companyEventInfo,
        token?.signal,
      );
      const isLatestRequest =
        webSupplementRequestIdRef.current === requestId &&
        (!target ||
          (currentTargetKey.current === binding &&
            !!token &&
            workflow.current.accepts(token)));
      const isStillOnExpectedStep =
        currentStepIdRef.current === startStepId && startStepId === "ocr";

      if (isLatestRequest && isStillOnExpectedStep) {
        setWebSupplements(supplements);
        setCurrentStepId("web-supplement");
      }
    } catch {
      if (
        webSupplementRequestIdRef.current === requestId &&
        (!target ||
          (currentTargetKey.current === binding &&
            !!token &&
            workflow.current.accepts(token)))
      )
        setNotice("Web補足の取得に失敗しました。訂正入力を保持しています。");
    } finally {
      if (webSupplementRequestIdRef.current === requestId) {
        isLoadingWebSupplementsRef.current = false;
        setIsLoadingWebSupplements(false);
      }
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

  const getAdoptedWebSupplements = (items = webSupplements) =>
    items.filter((item) => item.status === "adopted");

  const shouldApplyInterviewReviewResult = (
    requestId: number,
    startStepId: StepId,
  ) =>
    interviewReviewRequestIdRef.current === requestId &&
    currentStepIdRef.current === startStepId &&
    startStepId === "markdown" &&
    (!target || currentTargetKey.current === targetKey);

  const handleSkipWebSupplements = () => {
    setWebSupplements((items) =>
      items.map((item) => ({ ...item, status: "rejected" })),
    );
    void handleGenerateMarkdown([]);
  };

  // OCR テキストを直接 Markdown 化せず、サーバー側で構造化 JSON を生成・検証してから、
  // クライアント側の純粋関数で Markdown に変換する。編集済みなら上書きしない。
  const performGenerateMarkdown = async (supplements = webSupplements) => {
    if (isGeneratingMarkdownRef.current) {
      return;
    }

    const binding = targetKey,
      token = target ? workflow.current.next() : null;
    const requestId = markdownGenerationRequestIdRef.current + 1;
    markdownGenerationRequestIdRef.current = requestId;
    const startStepId = currentStepIdRef.current;
    isGeneratingMarkdownRef.current = true;
    setHasGenerationError(false);
    setIsGeneratingMarkdown(true);

    try {
      const result = await requestStructure(
        ocrText,
        companyEventInfo,
        token?.signal,
      );
      if (target && !result.generationReceipt)
        throw new Error("generation proof missing");
      const isLatestRequest =
        markdownGenerationRequestIdRef.current === requestId &&
        (!target ||
          (currentTargetKey.current === binding &&
            !!token &&
            workflow.current.accepts(token)));
      const isStillOnExpectedStep =
        currentStepIdRef.current === startStepId &&
        startStepId === "web-supplement";

      if (isLatestRequest && isStillOnExpectedStep) {
        setStructuredMemo(result.memo);
        const generatedMarkdown = toMarkdown(result.memo, {
          ...(target
            ? {}
            : {
                imageFileNames: selectedImages.map((image) => image.file.name),
              }),
          ocrText,
          webSupplements: getAdoptedWebSupplements(supplements),
        });
        if (!isMarkdownDirty || target) setMarkdownText(generatedMarkdown);
        if (target) {
          saveSession.current.dispose();
          saveSession.current = new GenerationSaveSession(false);
          setTargetCandidate({
            origin: "generated",
            providerOrigin: result.provider,
            generationReceipt: result.generationReceipt!,
            markdown: generatedMarkdown,
            structuredContent: result.memo,
            correctedOcr: ocrText,
            event: { ...companyEventInfo },
            adoptedWebSources: getAdoptedWebSupplements(supplements).map(
              (item) => ({ ...item, status: "adopted" as const }),
            ),
            comparisonReason: null,
          });
          setTargetDirty(true);
        }
        setCurrentStepId("markdown");
      }
    } catch {
      const isLatestRequest =
        markdownGenerationRequestIdRef.current === requestId &&
        (!target ||
          (currentTargetKey.current === binding &&
            !!token &&
            workflow.current.accepts(token)));
      const isStillOnExpectedStep =
        currentStepIdRef.current === startStepId &&
        startStepId === "web-supplement";

      if (isLatestRequest && isStillOnExpectedStep) {
        setHasGenerationError(true);
        setCurrentStepId("markdown");
      }
    } finally {
      if (markdownGenerationRequestIdRef.current === requestId) {
        isGeneratingMarkdownRef.current = false;
        setIsGeneratingMarkdown(false);
      }
    }
  };

  const handleGenerateMarkdown = (supplements = webSupplements) => {
    const generate = () => {
      return performGenerateMarkdown(supplements);
    };
    if (target && targetCandidate && targetDirty) confirmDiscard(generate);
    else return generate();
  };

  const handleGenerateInterviewReview = () => {
    if (!structuredMemo || isGeneratingInterviewReviewRef.current) {
      return;
    }

    const requestId = interviewReviewRequestIdRef.current + 1;
    interviewReviewRequestIdRef.current = requestId;
    const startStepId = currentStepIdRef.current;
    const controller = new AbortController();
    interviewReviewAbortControllerRef.current?.abort();
    interviewReviewAbortControllerRef.current = controller;
    isGeneratingInterviewReviewRef.current = true;
    setHasInterviewReviewError(false);
    setIsGeneratingInterviewReview(true);

    const adoptedWebSupplements = getAdoptedWebSupplements();
    return requestInterviewReview(
      structuredMemo,
      adoptedWebSupplements,
      target ? controller.signal : undefined,
    )
      .then((response) => {
        if (shouldApplyInterviewReviewResult(requestId, startStepId)) {
          setInterviewReview(response.review);
        }
      })
      .catch((error: unknown) => {
        if (
          shouldApplyInterviewReviewResult(requestId, startStepId) &&
          !(error instanceof DOMException && error.name === "AbortError")
        ) {
          setHasInterviewReviewError(true);
        }
      })
      .finally(() => {
        if (interviewReviewRequestIdRef.current === requestId) {
          isGeneratingInterviewReviewRef.current = false;
          setIsGeneratingInterviewReview(false);
        }
        if (interviewReviewAbortControllerRef.current === controller) {
          interviewReviewAbortControllerRef.current = null;
        }
      });
  };

  if (boundTarget !== targetKey)
    return <p role="status">本人・保存先を切り替えています…</p>;

  const cardMaxWidth =
    currentStepId === "markdown" || currentStepId === "web-supplement"
      ? "max-w-5xl"
      : "max-w-3xl";

  return (
    <div className="flex flex-col items-center gap-8">
      <header className="w-full max-w-3xl space-y-2">
        {target ? (
          <h2 ref={targetHeading} tabIndex={-1} className="text-2xl font-bold">
            この企業の画像・OCRから生成
          </h2>
        ) : (
          <h1 className="text-3xl font-bold text-slate-900">
            Briefing Note AI
          </h1>
        )}
        {target ? (
          <>
            <p>保存先：{target.name}（企業は固定）</p>
            <button type="button" onClick={close}>
              生成を終了して企業詳細へ戻る
            </button>
          </>
        ) : (
          <p>
            企業へ保存する場合は企業詳細から生成を開始してください。この入口は単発の生成・復習・出力です。
          </p>
        )}
        {notice && <p role="status">{notice}</p>}
        {retained && !targetDirty && (
          <button type="button" onClick={resume}>
            保持した生成入力を確認して再開
          </button>
        )}
        {target && targetCandidate && currentStepId !== "markdown" && (
          <button type="button" onClick={() => setCurrentStepId("markdown")}>
            最後の生成候補へ戻る
          </button>
        )}
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
            onChangeCompanyEventInfo={(info) => {
              setCompanyEventInfo(info);
              if (target) {
                workflow.current.invalidate();
                ocrAbortControllerRef.current?.abort();
                setIsOcrRunning(false);
                setTargetDirty(true);
              }
            }}
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
            onChangeOcrText={(value) => {
              setOcrText(value);
              if (target) {
                workflow.current.invalidate();
                webSupplementRequestIdRef.current++;
                isLoadingWebSupplementsRef.current = false;
                setIsLoadingWebSupplements(false);
                setTargetDirty(true);
              }
            }}
            hasOcrError={hasOcrError}
            ocrErrorMessage={ocrErrorMessage}
            isOcrRunning={isOcrRunning}
            isGeneratingMarkdown={isGeneratingMarkdown}
            isPreparingWebSupplements={isLoadingWebSupplements}
            onBack={goBack}
            onRetryOcr={handleRunOcr}
            onNext={handlePrepareWebSupplements}
          />
        )}
        {currentStepId === "web-supplement" && (
          <WebSupplementStep
            supplements={webSupplements}
            isLoading={isLoadingWebSupplements}
            isGeneratingMarkdown={isGeneratingMarkdown}
            onSetStatus={handleSetWebSupplementStatus}
            onBack={goBack}
            onNext={() => handleGenerateMarkdown()}
            onSkip={handleSkipWebSupplements}
          />
        )}
        {target && hasGenerationError && (
          <p role="alert">
            生成または出自確認に失敗しました。新しい候補は保存できません。訂正入力と最後の有効候補を保持しています。
          </p>
        )}
        {currentStepId === "markdown" &&
          !interviewReview &&
          (!target || !targetCandidate) && (
            <div className="space-y-6">
              <MarkdownEditStep
                markdownText={markdownText}
                companyName={companyEventInfo.companyName}
                onChangeMarkdownText={handleChangeMarkdownText}
                hasGenerationError={hasGenerationError}
                isGeneratingInterviewReview={isGeneratingInterviewReview}
                onBack={goBack}
                onGenerateInterviewReview={
                  structuredMemo
                    ? () => handleGenerateInterviewReview()
                    : undefined
                }
              />
              {hasInterviewReviewError && (
                <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                  面接前復習メモの生成に失敗しました。時間をおいて再試行してください。
                </div>
              )}
            </div>
          )}
        {currentStepId === "markdown" &&
          target &&
          targetCandidate &&
          !interviewReview && (
            <div className="space-y-5">
              <GenerationSavePanel
                saveSession={saveSession.current}
                target={target}
                value={targetCandidate}
                onChange={changeCandidate}
                onCommitted={(sent) => committedCallback.current(sent)}
                onOpenSaved={
                  onOpenSaved
                    ? async (memo) => {
                        const open = async () => {
                          generationDrafts.discard(
                            target.ownerId,
                            target.companyId,
                          );
                          await onOpenSaved(memo);
                        };
                        if (workingInputChanged(targetCandidate))
                          setDiscard({ action: () => void open() });
                        else await open();
                      }
                    : undefined
                }
                onClose={close}
              />
              {workingInputChanged(targetCandidate) && (
                <p role="status">
                  この候補とは別に、新しい訂正入力が残っています。候補の保存には混ぜません。画像・OCR確認へ戻って続きを編集できます。
                </p>
              )}
              <button type="button" onClick={() => setCurrentStepId("ocr")}>
                画像・OCR確認へ戻る
              </button>
              <button
                type="button"
                onClick={handleGenerateInterviewReview}
                disabled={isGeneratingInterviewReview}
              >
                面接前復習メモを生成
              </button>
              {hasInterviewReviewError && (
                <p role="alert">
                  復習の生成に失敗しました。候補は保持しています。
                </p>
              )}
            </div>
          )}
        {currentStepId === "markdown" && interviewReview && (
          <InterviewReviewView
            review={interviewReview}
            companyName={companyEventInfo.companyName}
            memo={structuredMemo ?? undefined}
            webSupplements={getAdoptedWebSupplements()}
            onClose={() => setInterviewReview(null)}
          />
        )}
      </div>
      {discard && (
        <ConfirmDialog
          title="未保存の入力を破棄しますか"
          description="取消で現在の生成・編集を続けられます。結果不明の保存要求は同じ本人の操作照会用に保持します。"
          confirmLabel="破棄して続ける"
          onCancel={() => {
            discard.cancel?.();
            setDiscard(null);
          }}
          onConfirm={() => {
            const action = discard.action;
            setDiscard(null);
            action();
          }}
        />
      )}
    </div>
  );
}
