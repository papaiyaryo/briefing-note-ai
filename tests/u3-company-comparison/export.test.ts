import { expect, it, vi } from "vitest";
import { ComparisonClient } from "../../src/lib/companyComparison/client";
import { ComparisonEdits } from "../../src/lib/companyComparison/edits";
import { ClientFailure } from "../../src/lib/workspace/client";
import { snapshot, selection, OWNER_A, OWNER_B } from "./fixtures";
const sessionTarget = "../../src/lib/companyComparison/session",
  exportTarget = "../../src/lib/companyComparison/export";
async function setup() {
  const sm = await import(sessionTarget).catch(() => null),
    em = await import(exportTarget).catch(() => null);
  expect(sm && em, "U3出力が実装されている").toBeTruthy();
  const store = new sm!.ComparisonSession();
  store.setOwner(OWNER_A);
  const value = snapshot();
  store.select(selection(value));
  store.install(value, store.token());
  const port = { readComparison: vi.fn(async () => structuredClone(value)) },
    download = vi.fn();
  return {
    store,
    value,
    port,
    download,
    run: () => em!.exportComparison(store, port, download),
  };
}
it("BR5.2: 毎クリック1C3確認、同snapshotから1file", async () => {
  const x = await setup();
  await x.run();
  expect(x.port.readComparison).toHaveBeenCalledOnce();
  expect(x.download).toHaveBeenCalledOnce();
  expect(x.download.mock.calls[0][0]).toContain(
    x.value.sources[0].memo.version,
  );
  await x.run();
  expect(x.port.readComparison).toHaveBeenCalledTimes(2);
  expect(x.download).toHaveBeenCalledTimes(2);
});
it("BR5.3: 未保存なら確認/出力0・入力保持", async () => {
  const x = await setup(),
    key = x.store.ensureField(x.value.sources[0], "reason");
  x.store.edit(key, "保持");
  await x.run();
  expect(x.download).not.toHaveBeenCalled();
  expect(x.port.readComparison).not.toHaveBeenCalled();
  expect(x.store.state.fields.get(key).draftValue).toBe("保持");
});
it("BR5.2: 全company版変更はfile0、最新表示して再クリック", async () => {
  const x = await setup(),
    next = structuredClone(x.value);
  next.sources[1].company.version = "opaque:new";
  x.port.readComparison.mockResolvedValue(next);
  await x.run();
  expect(x.download).not.toHaveBeenCalled();
  expect(x.store.state.snapshot).toEqual(next);
  await x.run();
  expect(x.download).toHaveBeenCalledOnce();
});
it("BR5.2: 全memo版変更はfile0", async () => {
  const x = await setup(),
    next = structuredClone(x.value);
  next.sources[1].memo.version = "opaque:new";
  x.port.readComparison.mockResolvedValue(next);
  await x.run();
  expect(x.download).not.toHaveBeenCalled();
});
it("BR5.2: snapshotVersionだけの差は誤拒否しない", async () => {
  const x = await setup();
  x.port.readComparison.mockResolvedValue({
    ...x.value,
    snapshotVersion: "unrelated",
  });
  await x.run();
  expect(x.download).toHaveBeenCalledOnce();
});
it.each(["deleted", "unauthenticated", "timeout"])(
  "BR5.2: %s読取失敗でfile0",
  async () => {
    const x = await setup();
    x.port.readComparison.mockRejectedValueOnce(Error("read failed"));
    await x.run();
    expect(x.download).not.toHaveBeenCalled();
  },
);
it("BR5.2: 不正/不足snapshotでfile0", async () => {
  const x = await setup();
  x.port.readComparison.mockResolvedValueOnce({ ...x.value, sources: [] });
  await x.run();
  expect(x.download).not.toHaveBeenCalled();
});
it("BR5.2: 確認中の入力でfile0", async () => {
  const x = await setup(),
    key = x.store.ensureField(x.value.sources[0], "reason");
  x.port.readComparison.mockImplementationOnce(async () => {
    x.store.edit(key, "途中入力");
    return x.value;
  });
  await x.run();
  expect(x.download).not.toHaveBeenCalled();
});
it("BR5.2: 確認中の選択変更でfile0", async () => {
  const x = await setup();
  x.port.readComparison.mockImplementationOnce(async () => {
    x.store.select([]);
    return x.value;
  });
  await x.run();
  expect(x.download).not.toHaveBeenCalled();
});
it("BR1.2: 確認中のowner変更でfile0", async () => {
  const x = await setup();
  x.port.readComparison.mockImplementationOnce(async () => {
    x.store.setOwner(OWNER_B);
    return x.value;
  });
  await x.run();
  expect(x.download).not.toHaveBeenCalled();
});
function editsFor(store: unknown) {
  const prepare = new ComparisonClient();
  const port = {
    prepareInterest: prepare.prepareInterest.bind(prepare),
    prepareReason: prepare.prepareReason.bind(prepare),
    send: vi.fn(),
    lookup: vi.fn(),
    readCompany: vi.fn(),
    readMemo: vi.fn(),
  };
  return {
    port,
    edits: new ComparisonEdits(
      store as ConstructorParameters<typeof ComparisonEdits>[0],
      port,
    ),
  };
}
it("BR4.2: 出力確認の404後は選択全体を利用不可にし新規保存要求0", async () => {
  const x = await setup(),
    { port, edits } = editsFor(x.store);
  x.port.readComparison.mockRejectedValueOnce(
    new ClientFailure("not_found", 404),
  );
  await x.run();
  expect(x.download).not.toHaveBeenCalled();
  for (const source of x.value.sources)
    for (const kind of ["interest", "reason"] as const) {
      const key = x.store.ensureField(source, kind);
      expect(x.store.isFieldAvailable(x.store.state.fields.get(key))).toBe(
        false,
      );
    }
  const reason = x.store.ensureField(x.value.sources[0], "reason"),
    interest = x.store.ensureField(x.value.sources[1], "interest");
  x.store.edit(reason, "404後の入力");
  x.store.edit(interest, "high");
  await edits.save(reason);
  await edits.save(interest);
  expect(port.send).not.toHaveBeenCalled();
  expect(x.store.state.fields.get(reason).draftValue).toBe("404後の入力");
});
it("BR5.2: 出力確認の503は欄を利用不可にしない", async () => {
  const x = await setup();
  x.port.readComparison.mockRejectedValueOnce(
    new ClientFailure("unavailable", 503),
  );
  await x.run();
  expect(x.download).not.toHaveBeenCalled();
  const key = x.store.ensureField(x.value.sources[0], "reason");
  expect(x.store.isFieldAvailable(x.store.state.fields.get(key))).toBe(true);
});
