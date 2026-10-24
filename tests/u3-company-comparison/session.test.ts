import { expect, it } from "vitest";
import { snapshot, selection, OWNER_A, OWNER_B } from "./fixtures";
const target = "../../src/lib/companyComparison/session";
async function setup() {
  const m = await import(target).catch(() => null);
  expect(m, "U3 sessionが実装されている").not.toBeNull();
  const store = new m!.ComparisonSession();
  store.setOwner(OWNER_A);
  const source = snapshot(1);
  store.select(selection(source));
  store.install(source, store.token());
  return { store, source };
}
it("NFR1.3: app instance/SSR間で状態を共有しない", async () => {
  const a = await setup(),
    b = await setup();
  a.store.select([]);
  expect(b.store.state.selected).toHaveLength(1);
});
it("BR1.2: 別ownerへ比較/draftを出さない", async () => {
  const { store, source } = await setup(),
    key = store.ensureField(source.sources[0], "reason");
  store.edit(key, "A入力");
  store.setOwner(OWNER_B);
  expect(store.state.snapshot).toBeNull();
  expect(store.state.fields.size).toBe(0);
});
it("BR1.2: A復帰は一時draftを保持して明示復旧を要求", async () => {
  const { store, source } = await setup(),
    key = store.ensureField(source.sources[0], "reason");
  store.edit(key, "A入力");
  store.setOwner(OWNER_B);
  store.setOwner(OWNER_A);
  expect(store.state.fields.get(key).draftValue).toBe("A入力");
  expect(store.state.restorationRequired).toBe(true);
  expect(store.state.snapshot).toBeNull();
});
it("BR1.2: owner変更後のlate成功は不採用", async () => {
  const { store, source } = await setup(),
    token = store.token();
  store.setOwner(OWNER_B);
  expect(store.install(source, token)).toBe(false);
  expect(store.state.snapshot).toBeNull();
});
it("BR5.1: 選択変更後のlate成功は不採用", async () => {
  const { store, source } = await setup(),
    token = store.token();
  store.select([]);
  expect(store.install(source, token)).toBe(false);
});
it("BR1.2: 同選択でも新要求が旧応答を無効化", async () => {
  const { store, source } = await setup(),
    old = store.beginRequest();
  store.beginRequest();
  expect(store.install(source, old)).toBe(false);
});
it("BR5.2: 入力世代を変更して出力確認tokenを無効化", async () => {
  const { store, source } = await setup(),
    key = store.ensureField(source.sources[0], "reason"),
    token = store.token();
  store.edit(key, "new");
  expect(store.accepts(token, true)).toBe(false);
});
it("BR4.4: dirty選択取消で入力/元選択を保持", async () => {
  const { store, source } = await setup(),
    key = store.ensureField(source.sources[0], "reason");
  store.edit(key, "保持");
  expect(store.select([], () => false)).toBe(false);
  expect(store.state.selected).toEqual(selection(source));
  expect(store.state.fields.get(key).draftValue).toBe("保持");
});
it("BR4.4: 明示破棄なら選択変更できる", async () => {
  const { store, source } = await setup(),
    key = store.ensureField(source.sources[0], "reason");
  store.edit(key, "保持");
  expect(store.select([], () => true)).toBe(true);
  expect(store.hasUnsaved()).toBe(false);
  expect(store.state.snapshot).toBeNull();
});
it("NFR2.5: 同じ対象を再ensureしてもdraft/baseを初期化しない", async () => {
  const { store, source } = await setup(),
    key = store.ensureField(source.sources[0], "reason"),
    base = store.state.fields.get(key).baseVersion;
  store.edit(key, "保持");
  const next = structuredClone(source.sources[0]);
  next.memo.version = "opaque:new";
  next.memo.comparisonReason = "他client";
  expect(store.ensureField(next, "reason")).toBe(key);
  expect(store.state.fields.get(key)).toMatchObject({
    draftValue: "保持",
    baseVersion: base,
  });
});
it("BR4.1: 志望度はcompany別、理由はmemo別の独立欄", async () => {
  const { store, source } = await setup(),
    a = store.ensureField(source.sources[0], "interest"),
    b = store.ensureField(source.sources[0], "reason");
  store.edit(a, "high");
  expect(store.state.fields.get(b).draftValue).toBeNull();
  expect(a).not.toBe(b);
});
it("NFR7.4: 通知subscribeを解除でき常時APIを持たない", async () => {
  const { store } = await setup();
  let calls = 0;
  const stop = store.subscribe(() => calls++);
  store.select([]);
  expect(calls).toBeGreaterThan(0);
  stop();
  const count = calls;
  store.select([]);
  expect(calls).toBe(count);
});

it("S-R1 AC8.1.4: 全選択404は原因を推測せず参照だけ停止し入力と操作を保持", async () => {
  const { store, source } = await setup();
  const key = store.ensureField(source.sources[0], "reason");
  store.edit(key, "保持");
  const field = store.state.fields.get(key), before = structuredClone(field);
  const selected = structuredClone(store.state.selected);
  store.invalidateReferences(store.beginRequest());
  expect(store.isFieldAvailable(field)).toBe(false);
  expect(store.isFieldAvailable(store.state.fields.get(store.ensureField(source.sources[0], "interest")))).toBe(false);
  expect(field).toEqual(before);
  expect(store.state.selected).toEqual(selected);
  expect(store.state.snapshot).toEqual(source);
  expect(store.state.status).not.toBe("ready");
});
it("S-R2 BR1.2: 旧選択/旧owner/旧要求の404は現参照を停止しない", async () => {
  const { store, source } = await setup();
  const field = store.state.fields.get(store.ensureField(source.sources[0], "reason"));
  const oldRequest = store.beginRequest();
  store.beginRequest();
  expect(store.invalidateReferences(oldRequest)).toBe(false);
  const oldSelection = store.token();
  store.select(selection(source));
  expect(store.invalidateReferences(oldSelection)).toBe(false);
  const oldOwner = store.token();
  store.setOwner(OWNER_B); store.setOwner(OWNER_A);
  expect(store.invalidateReferences(oldOwner)).toBe(false);
  expect(store.isFieldAvailable(field)).toBe(true);
});
it("S-R3 NFR3.3: 有効な全snapshotだけ同じ対象の参照ガードを解除", async () => {
  const { store, source } = await setup();
  const key = store.ensureField(source.sources[0], "reason");
  store.invalidateReferences(store.beginRequest());
  const old = store.token(); store.beginRequest();
  expect(store.install(source, old)).toBe(false);
  expect(store.isFieldAvailable(store.state.fields.get(key))).toBe(false);
  const wrong = structuredClone(source); wrong.sources[0].memo.companyId = OWNER_B;
  expect(() => store.install(wrong, store.token())).toThrow();
  expect(store.isFieldAvailable(store.state.fields.get(key))).toBe(false);
  expect(store.install(source, store.token())).toBe(true);
  expect(store.isFieldAvailable(store.state.fields.get(key))).toBe(true);
});
it("S-R4 BR5.1: 全選択404は選択外の保持欄/無関係な企業へ波及しない", async () => {
  const { store, source } = await setup();
  const other = snapshot(1), key = store.ensureField(other.sources[0], "reason");
  store.invalidateReferences(store.beginRequest());
  expect(store.isFieldAvailable(store.state.fields.get(key))).toBe(true);
  expect(store.isFieldAvailable(store.state.fields.get(store.ensureField(source.sources[0], "reason")))).toBe(false);
});
it("S-R5 NFR2.5: owner別退避と一時往復でもガード/draft/送信済みintentを保持", async () => {
  const { store, source } = await setup();
  const field = store.state.fields.get(store.ensureField(source.sources[0], "reason"));
  store.edit(store.ensureField(source.sources[0], "reason"), "保持");
  field.status = "unknown";
  field.intent = { request: { path: "/fixed", method: "PATCH", body: "fixed" }, value: "保持", lookupUnknown: false };
  store.invalidateReferences(store.beginRequest());
  const before = structuredClone(field);
  store.select([], () => true); store.setOwner(OWNER_B); store.setOwner(OWNER_A);
  expect(store.isFieldAvailable(field)).toBe(false);
  expect(field).toEqual(before);
  expect(store.state.restorationRequired).toBe(true);
});
