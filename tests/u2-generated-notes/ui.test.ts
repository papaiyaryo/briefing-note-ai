import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  HookHarness,
  button,
  field,
  named,
  invoke,
  text,
  change,
  browserGlobals,
  ConditionalChild,
  elements,
} from "./uiHarness";
import { GenerationCandidateFields } from "../../src/components/generation/GenerationCandidateFields";
import {
  GenerationSavePanel,
  type GenerationTarget,
} from "../../src/components/generation/GenerationSavePanel";
import { BriefingNoteFlow } from "../../src/components/BriefingNoteFlow";
import { CompanyDetail } from "../../src/components/workspace/CompanyDetail";
import {
  WorkspaceClient,
  type FixedRequest,
} from "../../src/lib/workspace/client";
import {
  GenerationDrafts,
  generationDrafts,
} from "../../src/lib/generation/draft";
import { GenerationSaveIntent } from "../../src/lib/generation/save";
import { mapGeneratedCandidate } from "../../src/lib/generation/candidate";
import { workspaceDrafts } from "../../src/lib/workspace/draft";
import { buildBoardSnapshot } from "../../src/lib/workspace/board";
import * as download from "../../src/lib/download";
import { buildDummyInterviewReview } from "../../src/lib/interviewReview/dummy";
import type {
  Company,
  GeneratedCandidate,
  Memo,
  MutationOutcome,
} from "../../src/lib/workspace/contracts";
import {
  candidate,
  owner,
  otherOwner,
  companyId,
  operationId,
  memoId,
} from "./fixtures";
const router = vi.hoisted(() => ({ push: vi.fn() }));
vi.mock("next/navigation", () => ({ useRouter: () => router }));
beforeEach(() => {
  browserGlobals();
  workspaceDrafts.switchOwner(owner);
  workspaceDrafts.discardAll();
  workspaceDrafts.resolve(`generation:${companyId}`);
  workspaceDrafts.switchOwner(otherOwner);
  workspaceDrafts.discardAll();
  workspaceDrafts.resolve(`generation:${companyId}`);
  workspaceDrafts.switchOwner(owner);
  vi.spyOn(URL, "revokeObjectURL").mockImplementation(() => {});
  vi.stubGlobal(
    "fetch",
    vi.fn(() => {
      throw new Error("Unexpected external request");
    }),
  );
});
afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});
function company(): Company {
  return {
    companyId,
    name: "本人が選んだ企業",
    version: operationId,
    industry: null,
    interestLevel: null,
    personalNote: null,
    selectionStatus: "not_applied",
    nextSelectionDate: null,
    applicationDeadline: null,
    officialUrl: null,
    createdAt: "2026-10-16T00:00:00Z",
    updatedAt: "2026-10-16T00:00:00Z",
  };
}
function target(client = new WorkspaceClient()): GenerationTarget {
  return {
    companyId,
    name: company().name,
    version: operationId,
    ownerId: owner,
    client,
  };
}
function outcome(body: {
  operationId: string;
  memoId: string;
}): MutationOutcome {
  return {
    ...body,
    companyId,
    action: "memo_create",
    resultingVersion: operationId,
    committedAt: "2026-10-16T00:00:00Z",
  };
}
function savedMemo(c: GeneratedCandidate, id = memoId): Memo {
  return {
    markdown: c.markdown,
    structuredContent: c.structuredContent,
    correctedOcr: c.correctedOcr,
    event: c.event,
    adoptedWebSources: c.adoptedWebSources,
    comparisonReason: c.comparisonReason,
    origin: c.origin,
    providerOrigin: c.providerOrigin,
    companyId,
    memoId: id,
    version: operationId,
    createdAt: "2026-10-16T00:00:00Z",
    updatedAt: "2026-10-16T00:00:00Z",
  };
}
function panel(
  fetcher: (path: string, init: RequestInit) => Promise<Response>,
  initial = candidate(),
) {
  let value = initial;
  const client = new WorkspaceClient({
    fetch: vi.fn((path, init) => fetcher(String(path), init ?? {})),
    sleep: async () => {},
  });
  let destination = target(client);
  const onChange = vi.fn((next: GeneratedCandidate) => {
      value = next;
    }),
    onCommitted = vi.fn(),
    onOpenSaved = vi.fn().mockResolvedValue(undefined),
    onClose = vi.fn();
  const h = new HookHarness(() =>
    GenerationSavePanel({
      target: destination,
      value,
      onChange,
      onCommitted,
      onOpenSaved,
      onClose,
    }),
  );
  return {
    h,
    client,
    onChange,
    onCommitted,
    onOpenSaved,
    onClose,
    setValue: (next: GeneratedCandidate) => {
      value = next;
    },
    setTarget: (next: GenerationTarget) => {
      destination = next;
    },
  };
}
describe("candidate controls / AC5.1 AC5.2 AC6.2", () => {
  it("edits Markdown without rewriting structure or OCR", async () => {
    const c = candidate(),
      onChange = vi.fn();
    const h = new HookHarness(() =>
      GenerationCandidateFields({ value: c, onChange }),
    );
    h.render();
    await invoke(
      field(h.tree, "generation-markdown"),
      "onChange",
      change("  本人の本文\n"),
    );
    expect(onChange).toHaveBeenCalledWith({ ...c, markdown: "  本人の本文\n" });
  });
  it("edits a structured fact without rewriting Markdown", async () => {
    const c = candidate(),
      onChange = vi.fn();
    const h = new HookHarness(() =>
      GenerationCandidateFields({ value: c, onChange }),
    );
    h.render();
    await invoke(
      field(h.tree, "generation-facts-0"),
      "onChange",
      change("本人が確認した事実"),
    );
    expect(onChange).toHaveBeenCalledWith({
      ...c,
      structuredContent: {
        ...c.structuredContent,
        facts: ["本人が確認した事実"],
      },
    });
  });
  it("keeps corrected OCR separate from both canonical fields", async () => {
    const c = candidate(),
      onChange = vi.fn();
    const h = new HookHarness(() =>
      GenerationCandidateFields({ value: c, onChange }),
    );
    h.render();
    await invoke(
      field(h.tree, "generation-corrected-ocr"),
      "onChange",
      change("追加の訂正"),
    );
    expect(onChange).toHaveBeenCalledWith({ ...c, correctedOcr: "追加の訂正" });
  });
  it("edits event information without renaming the selected company", async () => {
    const c = candidate(),
      onChange = vi.fn();
    const h = new HookHarness(() =>
      GenerationCandidateFields({ value: c, onChange }),
    );
    h.render();
    await invoke(
      field(h.tree, "generation-event-companyName"),
      "onChange",
      change("紙に記載の別名"),
    );
    expect(onChange).toHaveBeenCalledWith({
      ...c,
      event: { ...c.event, companyName: "紙に記載の別名" },
    });
  });
  it("lets the person explicitly correct a 要確認 date without altering the Markdown", async () => {
    const c = candidate();
    c.structuredContent.overview.eventDate = "要確認";
    const onChange = vi.fn();
    const h = new HookHarness(() =>
      GenerationCandidateFields({ value: c, onChange }),
    );
    h.render();
    expect(field(h.tree, "generation-overview-eventDate").props.value).toBe(
      "要確認",
    );
    await invoke(
      field(h.tree, "generation-overview-eventDate"),
      "onChange",
      change(""),
    );
    expect(onChange).toHaveBeenCalledWith({
      ...c,
      structuredContent: {
        ...c.structuredContent,
        overview: { ...c.structuredContent.overview, eventDate: "" },
      },
    });
  });
  it("adds and removes section entries explicitly", async () => {
    let c = candidate();
    const h = new HookHarness(() =>
      GenerationCandidateFields({
        value: c,
        onChange: (next) => {
          c = next;
        },
      }),
    );
    h.render();
    await invoke(button(h.tree, "説明会の事実を追加"), "onClick");
    h.render();
    expect(c.structuredContent.facts).toEqual(["説明会の事実", ""]);
    await invoke(button(h.tree, "説明会の事実 1を削除"), "onClick");
    expect(c.structuredContent.facts).toEqual([""]);
  });
  it("shows adopted sources as a separate, dated 要確認 category", () => {
    const html = renderToStaticMarkup(
      React.createElement(GenerationCandidateFields, {
        value: candidate(),
        onChange: () => {},
      }),
    );
    expect(html).toContain("Web補足");
    expect(html).toContain("https://example.test/source");
    expect(html).toContain("2026-10-16T00:00:00Z");
    expect(html).toContain("要確認");
  });
  it("exports current Markdown and renders dangerous text safely", async () => {
    const c = candidate();
    c.markdown = "<script>fixture()</script> 本人本文";
    c.adoptedWebSources[0].sourceUrl = "javascript:fixture()";
    const output = vi
      .spyOn(download, "downloadMarkdownFile")
      .mockImplementation(() => {});
    const h = new HookHarness(() =>
      GenerationCandidateFields({ value: c, onChange: () => {} }),
    );
    h.render();
    await invoke(button(h.tree, "候補の.mdを出力"), "onClick");
    expect(output).toHaveBeenCalledWith(c.markdown, expect.any(String));
    const html = renderToStaticMarkup(
      React.createElement(GenerationCandidateFields, {
        value: c,
        onChange: () => {},
      }),
    );
    expect(html).not.toContain("<script>");
    expect(html).not.toContain('href="javascript:');
  });
});
describe("explicit save panel / BR2.1 BR4.1 SD1 RD1", () => {
  it("fixes selected company and labels mismatched generated name/dummy without writing on render", async () => {
    const fetcher = vi.fn();
    const p = panel(fetcher);
    p.h.render();
    await p.h.settle();
    expect(text(p.h.tree)).toContain(company().name);
    expect(text(p.h.tree)).toContain("企業名が異なります");
    expect(text(p.h.tree)).toContain("dummy");
    expect(fetcher).not.toHaveBeenCalled();
    p.h.unmount();
  });
  it("sends one complete C2 only on explicit save and reads the same ID", async () => {
    let body:
      | { operationId: string; memoId: string; candidate: GeneratedCandidate }
      | undefined;
    const paths: string[] = [];
    const p = panel(async (path, init) => {
      paths.push(path);
      if (init.method === "POST") {
        body = JSON.parse(String(init.body));
        return Response.json(outcome(body!));
      }
      return Response.json(savedMemo(body!.candidate, body!.memoId));
    });
    p.h.render();
    await p.h.settle();
    await invoke(button(p.h.tree, "この企業へ保存"), "onClick");
    await p.h.settle();
    expect(paths[0]).toBe(`/api/v1/companies/${companyId}/memos`);
    expect(body?.candidate).toEqual(candidate());
    expect(paths[1]).toBe(
      `/api/v1/companies/${companyId}/memos/${body!.memoId}`,
    );
    expect(text(p.h.tree)).toContain("保存は確定しました");
    expect(p.onCommitted).toHaveBeenCalledOnce();
    p.h.unmount();
  });
  it("keeps invalid edits and rejects save before transport", async () => {
    const fetcher = vi.fn();
    const c = candidate();
    c.markdown = " \n";
    const p = panel(fetcher, c);
    p.h.render();
    await p.h.settle();
    await invoke(button(p.h.tree, "この企業へ保存"), "onClick");
    await p.h.settle();
    expect(fetcher).not.toHaveBeenCalled();
    expect(text(p.h.tree)).toContain("確認");
    expect(named(p.h.tree, "GenerationCandidateFields").props.value).toEqual(c);
    p.h.unmount();
  });
  it("keeps rejected input and permits explicit correction", async () => {
    const p = panel(async () =>
      Response.json({ error: { code: "not_found" } }, { status: 404 }),
    );
    p.h.render();
    await p.h.settle();
    await invoke(button(p.h.tree, "この企業へ保存"), "onClick");
    await p.h.settle();
    expect(text(p.h.tree)).toContain("保存を完了できません");
    expect(p.onChange).not.toHaveBeenCalled();
    expect(named(p.h.tree, "GenerationCandidateFields").props.value).toEqual(
      candidate(),
    );
    p.h.unmount();
  });
  it("requires lookup before same-request retry and retains edits made while unknown", async () => {
    const posts: string[] = [];
    let body: {
      operationId: string;
      memoId: string;
      candidate: GeneratedCandidate;
    };
    const p = panel(async (path, init) => {
      if (init.method === "POST") {
        posts.push(String(init.body));
        body = JSON.parse(String(init.body));
        if (posts.length === 1) throw new TypeError("fixture interruption");
        return Response.json(outcome(body));
      }
      return Response.json(
        path.includes("operations")
          ? { state: "unknown" }
          : savedMemo(body.candidate, body.memoId),
      );
    });
    p.h.render();
    await p.h.settle();
    await invoke(button(p.h.tree, "この企業へ保存"), "onClick");
    await p.h.settle();
    expect(button(p.h.tree, "同じ要求を再試行").props.disabled).toBe(true);
    p.setValue({ ...candidate(), markdown: "別の未保存編集" });
    p.h.render();
    await invoke(button(p.h.tree, "操作結果を確認"), "onClick");
    await p.h.settle();
    expect(button(p.h.tree, "同じ要求を再試行").props.disabled).toBe(false);
    await invoke(button(p.h.tree, "同じ要求を再試行"), "onClick");
    await p.h.settle();
    expect(posts).toHaveLength(2);
    expect(posts[1]).toBe(posts[0]);
    expect(
      (
        named(p.h.tree, "GenerationCandidateFields").props
          .value as GeneratedCandidate
      ).markdown,
    ).toBe("別の未保存編集");
    expect(text(p.h.tree)).toContain("未保存編集");
    p.h.unmount();
  });
  it("retains committed status when the follow-up GET fails", async () => {
    let body: {
      operationId: string;
      memoId: string;
      candidate: GeneratedCandidate;
    };
    let postCount = 0;
    const p = panel(async (path, init) => {
      if (init.method === "POST") {
        postCount++;
        body = JSON.parse(String(init.body));
        throw new TypeError("fixture interruption");
      }
      if (path.includes("operations"))
        return Response.json({ state: "committed", outcome: outcome(body) });
      throw new TypeError("fixture read failure");
    });
    p.h.render();
    await p.h.settle();
    await invoke(button(p.h.tree, "この企業へ保存"), "onClick");
    await p.h.settle();
    await invoke(button(p.h.tree, "操作結果を確認"), "onClick");
    await p.h.settle();
    expect(postCount).toBe(1);
    expect(text(p.h.tree)).toContain("保存は確定しました");
    expect(text(p.h.tree)).toContain("再取得に失敗");
    expect(p.onCommitted).toHaveBeenCalledOnce();
    p.h.unmount();
  });
  it("does not apply a late saved notification after owner change", async () => {
    let finish!: (r: Response) => void;
    let body: { operationId: string; memoId: string };
    const p = panel(async (_path, init) => {
      body = JSON.parse(String(init.body));
      return new Promise<Response>((r) => {
        finish = r;
      });
    });
    p.h.render();
    await p.h.settle();
    const sending = invoke(button(p.h.tree, "この企業へ保存"), "onClick");
    await p.h.settle();
    p.setTarget({ ...target(p.client), ownerId: otherOwner });
    p.setValue({ ...candidate(), markdown: "別本人の候補" });
    p.h.render();
    await p.h.settle();
    finish(Response.json(outcome(body!)));
    await sending;
    await p.h.settle();
    expect(p.onCommitted).not.toHaveBeenCalled();
    expect(p.onOpenSaved).not.toHaveBeenCalled();
    p.h.unmount();
  });
  it("suppresses repeat save while in flight", async () => {
    let finish!: (r: Response) => void;
    let body: { operationId: string; memoId: string };
    const fetcher = vi.fn(async (_path: string, init: RequestInit) => {
      if (init.method === "POST") {
        body = JSON.parse(String(init.body));
        return new Promise<Response>((r) => {
          finish = r;
        });
      }
      return Response.json(savedMemo(candidate(), body!.memoId));
    });
    const p = panel(fetcher);
    p.h.render();
    await p.h.settle();
    const action = button(p.h.tree, "この企業へ保存");
    const sending = invoke(action, "onClick");
    await p.h.settle();
    await invoke(action, "onClick");
    expect(fetcher).toHaveBeenCalledTimes(1);
    finish(Response.json(outcome(body!)));
    await sending;
    await p.h.settle();
    expect(
      fetcher.mock.calls.filter((call) => call[1].method === "POST"),
    ).toHaveLength(1);
    p.h.unmount();
  });
});
type PendingDrafts = GenerationDrafts & {
  markPending: (owner: string, company: string, request: FixedRequest) => void;
  pending: (owner: string, company: string) => FixedRequest | null;
  resolve: (owner: string, company: string) => void;
};
describe("owner-bound unsaved recovery / BR1.2 BR4.3", () => {
  it("retains invalid editable text/date without putting images in memory vault", () => {
    const drafts = new GenerationDrafts();
    const c = candidate();
    c.markdown = "";
    c.structuredContent.overview.eventDate = "要確認";
    const value = {
      correctedOcr: "訂正中",
      event: c.event,
      candidate: c,
      file: new File(["fixture"], "private.png"),
      imageUrl: "blob:private",
    };
    drafts.put(owner, companyId, value, operationId);
    expect(drafts.recover(owner, companyId, operationId)?.value).toEqual({
      correctedOcr: "訂正中",
      event: c.event,
      candidate: c,
    });
  });
  it("makes generated dirty state visible to the existing navigation guard", () => {
    generationDrafts.put(
      owner,
      companyId,
      {
        correctedOcr: "訂正中",
        event: candidate().event,
        candidate: candidate(),
      },
      operationId,
    );
    workspaceDrafts.switchOwner(owner);
    expect(workspaceDrafts.get(`generation:${companyId}`)).not.toBeNull();
    generationDrafts.discard(owner, companyId);
  });
  it("keeps the exact pending request isolated by owner and company", () => {
    const d = new GenerationDrafts() as PendingDrafts;
    const client = new WorkspaceClient();
    const request = client.prepare(
      `/api/v1/companies/${companyId}/memos`,
      "POST",
      { operationId, memoId, candidate: candidate() },
    );
    d.markPending(owner, companyId, request);
    expect(d.pending(otherOwner, companyId)).toBeNull();
    expect(d.pending(owner, "another")).toBeNull();
    expect(d.pending(owner, companyId)).toEqual(request);
    expect(() =>
      d.markPending(owner, companyId, { ...request, body: "different" }),
    ).toThrow();
    d.resolve(owner, companyId);
    expect(d.pending(owner, companyId)).toBeNull();
  });
  it("resumes a frozen unknown request without generating new IDs or using current edited draft", () => {
    const client = new WorkspaceClient();
    const first = new GenerationSaveIntent(client, companyId, candidate(), {
      operationId,
      memoId,
    });
    const restore = (
      GenerationSaveIntent as typeof GenerationSaveIntent & {
        restore: (
          client: WorkspaceClient,
          company: string,
          request: FixedRequest,
        ) => GenerationSaveIntent;
      }
    ).restore;
    const resumed = restore(client, companyId, first.request);
    expect(resumed.request).toEqual(first.request);
    expect(resumed.state).toBe("unknown");
  });
});
function mockGeneration(receipt = true) {
  const c = candidate();
  vi.stubGlobal(
    "fetch",
    vi.fn(async (path) =>
      Response.json(
        String(path).includes("/ocr")
          ? { text: "架空OCR", provider: "dummy" }
          : String(path).includes("web-supplement")
            ? {
                provider: "dummy",
                result: {
                  companyName: "架空生成名",
                  items: c.adoptedWebSources.map((s) => ({
                    title: s.category,
                    summary: s.content,
                    sourceUrl: s.sourceUrl,
                    retrievedAt: s.fetchedAt,
                    confidence: "low",
                    needsVerification: true,
                    sourceType: "non_official",
                  })),
                },
              }
            : {
                memo: c.structuredContent,
                provider: "dummy",
                ...(receipt ? { generationReceipt: c.generationReceipt } : {}),
              },
      ),
    ),
  );
}
function flowHarness(destination: GenerationTarget | null = target()) {
  let current = destination ?? undefined;
  const props = () => ({
    target: current,
    onClose: vi.fn(),
    onOpenSaved: vi.fn().mockResolvedValue(undefined),
  });
  const h = new HookHarness(() =>
    (BriefingNoteFlow as (props: unknown) => React.ReactNode)(props()),
  );
  return {
    h,
    setTarget: (next: GenerationTarget) => {
      current = next;
    },
  };
}

async function joinedSaveFlow() {
  mockGeneration();
  const original = vi.mocked(fetch).getMockImplementation()!;
  let failGeneration = false;
  vi.mocked(fetch).mockImplementation(async (path, init) => {
    if (String(path).includes("interview-review"))
      return Response.json({
        provider: "dummy",
        review: buildDummyInterviewReview(candidate().structuredContent),
      });
    if (failGeneration && String(path).includes("/structure"))
      return Response.json(
        { code: "provider_error", message: "fixture failure" },
        { status: 502 },
      );
    return original(path, init);
  });
  const posts: string[] = [],
    reads: string[] = [];
  let mode: "ok" | "unknown" | "pending" = "ok";
  let failRead = false;
  let complete: (() => void) | undefined;
  let sent: {
    operationId: string;
    memoId: string;
    candidate: GeneratedCandidate;
  };
  const client = new WorkspaceClient({
    fetch: vi.fn(async (path, init) => {
      if (init?.method === "POST") {
        posts.push(String(init.body));
        sent = JSON.parse(String(init.body));
        if (mode === "unknown") throw new Error("fixture response lost");
        if (mode === "pending")
          return new Promise<Response>((resolve) => {
            complete = () => resolve(Response.json(outcome(sent)));
          });
        return Response.json(outcome(sent));
      }
      reads.push(String(path));
      if (String(path).includes("/operations/"))
        return Response.json({ state: "unknown" });
      if (failRead) return Response.json({}, { status: 503 });
      return Response.json(savedMemo(sent.candidate, sent.memoId));
    }),
    sleep: async () => {},
  });
  let destination = target(client);
  const onOpenSaved = vi.fn().mockResolvedValue(undefined);
  const h = new HookHarness(() =>
    BriefingNoteFlow({
      target: destination,
      onOpenSaved,
      onClose: vi.fn(),
    }),
  );
  const child = new ConditionalChild(GenerationSavePanel);
  const sync = async () => {
    await h.settle();
    await child.sync(h.tree);
    await h.settle();
    await child.sync(h.tree);
  };
  await generate(h);
  await sync();
  const offered = (label: string) =>
    elements(child.tree).some(
      (e) =>
        e.type === "button" &&
        text(e.props.children as React.ReactNode) === label,
    );
  const click = async (label: string) => {
    await invoke(button(child.tree, label), "onClick");
    await sync();
  };
  const ocrRoundTrip = async () => {
    await invoke(button(h.tree, "画像・OCR確認へ戻る"), "onClick");
    await sync();
    expect(child.tree).toBeNull();
    await invoke(button(h.tree, "最後の生成候補へ戻る"), "onClick");
    await sync();
  };
  const regenerate = async () => {
    await invoke(button(h.tree, "画像・OCR確認へ戻る"), "onClick");
    await sync();
    await invoke(named(h.tree, "OcrReviewStep"), "onNext");
    await sync();
    await invoke(named(h.tree, "WebSupplementStep"), "onNext");
    await sync();
    const confirm = elements(h.tree).find(
      (e) => typeof e.type === "function" && e.type.name === "ConfirmDialog",
    );
    if (confirm) {
      await invoke(confirm, "onConfirm");
      await sync();
    }
  };
  return {
    h,
    child,
    posts,
    reads,
    sync,
    click,
    offered,
    ocrRoundTrip,
    regenerate,
    onOpenSaved,
    setMode: (next: typeof mode) => {
      mode = next;
    },
    failRead: (next: boolean) => {
      failRead = next;
    },
    failGeneration: (next: boolean) => {
      failGeneration = next;
    },
    finish: () => complete!(),
    setTarget: (next: GenerationTarget) => {
      destination = next;
    },
    destination: () => destination,
    cleanup: () => {
      child.unmount();
      h.unmount();
    },
  };
}

describe("revision-02 candidate lifetime / BR4.1 AC5.1.5", () => {
  it("R1 keeps one committed memo across actual OCR child remount", async () => {
    const f = await joinedSaveFlow();
    await f.click("この企業へ保存");
    expect(text(f.child.tree)).toContain("保存は確定しました");
    await f.ocrRoundTrip();
    expect(f.child.mounts).toBe(2);
    expect(f.child.unmounts).toBe(1);
    if (f.offered("この企業へ保存")) await f.click("この企業へ保存");
    expect(f.posts).toHaveLength(1);
    expect(new Set(f.posts.map((body) => JSON.parse(body).memoId)).size).toBe(
      1,
    );
    expect(text(f.child.tree)).toContain("保存は確定しました");
    expect(f.offered("この企業へ保存")).toBe(false);
    f.cleanup();
  });
  it("R2 keeps the committed candidate after actual review and close", async () => {
    const f = await joinedSaveFlow();
    await f.click("この企業へ保存");
    await invoke(button(f.h.tree, "面接前復習メモを生成"), "onClick");
    await f.sync();
    expect(f.child.tree).toBeNull();
    expect(named(f.h.tree, "InterviewReviewView").props.review).toEqual(
      buildDummyInterviewReview(candidate().structuredContent),
    );
    await invoke(named(f.h.tree, "InterviewReviewView"), "onClose");
    await f.sync();
    if (f.offered("この企業へ保存")) await f.click("この企業へ保存");
    expect(f.posts).toHaveLength(1);
    expect(text(f.child.tree)).toContain("保存は確定しました");
    expect(f.child.mounts).toBe(2);
    f.cleanup();
  });
  it("R3 retains committed status and the same memo retry after GET failure", async () => {
    const f = await joinedSaveFlow();
    f.failRead(true);
    await f.click("この企業へ保存");
    await f.ocrRoundTrip();
    expect(text(f.child.tree)).toContain("保存は確定しました");
    expect(text(f.child.tree)).toContain("再取得に失敗");
    f.failRead(false);
    await f.click("保存メモを再取得");
    const id = JSON.parse(f.posts[0]).memoId;
    expect(
      f.reads.filter((p) => p.includes("/memos/")).every((p) => p.endsWith(id)),
    ).toBe(true);
    expect(f.posts).toHaveLength(1);
    expect(f.offered("保存メモを開く")).toBe(true);
    f.cleanup();
  });
  it("R4 retains an in-flight intent through unmount and observes its commit", async () => {
    const f = await joinedSaveFlow();
    f.setMode("pending");
    const saving = invoke(button(f.child.tree, "この企業へ保存"), "onClick");
    await f.sync();
    await invoke(button(f.h.tree, "画像・OCR確認へ戻る"), "onClick");
    await f.sync();
    await invoke(
      named(f.h.tree, "OcrReviewStep"),
      "onChangeOcrText",
      "送信後に訂正したOCR",
    );
    await f.sync();
    await invoke(button(f.h.tree, "最後の生成候補へ戻る"), "onClick");
    await f.sync();
    expect(f.offered("この企業へ保存")).toBe(false);
    expect(f.posts).toHaveLength(1);
    f.finish();
    await saving;
    await f.sync();
    expect(text(f.child.tree)).toContain("保存は確定しました");
    expect(f.posts).toHaveLength(1);
    expect(
      generationDrafts.recover(owner, companyId, operationId)?.value
        .correctedOcr,
    ).toBe("送信後に訂正したOCR");
    expect(JSON.parse(f.posts[0]).candidate.correctedOcr).toBe("本人の訂正OCR");
    f.cleanup();
  });
  it("R5 looks up unknown before retrying the identical frozen body after remount", async () => {
    const f = await joinedSaveFlow();
    f.setMode("unknown");
    await f.click("この企業へ保存");
    await f.ocrRoundTrip();
    expect(button(f.child.tree, "同じ要求を再試行").props.disabled).toBe(true);
    expect(f.posts).toHaveLength(1);
    await f.click("操作結果を確認");
    expect(f.reads).toContain(
      "/api/v1/operations/" + JSON.parse(f.posts[0]).operationId,
    );
    f.setMode("ok");
    await f.click("同じ要求を再試行");
    expect(f.posts).toHaveLength(2);
    expect(f.posts[1]).toBe(f.posts[0]);
    expect(text(f.child.tree)).toContain("保存は確定しました");
    f.cleanup();
  });
  it("R6 isolates late commits on both owner and company changes", async () => {
    for (const changeTarget of [
      { ownerId: otherOwner },
      { companyId: "22222222-2222-4222-8222-222222222222" },
    ]) {
      const f = await joinedSaveFlow();
      f.setMode("pending");
      const saving = invoke(button(f.child.tree, "この企業へ保存"), "onClick");
      await f.sync();
      f.setTarget({ ...f.destination(), ...changeTarget });
      await f.sync();
      f.finish();
      await saving;
      await f.sync();
      expect(f.child.tree).toBeNull();
      expect(text(f.h.tree)).not.toContain("保存は確定しました");
      expect(f.onOpenSaved).not.toHaveBeenCalled();
      expect(f.posts).toHaveLength(1);
      f.cleanup();
      generationDrafts.resolve(owner, companyId);
    }
  });
  it("R7 allows an explicitly generated new candidate while failed generation retains the old commit", async () => {
    const f = await joinedSaveFlow();
    await f.click("この企業へ保存");
    f.failGeneration(true);
    await f.regenerate();
    expect(text(f.child.tree)).toContain("保存は確定しました");
    expect(f.posts).toHaveLength(1);
    f.failGeneration(false);
    await f.regenerate();
    await f.click("この企業へ保存");
    expect(f.posts).toHaveLength(2);
    expect(JSON.parse(f.posts[1]).memoId).not.toBe(
      JSON.parse(f.posts[0]).memoId,
    );
    expect(JSON.parse(f.posts[1]).operationId).not.toBe(
      JSON.parse(f.posts[0]).operationId,
    );
    f.cleanup();
  });
  it("R8 retains post-commit edits and hands them to the same saved memo after remount", async () => {
    const f = await joinedSaveFlow();
    await f.click("この企業へ保存");
    const before = named(f.h.tree, "GenerationSavePanel").props
      .value as GeneratedCandidate;
    const edited = { ...before, markdown: "本人の後続編集" };
    await invoke(
      named(f.child.tree, "GenerationCandidateFields"),
      "onChange",
      edited,
    );
    await f.sync();
    await f.ocrRoundTrip();
    expect(text(f.child.tree)).toContain("送信後の未保存編集");
    expect(f.offered("この企業へ保存")).toBe(false);
    expect(
      (named(f.h.tree, "GenerationSavePanel").props.value as GeneratedCandidate)
        .structuredContent,
    ).toEqual(before.structuredContent);
    await f.click("保存メモを開く");
    const id = JSON.parse(f.posts[0]).memoId;
    expect(f.onOpenSaved).toHaveBeenCalledWith(
      expect.objectContaining({ memoId: id }),
    );
    expect(
      workspaceDrafts.recover(`memo:${companyId}:${id}`, operationId)?.value,
    ).toEqual(expect.objectContaining({ markdown: edited.markdown }));
    expect(f.posts).toHaveLength(1);
    f.cleanup();
  });
});
async function generate(h: HookHarness) {
  h.render();
  await h.settle();
  await invoke(named(h.tree, "UploadStep"), "onAddImages", [
    {
      id: "image",
      file: new File(["fixture"], "private.png", { type: "image/png" }),
      previewUrl: "blob:private",
    },
  ]);
  h.render();
  await h.settle();
  await invoke(
    named(h.tree, "UploadStep"),
    "onChangeCompanyEventInfo",
    candidate().event,
  );
  h.render();
  await h.settle();
  await invoke(named(h.tree, "UploadStep"), "onNext");
  await h.settle();
  await invoke(
    named(h.tree, "OcrReviewStep"),
    "onChangeOcrText",
    "本人の訂正OCR",
  );
  h.render();
  await h.settle();
  await invoke(named(h.tree, "OcrReviewStep"), "onNext");
  await h.settle();
  const web = named(h.tree, "WebSupplementStep");
  const supplements = web.props.supplements as { id: string }[];
  if (supplements[0]) {
    await invoke(web, "onSetStatus", supplements[0].id, "adopted");
    h.render();
  }
  await invoke(named(h.tree, "WebSupplementStep"), "onNext");
  await h.settle();
  await new Promise<void>((resolve) => setImmediate(resolve));
  await h.settle();
}
describe("generation entry and image lifetime / AC5.1 AC9.2", () => {
  it("passes the fixed target, corrected OCR and signed candidate without image filenames", async () => {
    mockGeneration();
    const { h } = flowHarness();
    await generate(h);
    const p = named(h.tree, "GenerationSavePanel");
    expect(p.props.target).toMatchObject({
      companyId,
      name: company().name,
      ownerId: owner,
    });
    const value = p.props.value as GeneratedCandidate;
    expect(value.correctedOcr).toBe("本人の訂正OCR");
    expect(value.structuredContent.overview.companyName).toBe("架空生成名");
    expect(value.generationReceipt).toBe("dummy-proof");
    expect(value.adoptedWebSources[0]).toMatchObject({
      sourceUrl: "https://example.test/source",
      status: "adopted",
      confidence: "requires_check",
    });
    expect(JSON.stringify(value)).not.toContain("private.png");
    expect(JSON.stringify(value)).not.toContain("blob:private");
    h.unmount();
  });
  it("does not offer company save for an unproven response", async () => {
    mockGeneration(false);
    const { h } = flowHarness();
    await generate(h);
    expect(() => named(h.tree, "GenerationSavePanel")).toThrow();
    expect(text(h.tree)).toContain("保存");
    expect(text(h.tree)).toContain("失敗");
    h.unmount();
  });
  it("keeps the standalone legacy editor with guidance and no save destination", async () => {
    mockGeneration(false);
    const { h } = flowHarness(null);
    await generate(h);
    expect(named(h.tree, "MarkdownEditStep")).toBeDefined();
    expect(() => named(h.tree, "GenerationSavePanel")).toThrow();
    expect(text(h.tree)).toContain("企業詳細から");
    h.unmount();
  });
  it("cancels an unsaved close and retains all candidate fields", async () => {
    mockGeneration();
    const { h } = flowHarness();
    await generate(h);
    await invoke(named(h.tree, "GenerationSavePanel"), "onClose");
    h.render();
    expect(named(h.tree, "ConfirmDialog").props.title).toContain("未保存");
    await invoke(named(h.tree, "ConfirmDialog"), "onCancel");
    h.render();
    expect(
      (named(h.tree, "GenerationSavePanel").props.value as GeneratedCandidate)
        .correctedOcr,
    ).toBe("本人の訂正OCR");
    h.unmount();
  });
  it("does not overwrite current Markdown when only structure is edited", async () => {
    mockGeneration();
    const { h } = flowHarness();
    await generate(h);
    const value = named(h.tree, "GenerationSavePanel").props
      .value as GeneratedCandidate;
    await invoke(named(h.tree, "GenerationSavePanel"), "onChange", {
      ...value,
      structuredContent: {
        ...value.structuredContent,
        facts: ["本人が訂正した構造"],
      },
    });
    h.render();
    const current = named(h.tree, "GenerationSavePanel").props
      .value as GeneratedCandidate;
    expect(current.markdown).toBe(value.markdown);
    expect(current.structuredContent.facts).toEqual(["本人が訂正した構造"]);
    h.unmount();
  });
  it("releases images on confirmed save and unmount without storing them", async () => {
    mockGeneration();
    const { h } = flowHarness();
    await generate(h);
    const p = named(h.tree, "GenerationSavePanel");
    await invoke(p, "onCommitted", p.props.value);
    await h.settle();
    expect(URL.revokeObjectURL).toHaveBeenCalledWith("blob:private");
    h.unmount();
    expect(URL.revokeObjectURL).toHaveBeenCalledTimes(1);
  });
  it("releases a removed image immediately", async () => {
    mockGeneration();
    const { h } = flowHarness();
    h.render();
    await h.settle();
    await invoke(named(h.tree, "UploadStep"), "onAddImages", [
      {
        id: "image",
        file: new File(["fixture"], "private.png", { type: "image/png" }),
        previewUrl: "blob:private",
      },
    ]);
    await h.settle();
    await invoke(named(h.tree, "UploadStep"), "onRemoveImage", "image");
    h.render();
    const dialog = named(h.tree, "ConfirmDialog");
    await invoke(dialog, "onConfirm");
    await h.settle();
    expect(
      named(h.tree, "UploadStep").props.selectedImages as unknown[],
    ).toHaveLength(0);
    expect(URL.revokeObjectURL).toHaveBeenCalledWith("blob:private");
    h.unmount();
  });
  it("ignores old OCR after owner switch and releases original images", async () => {
    let finish!: (r: Response) => void;
    vi.stubGlobal(
      "fetch",
      vi.fn(
        () =>
          new Promise<Response>((r) => {
            finish = r;
          }),
      ),
    );
    const f = flowHarness();
    f.h.render();
    await f.h.settle();
    await invoke(named(f.h.tree, "UploadStep"), "onAddImages", [
      {
        id: "image",
        file: new File(["fixture"], "private.png", { type: "image/png" }),
        previewUrl: "blob:private",
      },
    ]);
    await f.h.settle();
    const running = invoke(named(f.h.tree, "UploadStep"), "onNext");
    await f.h.settle();
    f.setTarget({ ...target(), ownerId: otherOwner });
    f.h.render();
    await f.h.settle();
    finish(Response.json({ text: "別本人へ見せないOCR", provider: "dummy" }));
    await running;
    await f.h.settle();
    expect(named(f.h.tree, "UploadStep").props.selectedImages).toEqual([]);
    expect(text(f.h.tree)).not.toContain("別本人へ見せないOCR");
    expect(URL.revokeObjectURL).toHaveBeenCalledWith("blob:private");
    f.h.unmount();
  });
  it("exposes the generation entry only with the currently selected company", async () => {
    const saved = company();
    const client = new WorkspaceClient({
      fetch: vi.fn(async (path) =>
        Response.json(
          String(path).includes("board")
            ? buildBoardSnapshot(
                [{ ...saved, memoCount: 0 }],
                true,
                operationId,
              )
            : String(path).endsWith("/memos")
              ? { items: [], nextCursor: null }
              : saved,
        ),
      ),
    });
    const h = new HookHarness(() => CompanyDetail({ companyId }), {
      userId: owner,
      client,
    });
    h.render();
    await h.settle();
    await invoke(
      button(h.tree, "画像・OCRからこの企業のメモを作成"),
      "onClick",
    );
    await h.settle();
    expect(named(h.tree, "BriefingNoteFlow").props.target).toMatchObject({
      companyId,
      name: saved.name,
      ownerId: owner,
    });
    h.unmount();
  });
});

describe("explicit same-owner generation recovery", () => {
  it("checks the latest parent before explicit recovery without restoring images", async () => {
    generationDrafts.put(
      owner,
      companyId,
      {
        correctedOcr: "保持した訂正",
        event: candidate().event,
        candidate: candidate(),
      },
      operationId,
    );
    const fetcher = vi.fn(async () => Response.json(company()));
    const { h } = flowHarness(target(new WorkspaceClient({ fetch: fetcher })));
    h.render();
    await h.settle();
    expect(() => named(h.tree, "GenerationSavePanel")).toThrow();
    await invoke(button(h.tree, "保持した生成入力を確認して再開"), "onClick");
    await h.settle();
    expect(fetcher).toHaveBeenCalledWith(
      `/api/v1/companies/${companyId}`,
      expect.objectContaining({ method: "GET" }),
    );
    expect(
      (named(h.tree, "GenerationSavePanel").props.value as GeneratedCandidate)
        .markdown,
    ).toBe(candidate().markdown);
    h.unmount();
    expect(URL.revokeObjectURL).not.toHaveBeenCalled();
  });
  it("keeps a recoverable draft when the selected parent disappeared", async () => {
    generationDrafts.put(
      owner,
      companyId,
      {
        correctedOcr: "保持した訂正",
        event: candidate().event,
        candidate: candidate(),
      },
      operationId,
    );
    const fetcher = vi.fn(async () =>
      Response.json({ error: { code: "not_found" } }, { status: 404 }),
    );
    const { h } = flowHarness(target(new WorkspaceClient({ fetch: fetcher })));
    h.render();
    await h.settle();
    await invoke(button(h.tree, "保持した生成入力を確認して再開"), "onClick");
    await h.settle();
    expect(() => named(h.tree, "GenerationSavePanel")).toThrow();
    expect(
      generationDrafts.recover(owner, companyId, operationId)?.value
        .correctedOcr,
    ).toBe("保持した訂正");
    h.unmount();
  });
});

describe("working input survives edits to the last valid candidate", () => {
  it("retains newer working OCR after the last candidate is committed", async () => {
    mockGeneration();
    const { h } = flowHarness();
    await generate(h);
    await invoke(button(h.tree, "画像・OCR確認へ戻る"), "onClick");
    await h.settle();
    await invoke(
      named(h.tree, "OcrReviewStep"),
      "onChangeOcrText",
      "次の候補用に訂正中",
    );
    await h.settle();
    await invoke(button(h.tree, "最後の生成候補へ戻る"), "onClick");
    await h.settle();
    const p = named(h.tree, "GenerationSavePanel");
    await invoke(p, "onCommitted", mapGeneratedCandidate(p.props.value));
    await h.settle();
    expect(
      generationDrafts.recover(owner, companyId, operationId)?.value
        .correctedOcr,
    ).toBe("次の候補用に訂正中");
    await invoke(named(h.tree, "GenerationSavePanel"), "onClose");
    await h.settle();
    expect(named(h.tree, "ConfirmDialog").props.title).toContain("未保存");
    await invoke(named(h.tree, "ConfirmDialog"), "onCancel");
    await h.settle();
    await invoke(
      named(h.tree, "GenerationSavePanel"),
      "onOpenSaved",
      savedMemo(p.props.value as GeneratedCandidate),
    );
    await h.settle();
    expect(named(h.tree, "ConfirmDialog").props.title).toContain("未保存");
    await invoke(named(h.tree, "ConfirmDialog"), "onCancel");
    await h.settle();
    expect(
      generationDrafts.recover(owner, companyId, operationId)?.value
        .correctedOcr,
    ).toBe("次の候補用に訂正中");
    h.unmount();
  });
  it("does not discard newer OCR correction when only the candidate Markdown changes", async () => {
    mockGeneration();
    const { h } = flowHarness();
    await generate(h);
    await invoke(button(h.tree, "画像・OCR確認へ戻る"), "onClick");
    await h.settle();
    await invoke(
      named(h.tree, "OcrReviewStep"),
      "onChangeOcrText",
      "さらに訂正した原文",
    );
    await h.settle();
    await invoke(button(h.tree, "最後の生成候補へ戻る"), "onClick");
    await h.settle();
    const value = named(h.tree, "GenerationSavePanel").props
      .value as GeneratedCandidate;
    await invoke(named(h.tree, "GenerationSavePanel"), "onChange", {
      ...value,
      markdown: "本文だけの編集",
    });
    await h.settle();
    await invoke(button(h.tree, "画像・OCR確認へ戻る"), "onClick");
    await h.settle();
    expect(named(h.tree, "OcrReviewStep").props.ocrText).toBe(
      "さらに訂正した原文",
    );
    h.unmount();
  });
  it("does not discard newer event input when only the candidate structure changes", async () => {
    mockGeneration();
    const { h } = flowHarness();
    await generate(h);
    await invoke(button(h.tree, "画像・OCR確認へ戻る"), "onClick");
    await h.settle();
    await invoke(named(h.tree, "OcrReviewStep"), "onBack");
    await h.settle();
    const event = { ...candidate().event, eventName: "新しいイベント入力" };
    await invoke(
      named(h.tree, "UploadStep"),
      "onChangeCompanyEventInfo",
      event,
    );
    await h.settle();
    await invoke(button(h.tree, "最後の生成候補へ戻る"), "onClick");
    await h.settle();
    const value = named(h.tree, "GenerationSavePanel").props
      .value as GeneratedCandidate;
    await invoke(named(h.tree, "GenerationSavePanel"), "onChange", {
      ...value,
      structuredContent: {
        ...value.structuredContent,
        facts: ["構造だけの訂正"],
      },
    });
    await h.settle();
    await invoke(button(h.tree, "画像・OCR確認へ戻る"), "onClick");
    await h.settle();
    await invoke(named(h.tree, "OcrReviewStep"), "onBack");
    await h.settle();
    expect(named(h.tree, "UploadStep").props.companyEventInfo).toEqual(event);
    h.unmount();
  });
});
