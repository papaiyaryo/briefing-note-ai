import { expect, it, vi } from "vitest";
import { legacyRecord } from "./fixtures";
const target = "../../src/lib/companyComparison/legacy";
async function legacy() {
  const value = await import(target).catch(() => null);
  expect(value, "U3 legacy境界が実装されている").not.toBeNull();
  return value!;
}
function storage(raw: string | null) {
  return { getItem: vi.fn(() => raw), setItem: vi.fn() };
}
it("BR6.1: 正常旧形式のfallback ID/日付をそのまま保持", async () => {
  const l = await legacy(),
    record = legacyRecord(),
    store = storage(JSON.stringify([record]));
  expect(l.readLegacy(store)).toMatchObject({
    state: "ready",
    records: [record],
    writable: true,
  });
  expect(store.setItem).not.toHaveBeenCalled();
});
it("BR6.1: 未設定と空配列をemptyとする", async () => {
  const l = await legacy();
  for (const raw of [null, "[]"])
    expect(l.readLegacy(storage(raw))).toMatchObject({
      state: "empty",
      records: [],
      writable: true,
    });
});
it("BR6.1: JSON破損はcorrupt・非書込", async () => {
  const l = await legacy(),
    store = storage("{");
  expect(l.readLegacy(store)).toMatchObject({
    state: "corrupt",
    writable: false,
  });
  expect(store.setItem).not.toHaveBeenCalled();
});
it("NFR2.7: storage利用不能を0件と混同しない", async () => {
  const l = await legacy();
  expect(
    l.readLegacy({
      getItem() {
        throw Error("blocked");
      },
      setItem: vi.fn(),
    }),
  ).toMatchObject({ state: "unavailable", writable: false });
});
it("BR6.1: 不正混在は正常分を表示しても書込停止", async () => {
  const l = await legacy(),
    record = legacyRecord(),
    store = storage(JSON.stringify([record, { id: "bad" }])),
    read = l.readLegacy(store);
  expect(read).toMatchObject({
    state: "corrupt",
    records: [record],
    writable: false,
  });
  expect(() =>
    l.updateLegacy(store, record.id, { level: "high", memo: "変更" }),
  ).toThrow();
  expect(store.setItem).not.toHaveBeenCalled();
});
it("BR6.1: 正常旧編集は他記録/形式/日付を保つ", async () => {
  const l = await legacy(),
    a = legacyRecord(),
    b = { ...legacyRecord(), id: "other" },
    store = storage(JSON.stringify([a, b]));
  const result = l.updateLegacy(store, a.id, {
    level: "high",
    memo: "本人コメント",
  });
  expect(result[0]).toMatchObject({
    id: a.id,
    savedAt: a.savedAt,
    interestNote: { level: "high", memo: "本人コメント" },
  });
  expect(result[1]).toEqual(b);
  expect(store.setItem).toHaveBeenCalledOnce();
});
it("NFR4.4: 旧構造/level不正を成功記録にしない", async () => {
  const l = await legacy(),
    record = legacyRecord();
  for (const item of [
    { ...record, memo: {} },
    { ...record, interestNote: { level: "invalid", memo: "" } },
    { ...record, id: "" },
  ])
    expect(l.readLegacy(storage(JSON.stringify([item])))).toMatchObject({
      state: "corrupt",
      writable: false,
    });
});
it("AC9.1.4: 有効旧データは既存出力形式を維持・サーバー送信なし", async () => {
  const l = await legacy(),
    record = legacyRecord(),
    store = storage(JSON.stringify([record]));
  expect(l.legacyMarkdown(l.readLegacy(store).records)).toContain(
    "# 企業比較メモ",
  );
  expect(store.setItem).not.toHaveBeenCalled();
});
