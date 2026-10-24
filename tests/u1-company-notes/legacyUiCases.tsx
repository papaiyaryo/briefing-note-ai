import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { HookHarness, button, find, invoke, text } from "./hookHarness";
import { CompanyComparePage } from "../../src/components/compare/CompanyComparePage";
import { UploadStep } from "../../src/components/steps/UploadStep";
import { MarkdownEditStep } from "../../src/components/steps/MarkdownEditStep";
import { WebSupplementStep } from "../../src/components/steps/WebSupplementStep";
import { InterviewReviewView } from "../../src/components/InterviewReviewView";
import {
  saveCompanyMemoForComparison,
  loadSavedCompanyMemos,
} from "../../src/lib/comparison";
import { buildDummyInterviewReview } from "../../src/lib/interviewReview/dummy";
import { emptyStructure } from "./fixtures";
import type { CompanyMemoStructured } from "../../src/lib/structure/schema";
describe("existing browser-local entry regressions under workspace navigation", () => {
  it("retains legacy comparison storage and explicit interest edits", async () => {
    const memo: CompanyMemoStructured = emptyStructure();
    memo.overview.companyName = "架空旧比較";
    memo.strengths = ["説明会由来の強み"];
    saveCompanyMemoForComparison({ memo, markdown: "本人本文" });
    const h = new HookHarness(() => CompanyComparePage());
    h.render();
    await h.settle();
    expect(text(h.tree)).toContain("架空旧比較");
    await invoke(
      find(h.tree, (e) => e.type === "select"),
      "onChange",
      { target: { value: "high" } },
    );
    h.render();
    expect(loadSavedCompanyMemos()[0].interestNote.level).toBe("high");
    await invoke(
      find(h.tree, (e) => e.type === "textarea"),
      "onChange",
      { target: { value: "本人だけの印象" } },
    );
    h.render();
    expect(loadSavedCompanyMemos()[0].interestNote.memo).toBe("本人だけの印象");
    await invoke(
      find(h.tree, (e) => e.type === "input" && e.props.type === "checkbox"),
      "onChange",
    );
    h.render();
    expect(text(h.tree)).not.toContain("説明会由来の強み");
    h.unmount();
  });
  it("renders existing review categories and escaped source text", () => {
    const memo = emptyStructure();
    memo.overview.companyName = "<script>dummy</script>";
    const html = renderToStaticMarkup(
      <InterviewReviewView
        review={buildDummyInterviewReview(memo)}
        memo={memo}
        onClose={() => {}}
      />,
    );
    expect(html).toContain("志望理由");
    expect(html).toContain("逆質問");
    expect(html).not.toContain("<script>");
  });
  it("upload remains explicit and rejects non-images before callback", async () => {
    const onAddImages = vi.fn(),
      onChange = vi.fn();
    const props = {
      selectedImages: [],
      onAddImages,
      onRemoveImage: vi.fn(),
      companyEventInfo: { companyName: "", eventName: "", eventDate: "" },
      onChangeCompanyEventInfo: onChange,
      isOcrRunning: false,
      ocrProgressLabel: "",
      onNext: vi.fn(),
      onSimulateOcrFailure: vi.fn(),
    };
    const h = new HookHarness(() => UploadStep(props));
    h.render();
    await invoke(
      find(h.tree, (e) => e.type === "input" && e.props.type === "file"),
      "onChange",
      {
        target: {
          files: [new File(["dummy"], "dummy.txt", { type: "text/plain" })],
          value: "",
        },
      },
    );
    h.render();
    expect(onAddImages).not.toHaveBeenCalled();
    const input = find(
      h.tree,
      (e) => e.type === "input" && e.props.type === "text",
    );
    await invoke(input, "onChange", { target: { value: "架空企業" } });
    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({ companyName: "架空企業" }),
    );
    h.unmount();
  });
  it("Markdown preview and legacy local save stay separate from server persistence", async () => {
    const memo = emptyStructure();
    memo.overview.companyName = "架空企業";
    const h = new HookHarness(() =>
      MarkdownEditStep({
        markdownText: "本人本文",
        companyName: "架空企業",
        structuredMemo: memo,
        onChangeMarkdownText: vi.fn(),
        hasGenerationError: false,
        onBack: vi.fn(),
      }),
    );
    h.render();
    await invoke(button(h.tree, "プレビュー"), "onClick");
    h.render();
    expect(
      find(
        h.tree,
        (e) =>
          typeof e.type === "function" && e.type.name === "MarkdownPreview",
      ).props.markdown,
    ).toBeDefined();
    const localSave = find(
      h.tree,
      (e) =>
        typeof e.props.onClick === "function" &&
        text(e.props.children as React.ReactNode).includes("比較用に保存"),
    );
    await invoke(localSave, "onClick");
    h.render();
    expect(loadSavedCompanyMemos()[0].markdown).toBe("本人本文");
    h.unmount();
  });
  it("Web result actions preserve adoption status as an explicit choice", async () => {
    const onSetStatus = vi.fn();
    const item = {
      id: "web-1",
      category: "採用",
      content: "Web補足",
      sourceTitle: "架空出典",
      sourceUrl: "https://example.test/",
      fetchedAt: "2026-10-16T00:00:00Z",
      confidence: "requires_check" as const,
      status: "pending" as const,
    };
    const h = new HookHarness(() =>
      WebSupplementStep({
        supplements: [item],
        isLoading: false,
        isGeneratingMarkdown: false,
        onSetStatus,
        onBack: vi.fn(),
        onNext: vi.fn(),
        onSkip: vi.fn(),
      }),
    );
    h.render();
    expect(text(h.tree)).toContain("要確認");
    const adopt = find(
      h.tree,
      (e) =>
        typeof e.props.onClick === "function" &&
        text(e.props.children as React.ReactNode).includes("採用"),
    );
    await invoke(adopt, "onClick");
    expect(onSetStatus).toHaveBeenCalledWith("web-1", "adopted");
    h.unmount();
  });
});
