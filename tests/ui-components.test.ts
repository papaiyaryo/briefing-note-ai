import { createElement, type ComponentProps } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

import { MarkdownEditStep } from "../src/components/steps/MarkdownEditStep";
import { OcrReviewStep } from "../src/components/steps/OcrReviewStep";
import { UploadStep } from "../src/components/steps/UploadStep";
import { EMPTY_COMPANY_EVENT_INFO } from "../src/lib/markdown";
import type { SelectedImage } from "../src/lib/upload";

function createSelectedImage(): SelectedImage {
  return {
    file: new File(["dummy"], "memo.png", { type: "image/png" }),
    previewUrl: "blob:http://localhost/memo-preview",
  };
}

function renderUploadStep(props: Partial<ComponentProps<typeof UploadStep>>) {
  return renderToStaticMarkup(
    createElement(UploadStep, {
      selectedImage: null,
      onSelectImage: vi.fn(),
      companyEventInfo: EMPTY_COMPANY_EVENT_INFO,
      onChangeCompanyEventInfo: vi.fn(),
      isOcrRunning: false,
      onNext: vi.fn(),
      onSimulateOcrFailure: vi.fn(),
      ...props,
    }),
  );
}

function renderOcrReviewStep(
  props: Partial<ComponentProps<typeof OcrReviewStep>>,
) {
  return renderToStaticMarkup(
    createElement(OcrReviewStep, {
      selectedImage: null,
      ocrText: "",
      onChangeOcrText: vi.fn(),
      hasOcrError: false,
      ocrErrorMessage: "",
      isOcrRunning: false,
      isGeneratingMarkdown: false,
      onBack: vi.fn(),
      onRetryOcr: vi.fn(),
      onNext: vi.fn(),
      ...props,
    }),
  );
}

function renderMarkdownEditStep(
  props: Partial<ComponentProps<typeof MarkdownEditStep>>,
) {
  return renderToStaticMarkup(
    createElement(MarkdownEditStep, {
      markdownText: "",
      companyName: "",
      onChangeMarkdownText: vi.fn(),
      hasGenerationError: false,
      onBack: vi.fn(),
      ...props,
    }),
  );
}

describe("UploadStep", () => {
  it("画像未選択時にアップロード案内、企業情報入力欄、実行ボタンを表示する", () => {
    const html = renderUploadStep({});

    expect(html).toContain("メモ画像をアップロード");
    expect(html).toContain("ここに画像をドラッグ&amp;ドロップ");
    expect(html).toContain("ファイルを選択");
    expect(html).toContain("企業名");
    expect(html).toContain("イベント名");
    expect(html).toContain("説明会日");
    expect(html).toContain("OCR を実行する");
    expect(html).toContain("disabled");
  });

  it("画像選択済み時にプレビュー、ファイル名、OCR 実行ボタンを表示する", () => {
    const html = renderUploadStep({
      selectedImage: createSelectedImage(),
      companyEventInfo: {
        companyName: "サンプル株式会社",
        eventName: "夏季インターン説明会",
        eventDate: "2026-06-17",
      },
    });

    expect(html).toContain("アップロードしたメモ画像");
    expect(html).toContain("memo.png");
    expect(html).toContain("別の画像を選択");
    expect(html).toContain("サンプル株式会社");
    expect(html).toContain("OCR を実行する");
  });
});

describe("OcrReviewStep", () => {
  it("OCR 結果テキストエリアと主要操作ボタンを表示する", () => {
    const html = renderOcrReviewStep({
      selectedImage: createSelectedImage(),
      ocrText: "説明会メモのOCR結果",
    });

    expect(html).toContain("OCR 結果を確認");
    expect(html).toContain("アップロードしたメモ画像");
    expect(html).toContain("OCR 結果");
    expect(html).toContain("説明会メモのOCR結果");
    expect(html).toContain("アップロードに戻る");
    expect(html).toContain("OCR を再実行");
    expect(html).toContain("Markdown を生成する");
  });

  it("OCR 結果が空の場合は空状態メッセージを出し、Markdown 生成ボタンを無効化する", () => {
    const html = renderOcrReviewStep({
      ocrText: "   ",
      hasOcrError: true,
      ocrErrorMessage: "OCR に失敗しました",
    });

    expect(html).toContain("画像が選択されていません");
    expect(html).toContain("OCR に失敗しました");
    expect(html).toContain("結果が空です");
    expect(html).toContain("Markdown を生成する</button>");
    expect(html).toContain("disabled");
  });
});

describe("MarkdownEditStep", () => {
  it("Markdown エディタ、プレビュー、ダウンロードボタンを表示する", () => {
    const html = renderMarkdownEditStep({
      markdownText: "# サンプル株式会社\n\n- 事実",
      companyName: "サンプル株式会社",
    });

    expect(html).toContain("Markdown を編集してダウンロード");
    expect(html).toContain("編集");
    expect(html).toContain("プレビュー");
    expect(html).toContain("# サンプル株式会社");
    expect(html).toContain("サンプル株式会社");
    expect(html).toContain("OCR 確認に戻る");
    expect(html).toContain(".md をダウンロード");
  });

  it("Markdown が空の場合は案内を出し、ダウンロードボタンを無効化する", () => {
    const html = renderMarkdownEditStep({
      markdownText: "   ",
      hasGenerationError: true,
    });

    expect(html).toContain("Markdown の生成に失敗しました");
    expect(html).toContain("内容が空のためダウンロードできません");
    expect(html).toContain(".md をダウンロード</button>");
    expect(html).toContain("disabled");
  });
});
