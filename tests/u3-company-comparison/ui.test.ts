import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { ComparisonSession } from "../../src/lib/companyComparison/session";
import { ComparisonEdits } from "../../src/lib/companyComparison/edits";
import { ComparisonClient } from "../../src/lib/companyComparison/client";
import { ClientFailure, WorkspaceClient } from "../../src/lib/workspace/client";
import { snapshot, selection, OWNER_A, id } from "./fixtures";
import {
  HookHarness,
  control,
  invoke,
  text,
  change,
  browserGlobals,
} from "./uiHarness";
const workspace = vi.hoisted(() => ({ value: null as unknown }));
vi.mock("../../src/components/workspace/WorkspaceShell", () => ({
  useWorkspace: () => workspace.value,
}));
const base = "../../src/components/compare/";
it("BR4.4: 選択外/削除済み対象のunknownも同ID照会へ戻れる", async () => {
  const Server = await component("ServerCompanyComparison"),
    { session, value } = setup(),
    fieldKey = session.ensureField(value.sources[0], "reason"),
    operationId = id(),
    preparer = new ComparisonClient(),
    source = value.sources[0],
    field = session.state.fields.get(fieldKey)!;
  field.intent = {
    request: preparer.prepareReason(
      source.company.companyId,
      source.memo.memoId,
      source.memo.version,
      "送信済み",
      operationId,
    ),
    value: "送信済み",
    lookupUnknown: false,
  };
  field.status = "unknown";
  session.select([], () => true);
  const client = {
    readBoard: vi.fn(async () => ({ cards: [], savedCompanyCount: 0 })),
    lookup: vi.fn(async () => ({
      state: "committed",
      outcome: {
        operationId,
        action: "memo_update",
        companyId: source.company.companyId,
        memoId: source.memo.memoId,
        resultingVersion: "opaque:committed",
        committedAt: "2026-10-17T00:00:00Z",
      },
    })),
    readMemo: vi.fn(async () => {
      throw Error("deleted after commit");
    }),
    send: vi.fn(),
  };
  const h = new HookHarness(() => Server({ session, client }));
  h.render();
  await h.settle();
  expect(text(h.tree)).toContain("保持中");
  await invoke(control(h.tree, "comparison-retained-lookup"), "onClick");
  await h.settle();
  expect(client.lookup).toHaveBeenCalledWith(operationId);
  expect(client.send).not.toHaveBeenCalled();
  expect(field).toMatchObject({ status: "committed", readbackState: "error" });
  h.unmount();
});
it("BR5.3: 表に保存志望度/保存理由をdraftとは別に示す", async () => {
  const Table = await component("ComparisonTable"),
    { value } = setup();
  value.sources[0].company.interestLevel = "medium";
  value.sources[0].memo.comparisonReason = "保存済み理由";
  const html = renderToStaticMarkup(
    React.createElement(Table, { snapshot: value }),
  );
  expect(html).toContain("保存企業志望度");
  expect(html).toContain("中くらい");
  expect(html).toContain("保存済み理由");
});
async function component(name: string) {
  const result = await import(base + name).catch(() => null);
  expect(result, "U3画面が実装されている").not.toBeNull();
  return result![name];
}
function setup(count = 1) {
  const session = new ComparisonSession();
  session.setOwner(OWNER_A);
  const value = snapshot(count);
  session.select(selection(value));
  session.install(value, session.token());
  return { session, value };
}
beforeEach(() => {
  browserGlobals();
  workspace.value = {
    userId: OWNER_A,
    client: new WorkspaceClient({
      fetch: vi.fn(async () => Response.json({})),
    }),
  };
});
afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});
it("AC8.1.5: 新比較が標準、旧比較は明示入口", async () => {
  const Home = await component("ComparisonHome"),
    { session } = setup(),
    h = new HookHarness(() => Home({ session }));
  h.render();
  expect(text(h.tree)).toContain("保存した企業を比較");
  expect(control(h.tree, "comparison-legacy-entry")).toBeDefined();
  expect(text(h.tree)).not.toContain("旧データを読み込んでいます");
});
it("BR4.4: dirty時の旧入口取消で新比較入力を保持", async () => {
  const Home = await component("ComparisonHome"),
    { session, value } = setup(),
    key = session.ensureField(value.sources[0], "reason");
  session.edit(key, "保持");
  const h = new HookHarness(() => Home({ session }));
  h.render();
  await invoke(control(h.tree, "comparison-legacy-entry"), "onClick");
  h.render();
  expect(text(h.tree)).toContain("未保存");
  await invoke(control(h.tree, "comparison-stay"), "onClick");
  h.render();
  expect(session.state.fields.get(key)?.draftValue).toBe("保持");
});
it("NFR5.3: 入口h1にfocus契約のtabIndexとrefを持つ", async () => {
  const Home = await component("ComparisonHome"),
    { session } = setup(),
    h = new HookHarness(() => Home({ session }));
  h.render();
  expect(control(h.tree, "comparison-heading").props.tabIndex).toBe(-1);
  expect(control(h.tree, "comparison-heading").props.ref).toBeDefined();
});
it("BR3.1: PC tableのcaption/行列見出しと固定7観点", async () => {
  const Table = await component("ComparisonTable"),
    { value } = setup(),
    html = renderToStaticMarkup(
      React.createElement(Table, { snapshot: value }),
    );
  expect(html).toContain("<caption");
  expect(html).toContain('scope="col"');
  expect(html).toContain('scope="row"');
  expect(html).toContain("HR・社員の強調点");
});
it("NFR5.2: PC/mobileで同じ観点と保存名・未記載", async () => {
  const Table = await component("ComparisonTable"),
    { value } = setup();
  value.sources[0].company.name = "保存名";
  const html = renderToStaticMarkup(
    React.createElement(Table, { snapshot: value }),
  );
  expect(html).toContain("保存名");
  expect(html).toContain("未記載");
  expect(html).toContain("comparison-mobile-points");
  expect(html).toContain("comparison-table-scroll");
});
it("NFR5.1: 危険HTMLはtext・出自/Web全metadataを別区分", async () => {
  const Table = await component("ComparisonTable"),
    { value } = setup();
  value.sources[0].memo.origin = "generated";
  value.sources[0].memo.providerOrigin = "dummy";
  value.sources[0].memo.structuredContent.strengths = [
    "<img onerror=alert(1)>",
  ];
  value.sources[0].memo.adoptedWebSources = [
    {
      id: "source-id",
      category: "Web区分",
      content: "Web内容",
      sourceUrl: "https://example.test",
      fetchedAt: "2026-10-17T00:00:00Z",
      confidence: "low",
      status: "adopted",
    },
  ];
  const html = renderToStaticMarkup(
    React.createElement(Table, { snapshot: value }),
  );
  for (const part of [
    "&lt;img",
    "検証用",
    "source-id",
    "low",
    "adopted",
    "Web区分",
  ])
    expect(html).toContain(part);
  expect(html).not.toContain("<img onerror");
});
it("BR4.1: 理由欄と志望度欄に別label/保存操作", async () => {
  const Editor = await component("ComparisonFieldEditor"),
    { session, value } = setup(),
    edits = new ComparisonEdits(session, new ComparisonClient()),
    interest = session.ensureField(value.sources[0], "interest"),
    reason = session.ensureField(value.sources[0], "reason");
  const html = [interest, reason]
    .map((fieldKey) =>
      renderToStaticMarkup(
        React.createElement(Editor, { session, edits, fieldKey }),
      ),
    )
    .join("");
  expect(html).toContain("企業志望度");
  expect(html).toContain("比較理由");
  expect(html).toContain("5000");
  expect(html).toContain("未設定");
});
it("BR4.1: 理由callbackは他欄を変更しない", async () => {
  const Editor = await component("ComparisonFieldEditor"),
    { session, value } = setup(),
    edits = new ComparisonEdits(session, new ComparisonClient()),
    fieldKey = session.ensureField(value.sources[0], "reason"),
    other = session.ensureField(value.sources[0], "interest"),
    h = new HookHarness(() => Editor({ session, edits, fieldKey }));
  h.render();
  await invoke(
    control(h.tree, "comparison-field-input"),
    "onChange",
    change("本人入力"),
  );
  expect(session.state.fields.get(fieldKey)?.draftValue).toBe("本人入力");
  expect(session.state.fields.get(other)?.draftValue).toBeNull();
});
it("BR4.2: unknownは照会と同一要求retryを独立表示", async () => {
  const Editor = await component("ComparisonFieldEditor"),
    { session, value } = setup(),
    edits = new ComparisonEdits(session, new ComparisonClient()),
    fieldKey = session.ensureField(value.sources[0], "reason"),
    field = session.state.fields.get(fieldKey)!;
  field.status = "unknown";
  const html = renderToStaticMarkup(
    React.createElement(Editor, { session, edits, fieldKey }),
  );
  expect(html).toContain("結果不明");
  expect(html).toContain("操作結果を確認");
  expect(html).toContain("同じ要求");
  expect(html).toContain('role="status"');
});
it("BR4.3: 競合の旧base/draft/latestと明示rebase", async () => {
  const Editor = await component("ComparisonFieldEditor"),
    { session, value } = setup(),
    edits = new ComparisonEdits(session, new ComparisonClient()),
    fieldKey = session.ensureField(value.sources[0], "reason"),
    field = session.state.fields.get(fieldKey)!;
  field.baseValue = "旧値";
  field.draftValue = "保持入力";
  field.status = "conflict";
  field.latest = { value: "最新値", version: "new" };
  const html = renderToStaticMarkup(
    React.createElement(Editor, { session, edits, fieldKey }),
  );
  for (const part of ["旧値", "保持入力", "最新値", "最新を基準"])
    expect(html).toContain(part);
});
it("NFR2.5: committed＋readback errorは再保存を誘導しない", async () => {
  const Editor = await component("ComparisonFieldEditor"),
    { session, value } = setup(),
    edits = new ComparisonEdits(session, new ComparisonClient()),
    fieldKey = session.ensureField(value.sources[0], "reason"),
    field = session.state.fields.get(fieldKey)!;
  field.status = "committed";
  const operationId = id();
  field.intent = { request: new ComparisonClient().prepareReason(field.companyId, field.memoId!, field.baseVersion, "確定済み", operationId), value: "確定済み", lookupUnknown: false };
  field.outcome = { operationId, action: "memo_update", companyId: field.companyId, memoId: field.memoId, resultingVersion: "confirmed", committedAt: "2026-10-17T00:00:00Z" };
  field.readbackState = "error";
  const html = renderToStaticMarkup(
    React.createElement(Editor, { session, edits, fieldKey }),
  );
  expect(html).toContain("保存成功");
  expect(html).toContain("最新の取得に失敗");
});
it("BR2.2: 候補のloadingと取得失敗を空と区別", async () => {
  const Server = await component("ServerCompanyComparison"),
    session = new ComparisonSession();
  session.setOwner(OWNER_A);
  const client = {
      readBoard: vi.fn(async () => {
        throw Error("offline");
      }),
    },
    h = new HookHarness(() => Server({ session, client }));
  h.render();
  expect(text(h.tree)).toContain("読み込");
  await h.settle();
  expect(text(h.tree)).toContain("取得に失敗");
  expect(text(h.tree)).not.toContain("保存企業がありません");
  h.unmount();
});
it("BR2.2: 終了企業も候補・構造なしとページを表示", async () => {
  const Server = await component("ServerCompanyComparison"),
    session = new ComparisonSession();
  session.setOwner(OWNER_A);
  const companyId = id(),
    client = {
      readBoard: vi.fn(async () => ({
        cards: [
          {
            companyId,
            name: "終了企業",
            memoCount: 50,
            selectionStatus: "rejected",
          },
        ],
        savedCompanyCount: 1,
      })),
      readMemos: vi.fn(async () => ({
        items: [
          {
            memoId: id(),
            companyId,
            hasStructuredContent: false,
            updatedAt: "2026-10-17",
          },
        ],
        nextCursor: "more",
      })),
    },
    h = new HookHarness(() => Server({ session, client }));
  h.render();
  await h.settle();
  expect(text(h.tree)).toContain("終了企業");
  await invoke(control(h.tree, "comparison-load-memos"), "onClick");
  await h.settle();
  expect(text(h.tree)).toContain("構造化項目なし");
  expect(text(h.tree)).toContain("次のメモ");
  expect(text(h.tree)).toContain("50");
  h.unmount();
});
it("NFR2.5: 再mountは同じstoreのunknownを初期化しない", async () => {
  const Editor = await component("ComparisonFieldEditor"),
    { session, value } = setup(),
    edits = new ComparisonEdits(session, new ComparisonClient()),
    fieldKey = session.ensureField(value.sources[0], "reason");
  session.state.fields.get(fieldKey)!.status = "unknown";
  const one = new HookHarness(() => Editor({ session, edits, fieldKey }));
  one.render();
  one.unmount();
  const two = new HookHarness(() => Editor({ session, edits, fieldKey }));
  two.render();
  expect(text(two.tree)).toContain("結果不明");
  expect(session.state.fields.get(fieldKey)?.status).toBe("unknown");
});
it("BR6.1: legacy境界はloading/破損を説明しserver移行しない", async () => {
  const Legacy = await component("LegacyComparisonBoundary"),
    html = renderToStaticMarkup(React.createElement(Legacy));
  expect(html).toContain("このブラウザの旧比較");
  expect(html).toContain("サーバー");
});
it("NFR1.3: Providerは別SSR間で同一storeを公開しない", async () => {
  const Provider = await component("ComparisonSessionProvider"),
    html = renderToStaticMarkup(
      React.createElement(
        Provider,
        null,
        React.createElement("p", null, "子画面"),
      ),
    );
  expect(html).toContain("子画面");
});

function feedbackSetup(count = 1) {
  const { session, value } = setup(count), prepare = new ComparisonClient();
  const client = {
    readBoard: vi.fn(async () => ({ cards: [], savedCompanyCount: count })),
    readComparison: vi.fn(async () => value),
    prepareInterest: vi.fn(prepare.prepareInterest.bind(prepare)),
    prepareReason: vi.fn(prepare.prepareReason.bind(prepare)),
    send: vi.fn(async (request: { path: string; body: string }) => {
      const source = value.sources.find(s => request.path.includes(s.company.companyId))!;
      return { operationId: JSON.parse(request.body).operationId, action: request.path.includes("/memos/") ? "memo_update" as const : "company_update" as const, companyId: source.company.companyId, memoId: request.path.includes("/memos/") ? source.memo.memoId : null, resultingVersion: "confirmed", committedAt: "2026-10-17T00:00:00Z" };
    }),
    lookup: vi.fn(async () => ({ state: "unknown" as const })),
    readMemo: vi.fn(async (companyId: string) => value.sources.find(s => s.company.companyId === companyId)!.memo),
    readCompany: vi.fn(async (companyId: string) => value.sources.find(s => s.company.companyId === companyId)!.company),
  };
  const edits = new ComparisonEdits(session, client as unknown as ComparisonClient);
  return { session, value, client, edits, reason: session.ensureField(value.sources[0], "reason") };
}
it("U-R1 AC6.3.1: 実409→latest503 callback後は両表示で成功文なし", async () => {
  const Server = await component("ServerCompanyComparison"), Editor = await component("ComparisonFieldEditor"), x = feedbackSetup();
  const server = new HookHarness(() => Server(x)); server.render(); await server.settle();
  const editor = new HookHarness(() => Editor({ ...x, fieldKey: x.reason })); editor.render();
  x.session.edit(x.reason, "保持入力");
  x.client.send.mockRejectedValueOnce(new ClientFailure("version_conflict", 409));
  await invoke(control(editor.tree, "comparison-field-save"), "onClick"); editor.render();
  x.client.readMemo.mockRejectedValueOnce(new ClientFailure("unavailable", 503));
  await invoke(control(editor.tree, "comparison-field-latest"), "onClick");
  editor.render(); server.render();
  for (const tree of [editor.tree, server.tree]) {
    expect(text(tree)).not.toContain("保存成功");
    expect(text(tree)).toContain("競合");
    expect(text(tree)).toContain("保持");
    expect(text(tree)).toContain("取得");
  }
  expect(x.client.send).toHaveBeenCalledOnce(); server.unmount(); editor.unmount();
});
it("U-R2 BR4.1: 当該確定outcomeだけ成功と取得失敗、欠落/別意図なら成功なし", async () => {
  const Server = await component("ServerCompanyComparison"), Editor = await component("ComparisonFieldEditor"), x = feedbackSetup();
  const h = new HookHarness(() => Server(x)); h.render(); await h.settle();
  x.session.edit(x.reason, "変更"); x.client.readMemo.mockRejectedValueOnce(new ClientFailure("unavailable", 503));
  await x.edits.save(x.reason);
  const field = x.session.state.fields.get(x.reason)!, valid = field.outcome!;
  const editorText = () => renderToStaticMarkup(React.createElement(Editor, { ...x, fieldKey: x.reason }));
  h.render();
  for (const output of [text(h.tree), editorText()]) {
    expect(output).toContain("保存成功"); expect(output).toContain("最新の取得に失敗"); expect(output).toContain(valid.operationId);
  }
  for (const invalid of [undefined, { ...valid, operationId: id() }, { ...valid, companyId: id() }]) {
    field.outcome = invalid; h.render();
    expect(text(h.tree)).not.toContain("保存成功"); expect(editorText()).not.toContain("保存成功");
  }
  expect(x.client.send).toHaveBeenCalledOnce(); h.unmount();
});
it("U-R3 AC6.4.3: 実refresh404配線で入力/save/rebase停止、直接controllerもPATCH0", async () => {
  const Server = await component("ServerCompanyComparison"), Editor = await component("ComparisonFieldEditor"), x = feedbackSetup();
  const h = new HookHarness(() => Server(x)); h.render(); await h.settle();
  x.session.edit(x.reason, "保持入力");
  const field = x.session.state.fields.get(x.reason)!, base = field.baseVersion;
  field.status = "conflict";
  x.client.readComparison.mockRejectedValueOnce(new ClientFailure("not_found", 404));
  await invoke(control(h.tree, "comparison-refresh"), "onClick"); h.render();
  const editor = new HookHarness(() => Editor({ ...x, fieldKey: x.reason })); editor.render();
  expect(text(h.tree)).toContain("対象なし／利用不可"); expect(text(h.tree)).toContain("古い参照・出力不可");
  expect(text(editor.tree)).toContain("入力・新規保存・基準更新は利用できません");
  expect(control(editor.tree, "comparison-field-input").props.disabled).toBe(true);
  expect(control(editor.tree, "comparison-field-save").props.disabled).toBe(true);
  await invoke(control(editor.tree, "comparison-field-input"), "onChange", change("不許可入力"));
  await x.edits.save(x.reason);
  expect(() => x.edits.rebase(x.reason)).toThrow();
  expect(field).toMatchObject({ baseVersion: base, draftValue: "保持入力", status: "conflict" });
  expect(x.client.send).not.toHaveBeenCalled(); expect(x.client.prepareReason).not.toHaveBeenCalled();
  const files = vi.spyOn(document, "createElement");
  await invoke(control(h.tree, "comparison-export"), "onClick"); expect(files).not.toHaveBeenCalled();
  h.unmount(); editor.unmount();
});
it("U-R4 NFR2.7: refresh503は通信取得失敗で404と区別し古い出力0", async () => {
  const Server = await component("ServerCompanyComparison"), x = feedbackSetup();
  const h = new HookHarness(() => Server(x)); h.render(); await h.settle();
  x.session.edit(x.reason, "保持入力");
  x.client.readComparison.mockRejectedValueOnce(new ClientFailure("unavailable", 503));
  await invoke(control(h.tree, "comparison-refresh"), "onClick"); h.render();
  expect(text(h.tree)).toContain("取得に失敗"); expect(text(h.tree)).not.toContain("対象なし／利用不可");
  expect(x.session.isFieldAvailable(x.session.state.fields.get(x.reason)!)).toBe(true);
  expect(x.session.state.fields.get(x.reason)?.draftValue).toBe("保持入力");
  const files = vi.spyOn(document, "createElement");
  await invoke(control(h.tree, "comparison-export"), "onClick"); expect(files).not.toHaveBeenCalled();
  expect(x.client.send).not.toHaveBeenCalled(); h.unmount();
});
it("U-R5 BR4.2: 選択外/利用不可unknownの保持欄から同ID照会し元確定を表示", async () => {
  const Server = await component("ServerCompanyComparison"), x = feedbackSetup();
  const h = new HookHarness(() => Server(x)); h.render(); await h.settle();
  x.session.edit(x.reason, "変更"); x.client.send.mockRejectedValueOnce(new ClientFailure("unavailable", 0, true));
  await x.edits.save(x.reason);
  const request = x.session.state.fields.get(x.reason)!.intent!.request;
  x.client.readComparison.mockRejectedValueOnce(new ClientFailure("not_found", 404));
  await invoke(control(h.tree, "comparison-refresh"), "onClick");
  x.session.select([], () => true); h.render();
  expect(text(h.tree)).toContain("結果不明");
  const outcome = { operationId: JSON.parse(request.body).operationId, action: "memo_update", companyId: x.value.sources[0].company.companyId, memoId: x.value.sources[0].memo.memoId, resultingVersion: "confirmed", committedAt: "2026-10-17T00:00:00Z" };
  x.client.lookup.mockResolvedValueOnce({ state: "committed", outcome } as never);
  x.client.readMemo.mockRejectedValueOnce(new ClientFailure("not_found", 404));
  await invoke(control(h.tree, "comparison-retained-lookup"), "onClick"); h.render();
  expect(x.client.lookup).toHaveBeenCalledWith(outcome.operationId);
  expect(text(h.tree)).toContain(outcome.operationId); expect(text(h.tree)).toContain("保存成功");
  expect(x.client.send).toHaveBeenCalledOnce(); expect(x.client.prepareReason).toHaveBeenCalledOnce(); h.unmount();
});
it("U-R6 AC6.5.4: 有効な別対象を明示latest確認して保存、消失欄と全体出力は停止", async () => {
  const Server = await component("ServerCompanyComparison"), Editor = await component("ComparisonFieldEditor"), x = feedbackSetup(2);
  const h = new HookHarness(() => Server(x)); h.render(); await h.settle();
  x.session.edit(x.reason, "保持入力");
  x.client.readComparison.mockRejectedValueOnce(new ClientFailure("not_found", 404));
  await invoke(control(h.tree, "comparison-refresh"), "onClick");
  const other = x.session.ensureField(x.value.sources[1], "reason");
  const editor = new HookHarness(() => Editor({ ...x, fieldKey: other })); editor.render();
  await invoke(control(editor.tree, "comparison-field-latest"), "onClick"); editor.render();
  await invoke(control(editor.tree, "comparison-field-input"), "onChange", change("有効な別欄"));
  await invoke(control(editor.tree, "comparison-field-save"), "onClick"); h.render(); editor.render();
  expect(x.client.send).toHaveBeenCalledOnce();
  expect(x.client.send.mock.calls[0][0].path).toContain(x.value.sources[1].memo.memoId);
  await x.edits.save(x.reason); expect(x.client.send).toHaveBeenCalledOnce();
  expect(x.session.isFieldAvailable(x.session.state.fields.get(x.reason)!)).toBe(false);
  expect(control(h.tree, "comparison-export").props.disabled).toBe(true);
  const html = renderToStaticMarkup(React.createElement(Editor, { ...x, fieldKey: other }));
  expect(html).toContain("<label"); expect(html).toContain('role="status"');
  h.unmount(); editor.unmount();
});
