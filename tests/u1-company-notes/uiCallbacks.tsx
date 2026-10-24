import React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { HookHarness, button, find, invoke, text } from "./hookHarness";
import { CompanyForm } from "../../src/components/workspace/CompanyForm";
import { MemoEditor } from "../../src/components/workspace/MemoEditor";
import { LoginForm } from "../../src/components/workspace/LoginForm";
import { WorkspaceShell } from "../../src/components/workspace/WorkspaceShell";
import { WorkspaceHome } from "../../src/components/workspace/WorkspaceHome";
import { CompanyDetail } from "../../src/components/workspace/CompanyDetail";
import { useMutation } from "../../src/components/workspace/useMutation";
import { ConfirmDialog } from "../../src/components/workspace/ConfirmDialog";
import { BriefingNoteFlow } from "../../src/components/BriefingNoteFlow";
import {
  WorkspaceClient,
  notifyUnauthorized,
} from "../../src/lib/workspace/client";
import { workspaceDrafts } from "../../src/lib/workspace/draft";
import { buildBoardSnapshot } from "../../src/lib/workspace/board";
import type {
  Company,
  Memo,
  MutationOutcome,
} from "../../src/lib/workspace/contracts";
import { buildDummyInterviewReview } from "../../src/lib/interviewReview/dummy";
import { emptyStructure, id, manualCandidate, OWNER_A } from "./fixtures";
import "./legacyUiCases";
import { fixtureTrace, runtimeFixture } from "./runtimeFixture";
import { createWorkspaceHandler } from "../../src/lib/server/workspace/http";
const router = vi.hoisted(() => ({ push: vi.fn() }));
vi.mock("next/navigation", () => ({ useRouter: () => router }));
const company = (): Company => ({
  companyId: id(),
  name: "架空企業",
  industry: null,
  interestLevel: null,
  personalNote: null,
  selectionStatus: "not_applied",
  nextSelectionDate: null,
  applicationDeadline: null,
  officialUrl: null,
  version: id(),
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
});
const memo = (companyId: string): Memo => ({
  ...manualCandidate(),
  memoId: id(),
  companyId,
  version: id(),
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
});
const change = (value: unknown) => ({ target: { value } });
const named = (tree: React.ReactNode, name: string) =>
  find(tree, (e) => typeof e.type === "function" && e.type.name === name);
const field = (tree: React.ReactNode, testId: string) =>
  find(tree, (e) => e.props["data-testid"] === testId);
const outcome = (
  companyId: string,
  memoId: string | null = null,
): MutationOutcome => ({
  operationId: id(),
  companyId,
  memoId,
  action: memoId ? "memo_update" : "company_update",
  resultingVersion: id(),
  committedAt: new Date().toISOString(),
});
function globals() {
  const windowTarget = Object.assign(new EventTarget(), {
    location: new URL("http://localhost/"),
    setTimeout,
    clearTimeout,
    localStorage: (() => {
      const data = new Map<string, string>();
      return {
        getItem: (key: string) => data.get(key) ?? null,
        setItem: (key: string, value: string) => data.set(key, value),
        removeItem: (key: string) => data.delete(key),
      };
    })(),
  });
  const documentTarget = Object.assign(new EventTarget(), {
    activeElement: null,
    querySelector: () => null,
    body: { appendChild: vi.fn() },
    createElement: () => ({
      click: vi.fn(),
      remove: vi.fn(),
      href: "",
      download: "",
      rel: "",
    }),
  });
  vi.stubGlobal("window", windowTarget);
  vi.stubGlobal("document", documentTarget);
  return { windowTarget, documentTarget };
}
beforeEach(() => {
  globals();
  workspaceDrafts.switchOwner(OWNER_A);
  workspaceDrafts.discardAll();
  router.push.mockClear();
});
afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("workspace control callbacks / Node unit evidence", () => {
  it("company edits explicitly submit validated independent fields", async () => {
    const saved = company(),
      onSubmit = vi.fn();
    const h = new HookHarness(() => CompanyForm({ company: saved, onSubmit }));
    h.render();
    await invoke(
      field(h.tree, "company-name"),
      "onChange",
      change("  本人の企業名  "),
    );
    h.render();
    await invoke(
      field(h.tree, "company-nextSelectionDate"),
      "onChange",
      change("2026-11-03"),
    );
    h.render();
    await invoke(
      find(
        h.tree,
        (e) => e.type === "select" && e.props.value === "not_applied",
      ),
      "onChange",
      change("interview"),
    );
    h.render();
    await invoke(
      find(h.tree, (e) => e.type === "textarea"),
      "onChange",
      change("個人の印象"),
    );
    h.render();
    await invoke(
      find(h.tree, (e) => e.type === "form"),
      "onSubmit",
      { preventDefault() {} },
    );
    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        name: "本人の企業名",
        selectionStatus: "interview",
        nextSelectionDate: "2026-11-03",
        personalNote: "個人の印象",
        interestLevel: null,
      }),
    );
  });
  it("invalid company input remains visible without submission", async () => {
    const onSubmit = vi.fn();
    const h = new HookHarness(() => CompanyForm({ onSubmit }));
    h.render();
    await invoke(field(h.tree, "company-name"), "onChange", change(" "));
    h.render();
    await invoke(
      find(h.tree, (e) => e.type === "form"),
      "onSubmit",
      { preventDefault() {} },
    );
    h.render();
    expect(text(h.tree)).toContain("入力内容を確認");
    expect(onSubmit).not.toHaveBeenCalled();
  });
  it("retained company input requires explicit restore and stays separate from saved DTO", async () => {
    const saved = company(),
      retained = { ...saved, name: "下書き企業名" };
    const h = new HookHarness(() => CompanyForm({ company: saved, retained }));
    h.render();
    expect(field(h.tree, "company-name").props.value).toBe("架空企業");
    await invoke(button(h.tree, "保持した企業入力で再編集"), "onClick");
    h.render();
    expect(field(h.tree, "company-name").props.value).toBe("下書き企業名");
    expect(saved.name).toBe("架空企業");
  });
  it("Markdown save changes only Markdown, including untrimmed text", async () => {
    const saved = { ...memo(id()), structuredContent: emptyStructure() },
      onSave = vi.fn();
    const h = new HookHarness(() => MemoEditor({ initial: saved, onSave }));
    h.render();
    await invoke(
      field(h.tree, "memo-markdown"),
      "onChange",
      change(" 本人の本文\n"),
    );
    h.render();
    await invoke(button(h.tree, "本文を保存"), "onClick");
    expect(onSave).toHaveBeenCalledWith({ markdown: " 本人の本文\n" });
    expect(saved.structuredContent.facts).toEqual([]);
  });
  it("adding comparison fields is explicit and does not parse manual Markdown", async () => {
    const onSave = vi.fn();
    const h = new HookHarness(() =>
      MemoEditor({ initial: memo(id()), onSave }),
    );
    h.render();
    await invoke(button(h.tree, "比較用項目を追加"), "onClick");
    h.render();
    await invoke(button(h.tree, "説明会の事実を追加"), "onClick");
    h.render();
    const textarea = find(
      h.tree,
      (e) =>
        e.type === "fieldset" &&
        e.props["data-testid"] !== "memo-edit-fields" &&
        text(e.props.children as React.ReactNode).includes("説明会の事実"),
    );
    const input = find(textarea, (e) => e.type === "textarea");
    await invoke(input, "onChange", change("本人が転記した事実"));
    h.render();
    await invoke(button(h.tree, "比較用項目を保存"), "onClick");
    expect(onSave).toHaveBeenCalledWith({
      structuredContent: expect.objectContaining({
        facts: ["本人が転記した事実"],
        impressions: [],
      }),
    });
    expect(onSave.mock.calls[0][0]).not.toHaveProperty("markdown");
  });
  it("comparison reason saves independently of company interest", async () => {
    const onSave = vi.fn();
    const h = new HookHarness(() =>
      MemoEditor({ initial: memo(id()), onSave }),
    );
    h.render();
    const label = find(
      h.tree,
      (e) =>
        e.type === "label" &&
        text(e.props.children as React.ReactNode).startsWith("比較理由"),
    );
    await invoke(
      find(label, (e) => e.type === "textarea"),
      "onChange",
      change("本人の理由"),
    );
    h.render();
    await invoke(button(h.tree, "比較理由を保存"), "onClick");
    expect(onSave).toHaveBeenCalledWith({ comparisonReason: "本人の理由" });
  });
  it("empty Markdown is rejected without clearing input", async () => {
    const onSave = vi.fn();
    const h = new HookHarness(() =>
      MemoEditor({ initial: memo(id()), onSave }),
    );
    h.render();
    await invoke(field(h.tree, "memo-markdown"), "onChange", change(" \n"));
    h.render();
    await invoke(button(h.tree, "本文を保存"), "onClick");
    h.render();
    expect(text(h.tree)).toContain("本文は空白だけにできません");
    expect(field(h.tree, "memo-markdown").props.value).toBe(" \n");
    expect(onSave).not.toHaveBeenCalled();
  });
  it("login sends same-origin credentials and only exposes verified user", async () => {
    const fetch = vi.fn().mockResolvedValue(Response.json({ userId: OWNER_A }));
    vi.stubGlobal("fetch", fetch);
    const onSuccess = vi.fn();
    const h = new HookHarness(() => LoginForm({ onSuccess }));
    h.render();
    await invoke(
      field(h.tree, "login-email"),
      "onChange",
      change("owner@example.test"),
    );
    h.render();
    await invoke(
      field(h.tree, "login-password"),
      "onChange",
      change("dummy-password"),
    );
    h.render();
    await invoke(
      find(h.tree, (e) => e.type === "form"),
      "onSubmit",
      { preventDefault() {} },
    );
    h.render();
    expect(onSuccess).toHaveBeenCalledWith(OWNER_A);
    expect(field(h.tree, "login-password").props.value).toBe("");
    expect(fetch.mock.calls[0][0]).toBe("/api/v1/auth/login");
    expect(JSON.parse(fetch.mock.calls[0][1].body)).toEqual({
      email: "owner@example.test",
      password: "dummy-password",
    });
  });
  it("unknown writes require lookup before exact explicit retry", async () => {
    const result = outcome(id()),
      committed = vi.fn();
    const requests: { path: string; init: RequestInit }[] = [];
    const fetch = vi.fn(async (path, init) => {
      requests.push({ path: String(path), init: init ?? {} });
      if (requests.length === 1)
        return Response.json(
          { error: { code: "operation_unknown" } },
          { status: 503 },
        );
      if (String(path).includes("operations"))
        return Response.json({ state: "unknown" });
      return Response.json(result);
    });
    const client = new WorkspaceClient({ fetch });
    const operationId = id();
    const h = new HookHarness(
      () => {
        const m = useMutation("callback-unknown", committed);
        return (
          <>
            {m.panel}
            <button
              onClick={() =>
                m.begin("/api/v1/companies", "POST", {
                  operationId,
                  companyId: result.companyId,
                  fields: { name: "架空" },
                })
              }
            >
              実行
            </button>
          </>
        );
      },
      { userId: OWNER_A, client },
    );
    h.render();
    await invoke(button(h.tree, "実行"), "onClick");
    h.render();
    expect(requests).toHaveLength(1);
    expect(button(h.tree, "同じ要求を再試行").props.disabled).toBe(true);
    await invoke(button(h.tree, "操作結果を確認"), "onClick");
    h.render();
    expect(button(h.tree, "同じ要求を再試行").props.disabled).toBe(false);
    await invoke(button(h.tree, "同じ要求を再試行"), "onClick");
    await h.settle();
    h.render();
    expect(requests[2].init.body).toBe(requests[0].init.body);
    expect(committed).toHaveBeenCalledWith(
      result,
      expect.objectContaining({ body: requests[0].init.body }),
    );
    h.unmount();
  });
  it("committed lookup resolves without sending another write", async () => {
    const target = `unknown-${id()}`,
      result = outcome(id());
    const client = new WorkspaceClient({
      fetch: vi
        .fn()
        .mockResolvedValue(
          Response.json({ state: "committed", outcome: result }),
        ),
    });
    workspaceDrafts.markPending(
      target,
      client.prepare("/api/v1/companies", "POST", {
        operationId: result.operationId,
      }),
    );
    const committed = vi.fn();
    const h = new HookHarness(
      () => {
        const m = useMutation(target, committed);
        return m.panel;
      },
      { userId: OWNER_A, client },
    );
    h.render();
    await invoke(button(h.tree, "操作結果を確認"), "onClick");
    expect(committed).toHaveBeenCalledWith(result, expect.anything());
    expect(workspaceDrafts.pending(target)).toBeNull();
  });
  it("board toggle requests a new snapshot without changing persisted state", async () => {
    const saved = company();
    const fetch = vi
      .fn()
      .mockImplementation(async (path) =>
        Response.json(
          buildBoardSnapshot(
            [{ ...saved, memoCount: 2 }],
            String(path).includes("true"),
            id(),
          ),
        ),
      );
    const h = new HookHarness(() => WorkspaceHome({}), {
      userId: OWNER_A,
      client: new WorkspaceClient({ fetch }),
    });
    h.render();
    await h.settle();
    const board = named(h.tree, "CompanyBoard");
    expect(
      (board.props.snapshot as { savedCompanyCount: number }).savedCompanyCount,
    ).toBe(1);
    await invoke(board, "onToggle");
    h.render();
    await h.settle();
    expect(fetch.mock.calls.at(-1)?.[0]).toBe("/api/v1/board?showEnded=true");
    expect(
      (
        named(h.tree, "CompanyBoard").props.snapshot as {
          activeCompanyCount: number;
        }
      ).activeCompanyCount,
    ).toBe(0);
    h.unmount();
  });
  it("detail obtains accurate total separately from the memo page", async () => {
    const saved = company(),
      savedMemo = memo(saved.companyId);
    const fetch = vi.fn().mockImplementation(async (path) =>
      Response.json(
        String(path).includes("board")
          ? buildBoardSnapshot([{ ...saved, memoCount: 50 }], true, id())
          : String(path).endsWith("/memos")
            ? {
                items: [{ ...savedMemo, hasStructuredContent: false }],
                nextCursor: null,
              }
            : saved,
      ),
    );
    const h = new HookHarness(
      () => CompanyDetail({ companyId: saved.companyId }),
      { userId: OWNER_A, client: new WorkspaceClient({ fetch }) },
    );
    h.render();
    await h.settle(48);
    expect(text(h.tree)).toContain("保存メモ 50件");
    expect(text(h.tree)).not.toContain("保存メモ 1件");
    await invoke(named(h.tree, "CompanyForm"), "onChange", {
      ...saved,
      name: "保持入力",
    });
    await invoke(button(h.tree, "手入力メモを作成"), "onClick");
    h.render();
    expect(named(h.tree, "ConfirmDialog").props.title).toContain("未保存");
    await invoke(named(h.tree, "ConfirmDialog"), "onCancel");
    h.render();
    expect(
      workspaceDrafts.get(`company:${saved.companyId}`)?.value,
    ).toMatchObject({ name: "保持入力" });
    h.unmount();
  });
  it("shell hides private children on session expiry and ignores old session resolution", async () => {
    let resolve!: (response: Response) => void;
    vi.stubGlobal(
      "fetch",
      vi.fn(
        () =>
          new Promise<Response>((done) => {
            resolve = done;
          }),
      ),
    );
    const h = new HookHarness(() =>
      WorkspaceShell({ children: <p>private fixture marker</p> }),
    );
    h.render();
    await h.settle();
    notifyUnauthorized();
    resolve(Response.json({ userId: OWNER_A }));
    await h.settle();
    expect(text(h.tree)).not.toContain("private fixture marker");
    expect(named(h.tree, "LoginForm")).toBeDefined();
    h.unmount();
  });
});

describe("mutation outcome presentation boundaries", () => {
  it("共有harnessの既定settleは直列mock GET後のCompanyDetail入口を返す", async () => {
    const saved = company();
    const client = new WorkspaceClient({
      fetch: vi.fn(async (path) =>
        Response.json(
          String(path).includes("board")
            ? buildBoardSnapshot([{ ...saved, memoCount: 0 }], true, id())
            : String(path).endsWith("/memos")
              ? { items: [], nextCursor: null }
              : saved,
        ),
      ),
    });
    const h = new HookHarness(
      () => CompanyDetail({ companyId: saved.companyId }),
      { userId: OWNER_A, client },
    );
    try {
      h.render();
      await h.settle();
      const readyAfterSettle = text(h.tree).includes(
        "画像・OCRからこの企業のメモを作成",
      );
      // 対照：実DB・実時間の遅延なし。同じmock処理は次のevent-loop turnまでに完了する。
      await new Promise<void>((resolve) => setImmediate(resolve));
      h.render();
      expect(button(h.tree, "画像・OCRからこの企業のメモを作成")).toBeDefined();
      expect(readyAfterSettle, "settleがmock直列取得の完了前に戻っている").toBe(
        true,
      );
    } finally {
      h.unmount();
    }
  });
  it("AC6.3.2 メモ再編集前も最新の比較用項目と原文を参照でき、変更・保存は停止する", async () => {
    const latest = {
      ...memo(id()),
      structuredContent: { ...emptyStructure(), facts: ["最新保存版の事実"] },
      correctedOcr: "最新保存版の原文",
    };
    const retained = { ...latest, markdown: "保持する未保存本文" };
    const onSave = vi.fn(),
      onChange = vi.fn();
    const h = new HookHarness(() =>
      MemoEditor({
        initial: latest,
        retained,
        needsRebase: true,
        onSave,
        onChange,
      }),
    );
    try {
      h.render();
      const tabs = named(h.tree, "TabButtons");
      const editFields = field(h.tree, "memo-edit-fields");
      expect(editFields.props.disabled).toBe(true);
      // disabled fieldsetの子孫では、ブラウザが参照タブの操作まで拒否する。
      expect(() => named(editFields, "TabButtons")).toThrow(
        "expected visible control missing",
      );
      await invoke(tabs, "onSelect", 1);
      h.render();
      expect(
        find(h.tree, (e) => e.props.id === "memo-panel-1").props.hidden,
      ).toBe(false);
      const structuredPanel = find(
        h.tree,
        (e) => e.props.id === "memo-panel-1",
      );
      expect(
        find(
          structuredPanel,
          (e) => e.type === "textarea" && e.props.value === "最新保存版の事実",
        ).props.value,
      ).toBe("最新保存版の事実");
      await invoke(named(h.tree, "TabButtons"), "onSelect", 2);
      h.render();
      expect(
        find(h.tree, (e) => e.props.id === "memo-panel-2").props.hidden,
      ).toBe(false);
      expect(
        text(find(h.tree, (e) => e.props.id === "memo-panel-2")),
      ).toContain("最新保存版の原文");
      await invoke(
        field(h.tree, "memo-markdown"),
        "onChange",
        change("未承認の変更"),
      );
      await invoke(button(h.tree, "本文を保存"), "onClick");
      expect(onChange).not.toHaveBeenCalled();
      expect(onSave).not.toHaveBeenCalled();
      expect(retained.markdown).toBe("保持する未保存本文");
    } finally {
      h.unmount();
    }
  });
  it("AC6.3.2 実HTTP/PGでlatest取得を完了し元の入力を保持する", async () => {
    const trace = fixtureTrace("latest");
    const f = await runtimeFixture(trace);
    const stage = (name: string) => {
      trace(name);
      f.db.diagnostic?.stage(name);
    };
    let h: HookHarness | undefined;
    try {
      const companyId = id(),
        memoId = id();
      await f.repo.createCompany(f.principal, {
        companyId,
        operationId: id(),
        fields: { name: "実取得の最新" },
      });
      await f.repo.createMemo(f.principal, companyId, {
        memoId,
        operationId: id(),
        candidate: manualCandidate(),
      });
      stage("company-and-memo-created");
      const latest = await f.repo.readCompany(f.principal, companyId);
      const savedMemo = await f.repo.readMemo(f.principal, companyId, memoId);
      stage("initial-reads:done");
      const oldMemo = { ...savedMemo, markdown: "旧メモ表示", version: id() };
      const old = { ...latest, name: "旧表示", version: id() };
      const handle = createWorkspaceHandler(() => f);
      const statuses: number[] = [];
      let live = false;
      const client = new WorkspaceClient({
        fetch: async (path, init) => {
          if (live) {
            stage("live-handler:start");
            const response = await handle(
              new Request(`http://localhost${String(path)}`, {
                ...init,
                headers: { Cookie: f.cookie, Origin: "http://localhost" },
              }),
            );
            statuses.push(response.status);
            stage("live-handler:done");
            return response;
          }
          return Response.json(
            String(path).includes("board")
              ? buildBoardSnapshot([{ ...old, memoCount: 1 }], true, id())
              : String(path).endsWith("/memos")
                ? {
                    items: [{ ...oldMemo, hasStructuredContent: false }],
                    nextCursor: null,
                  }
                : String(path).endsWith(memoId)
                  ? oldMemo
                  : old,
          );
        },
      });
      h = new HookHarness(() => CompanyDetail({ companyId }), {
        userId: OWNER_A,
        client,
      });
      h.render();
      await h.settle(48);
      await invoke(
        find(
          h.tree,
          (e) =>
            e.type === "button" &&
            text(e.props.children as React.ReactNode).startsWith("手入力 ／"),
        ),
        "onClick",
      );
      await h.settle(48);
      const element = named(h.tree, "MemoWorkspace");
      const child = new HookHarness(
        () =>
          (element.type as (props: typeof element.props) => React.ReactNode)(
            element.props,
          ),
        { userId: OWNER_A, client },
      );
      child.render();
      const input = { ...oldMemo, markdown: "失わせない入力" };
      await invoke(named(child.tree, "MemoEditor"), "onChange", input);
      child.unmount();
      live = true;
      stage("latest-fetch:start");
      await invoke(button(h.tree, "保存済みの最新を再取得"), "onClick");
      await vi.waitFor(
        () => {
          h!.render();
          expect(
            (named(h!.tree, "MemoWorkspace").props.memo as Memo).version,
            `HTTP statuses: ${statuses.join(",")}`,
          ).toBe(savedMemo.version);
        },
        { timeout: 4000, interval: 20 },
      );
      stage("latest-fetch:done");
      expect(workspaceDrafts.get(`memo:${companyId}:${memoId}`)).toEqual({
        value: input,
        baseVersion: oldMemo.version,
      });
      stage("draft-and-base:verified");
    } finally {
      h?.unmount();
      await f.close();
    }
  }, 30000);
  async function conflictDetail(kind: "company" | "memo") {
    let saved = company();
    let savedMemo = memo(saved.companyId);
    const original = kind === "company" ? saved : savedMemo;
    let failRead = false;
    const writes: Record<string, unknown>[] = [];
    const fetch = vi.fn(async (path, init) => {
      const route = String(path);
      if (init?.method === "PATCH") {
        const body = JSON.parse(String(init.body));
        writes.push(body);
        if (writes.length === 1) {
          saved = { ...saved, name: "別端末の企業", version: id() };
          savedMemo = { ...savedMemo, markdown: "別端末の本文", version: id() };
          return Response.json(
            { error: { code: "version_conflict", message: "版競合" } },
            { status: 409 },
          );
        }
        if (kind === "company")
          saved = { ...saved, ...body.changes, version: id() };
        else savedMemo = { ...savedMemo, ...body.changes, version: id() };
        return Response.json(
          outcome(saved.companyId, kind === "memo" ? savedMemo.memoId : null),
        );
      }
      if (failRead)
        return Response.json(
          { error: { code: "internal_error", message: "架空取得失敗" } },
          { status: 500 },
        );
      return Response.json(
        route.includes("board")
          ? buildBoardSnapshot([{ ...saved, memoCount: 1 }], true, id())
          : route.endsWith("/memos")
            ? {
                items: [{ ...savedMemo, hasStructuredContent: false }],
                nextCursor: null,
              }
            : route.endsWith(savedMemo.memoId)
              ? savedMemo
              : saved,
      );
    });
    const context = { userId: OWNER_A, client: new WorkspaceClient({ fetch }) };
    const h = new HookHarness(
      () => CompanyDetail({ companyId: saved.companyId }),
      context,
    );
    h.render();
    await h.settle(48);
    if (kind === "memo") {
      await invoke(
        find(
          h.tree,
          (e) =>
            e.type === "button" &&
            text(e.props.children as React.ReactNode).startsWith("手入力 ／"),
        ),
        "onClick",
      );
      await h.settle(48);
    }
    let workspace: HookHarness | undefined;
    const editor = () => {
      if (kind === "company") return named(h.tree, "CompanyForm");
      const element = named(h.tree, "MemoWorkspace");
      workspace ??= new HookHarness(
        () =>
          (element.type as (props: typeof element.props) => React.ReactNode)(
            element.props,
          ),
        context,
      );
      workspace.render();
      return named(workspace.tree, "MemoEditor");
    };
    const input =
      kind === "company"
        ? { ...saved, name: "保持した企業入力" }
        : { ...savedMemo, markdown: "保持した本文" };
    await invoke(editor(), "onChange", input);
    await invoke(
      editor(),
      kind === "company" ? "onSubmit" : "onSave",
      kind === "company" ? input : { markdown: "保持した本文" },
    );
    h.render();
    workspace?.render();
    expect(writes).toHaveLength(1);
    const target =
      kind === "company"
        ? `company:${saved.companyId}`
        : `memo:${saved.companyId}:${savedMemo.memoId}`;
    return {
      h,
      editor,
      writes,
      input,
      target,
      original,
      latest: () => (kind === "company" ? saved : savedMemo),
      fail: () => {
        failRead = true;
      },
      remount: () => {
        workspace?.unmount();
        workspace = undefined;
      },
      close: () => {
        workspace?.unmount();
        h.unmount();
      },
    };
  }
  it.each(["company", "memo"] as const)(
    "AC6.3.2 %s 409→最新取得は元draft/baseを保持し、明示再編集後だけ新baselineで保存",
    async (kind) => {
      const c = await conflictDetail(kind);
      try {
        const retained = workspaceDrafts.get(c.target);
        await invoke(button(c.h.tree, "保存済みの最新を再取得"), "onClick");
        await c.h.settle(48);
        c.remount();
        expect(workspaceDrafts.get(c.target)).toEqual(retained);
        const latestVersion = c.latest().version;
        expect(
          (
            c.editor().props[kind === "company" ? "company" : "initial"] as
              | Company
              | Memo
          ).version,
        ).toBe(latestVersion);
        // 最新取得だけでは旧入力の新規保存を認めない。直接callbackでも追加送信ゼロ。
        await invoke(
          c.editor(),
          kind === "company" ? "onSubmit" : "onSave",
          kind === "company" ? c.input : { markdown: "保持した本文" },
        );
        expect(c.writes).toHaveLength(1);
        // 最新propsを固定した子Harnessで実際の再編集callbackを実行する。
        const e = c.editor();
        const form = new HookHarness(() =>
          (e.type as (props: typeof e.props) => React.ReactNode)(e.props),
        );
        form.render();
        expect(text(form.tree)).toContain(
          kind === "company" ? "保持した企業入力" : "保持した本文",
        );
        await invoke(
          button(
            form.tree,
            kind === "company"
              ? "保持した企業入力で再編集"
              : "保持した入力で再編集",
          ),
          "onClick",
        );
        form.render();
        c.h.render();
        expect(workspaceDrafts.get(c.target)?.baseVersion).toBe(latestVersion);
        await invoke(
          c.editor(),
          kind === "company" ? "onSubmit" : "onSave",
          kind === "company" ? c.input : { markdown: "保持した本文" },
        );
        expect(c.writes).toHaveLength(2);
        expect(c.writes[1].expectedVersion).toBe(latestVersion);
        expect(c.writes[1].operationId).not.toBe(c.writes[0].operationId);
        expect(c.latest()).toMatchObject(
          kind === "company"
            ? { name: "保持した企業入力" }
            : { markdown: "保持した本文" },
        );
        form.unmount();
      } finally {
        c.close();
      }
    },
  );
  it.each(["company", "memo"] as const)(
    "AC6.3.2 %s 最新取得失敗でもdraft/baseと入力を保持し追加PATCHなし",
    async (kind) => {
      const c = await conflictDetail(kind);
      try {
        const retained = workspaceDrafts.get(c.target);
        c.fail();
        await invoke(button(c.h.tree, "保存済みの最新を再取得"), "onClick");
        await c.h.settle(48);
        expect(text(c.h.tree)).toContain(
          "取得・操作を完了できません。再取得してください。",
        );
        expect(workspaceDrafts.get(c.target)).toEqual(retained);
        expect(c.writes).toHaveLength(1);
      } finally {
        c.close();
      }
    },
  );
  it("AC6.2.4 競合後の移動取消も最新確認を妨げず入力を保持", async () => {
    const c = await conflictDetail("company");
    try {
      const retained = workspaceDrafts.get(c.target);
      await invoke(button(c.h.tree, "手入力メモを作成"), "onClick");
      c.h.render();
      await invoke(named(c.h.tree, "ConfirmDialog"), "onCancel");
      c.h.render();
      expect(workspaceDrafts.get(c.target)).toEqual(retained);
      await invoke(button(c.h.tree, "保存済みの最新を再取得"), "onClick");
      await c.h.settle(48);
      expect(
        (named(c.h.tree, "CompanyForm").props.company as Company).name,
      ).toBe("別端末の企業");
      expect(workspaceDrafts.get(c.target)).toEqual(retained);
      expect(c.writes).toHaveLength(1);
    } finally {
      c.close();
    }
  });
  it.each([false, true])(
    "dialog wraps keyboard focus in direction shift=%s",
    async (shiftKey) => {
      const first = { focus: vi.fn() },
        last = { focus: vi.fn() },
        preventDefault = vi.fn();
      Object.defineProperty(document, "activeElement", {
        value: shiftKey ? first : last,
        configurable: true,
      });
      const h = new HookHarness(() =>
        ConfirmDialog({ title: "架空", description: "確認" }),
      );
      h.render();
      await invoke(
        find(h.tree, (e) => e.type === "dialog"),
        "onKeyDown",
        {
          key: "Tab",
          shiftKey,
          preventDefault,
          currentTarget: { querySelectorAll: () => [first, last] },
        },
      );
      expect(preventDefault).toHaveBeenCalledOnce();
      expect((shiftKey ? last : first).focus).toHaveBeenCalledOnce();
      h.unmount();
    },
  );
  it.each([false, true])(
    "Escape has cancel semantics unless busy=%s",
    async (busy) => {
      const onCancel = vi.fn(),
        preventDefault = vi.fn();
      const h = new HookHarness(() =>
        ConfirmDialog({ title: "架空", description: "確認", busy, onCancel }),
      );
      h.render();
      await invoke(
        find(h.tree, (e) => e.type === "dialog"),
        "onKeyDown",
        { key: "Escape", preventDefault },
      );
      expect(preventDefault).toHaveBeenCalledOnce();
      expect(onCancel).toHaveBeenCalledTimes(busy ? 0 : 1);
      h.unmount();
    },
  );
  it("keeps committed status when the follow-up read fails", async () => {
    const result = outcome(id());
    const client = new WorkspaceClient({
      fetch: vi.fn(async () => Response.json(result)),
    });
    const h = new HookHarness(
      function MutationProbe() {
        const mutation = useMutation("read-after-commit", async () => {
          throw new Error("最新を取得できません");
        });
        return (
          <>
            {mutation.panel}
            <button
              onClick={() =>
                mutation.begin("/api/v1/companies", "POST", {
                  operationId: result.operationId,
                })
              }
            >
              実行
            </button>
          </>
        );
      },
      { userId: OWNER_A, client },
    );
    h.render();
    await invoke(button(h.tree, "実行"), "onClick");
    await h.settle();
    expect(text(h.tree)).toContain("保存は確定しました");
    expect(text(h.tree)).toContain("最新を取得できません");
    expect(workspaceDrafts.pending("read-after-commit")).toBeNull();
    h.unmount();
  });
  it("shows result lookup controls inside the registration modal", async () => {
    const client = new WorkspaceClient({
      fetch: vi.fn(async (path) => {
        if (String(path).includes("board"))
          return Response.json(buildBoardSnapshot([], false, id()));
        throw new TypeError("dummy connection interruption");
      }),
    });
    const h = new HookHarness(() => WorkspaceHome({}), {
      userId: OWNER_A,
      client,
    });
    h.render();
    await h.settle();
    await invoke(named(h.tree, "CompanyBoard"), "onCreate");
    h.render();
    await invoke(
      find(h.tree, (e) => e.type === "input"),
      "onChange",
      change("架空企業"),
    );
    h.render();
    await invoke(named(h.tree, "ConfirmDialog"), "onConfirm");
    await h.settle();
    expect(
      text(named(h.tree, "ConfirmDialog").props.children as React.ReactNode),
    ).toContain("操作結果を確認");
    h.unmount();
  });
});

describe("existing generation callback regressions under the protected entry", () => {
  it("OCR, adopted Web, Markdown and review preserve their distinct payloads", async () => {
    const structured = { ...emptyStructure(), facts: ["説明会事実"] };
    const review = buildDummyInterviewReview(structured);
    const calls: { path: string; body: unknown }[] = [];
    vi.stubGlobal(
      "fetch",
      vi.fn(async (path, init) => {
        calls.push({
          path: String(path),
          body:
            init?.body instanceof FormData
              ? "multipart"
              : JSON.parse(String(init?.body ?? "{}")),
        });
        return Response.json(
          String(path).includes("/ocr")
            ? { text: "架空OCR", provider: "dummy" }
            : String(path).includes("web-supplement")
              ? {
                  provider: "dummy",
                  result: { companyName: "架空", items: [] },
                }
              : String(path).includes("interview-review")
                ? { review, provider: "dummy" }
                : { memo: structured, provider: "dummy" },
        );
      }),
    );
    const h = new HookHarness(() => BriefingNoteFlow());
    h.render();
    await h.settle();
    await invoke(named(h.tree, "UploadStep"), "onAddImages", [
      {
        id: id(),
        file: new File(["dummy"], "dummy.png", { type: "image/png" }),
        previewUrl: "blob:dummy",
      },
    ]);
    h.render();
    await h.settle();
    await invoke(named(h.tree, "UploadStep"), "onChangeCompanyEventInfo", {
      companyName: "架空",
      eventName: "説明会",
      eventDate: "",
    });
    h.render();
    await h.settle();
    await invoke(named(h.tree, "UploadStep"), "onNext");
    h.render();
    await h.settle();
    expect(named(h.tree, "OcrReviewStep").props.ocrText).toBe("架空OCR");
    await invoke(named(h.tree, "OcrReviewStep"), "onNext");
    h.render();
    await h.settle();
    await invoke(named(h.tree, "WebSupplementStep"), "onNext");
    await h.settle();
    const editor = named(h.tree, "MarkdownEditStep");
    expect(editor.props.markdownText).toContain("説明会事実");
    await invoke(editor, "onChangeMarkdownText", "本人の編集本文");
    h.render();
    await invoke(
      named(h.tree, "MarkdownEditStep"),
      "onGenerateInterviewReview",
    );
    await h.settle();
    expect(named(h.tree, "InterviewReviewView").props.review).toEqual(review);
    expect(calls.map((item) => item.path)).toEqual([
      "/api/ocr",
      "/api/web-supplement",
      "/api/structure",
      "/api/interview-review",
    ]);
    expect(calls[3].body).toMatchObject({
      memo: structured,
      webSupplements: [],
    });
    await invoke(named(h.tree, "InterviewReviewView"), "onClose");
    h.render();
    expect(named(h.tree, "MarkdownEditStep").props.markdownText).toBe(
      "本人の編集本文",
    );
    h.unmount();
  });
  it("OCR failure remains editable and images can be removed without saving them", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockRejectedValue(new Error("架空のOCR失敗")),
    );
    vi.spyOn(URL, "revokeObjectURL").mockImplementation(() => {});
    const h = new HookHarness(() => BriefingNoteFlow());
    h.render();
    await h.settle();
    const image = {
      id: id(),
      file: new File(["dummy"], "dummy.png", { type: "image/png" }),
      previewUrl: "blob:dummy",
    };
    await invoke(named(h.tree, "UploadStep"), "onAddImages", [image]);
    h.render();
    await h.settle();
    await invoke(named(h.tree, "UploadStep"), "onNext");
    h.render();
    await h.settle();
    expect(named(h.tree, "OcrReviewStep").props.hasOcrError).toBe(true);
    await invoke(
      named(h.tree, "OcrReviewStep"),
      "onChangeOcrText",
      "本人の訂正",
    );
    h.render();
    expect(named(h.tree, "OcrReviewStep").props.ocrText).toBe("本人の訂正");
    await invoke(named(h.tree, "OcrReviewStep"), "onBack");
    h.render();
    await h.settle();
    await invoke(named(h.tree, "UploadStep"), "onRemoveImage", image.id);
    h.render();
    expect(named(h.tree, "UploadStep").props.selectedImages).toEqual([]);
    h.unmount();
  });
});
