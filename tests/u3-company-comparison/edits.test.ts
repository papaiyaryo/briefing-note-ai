import { expect, it, vi } from "vitest";
import { ComparisonClient } from "../../src/lib/companyComparison/client";
import { ClientFailure } from "../../src/lib/workspace/client";
import { snapshot, selection, OWNER_A, OWNER_B, id, instant } from "./fixtures";
const sessionTarget = "../../src/lib/companyComparison/session",
  editTarget = "../../src/lib/companyComparison/edits";
it("BR1.2: A→B→A旧loginの拒否応答でも同ID照会用unknownを保持", async () => {
  const x = await setup();
  let reject!: (error: Error) => void;
  x.port.send.mockImplementationOnce(
    () =>
      new Promise((_, fail) => {
        reject = fail;
      }),
  );
  x.store.edit(x.reason, "旧login送信");
  const pending = x.edit.save(x.reason);
  const request = x.store.state.fields.get(x.reason).intent.request;
  x.store.setOwner(OWNER_B);
  x.store.setOwner(OWNER_A);
  reject(new ClientFailure("unauthenticated", 401));
  await pending;
  expect(x.store.state.fields.get(x.reason)).toMatchObject({
    status: "unknown",
    intent: { request },
  });
  expect(x.store.state.fields.get(x.reason).outcome).toBeUndefined();
  expect(x.port.readMemo).not.toHaveBeenCalled();
});
it("NFR3.2: committedのclean欄は他client最新へ同期し過去outcomeと書込回数を保持", async () => {
  const x = await setup();
  x.store.edit(x.interest, "high");
  await x.edit.save(x.interest);
  const outcome = x.store.state.fields.get(x.interest).outcome,
    latest = structuredClone(x.value);
  latest.sources[0].company.interestLevel = "medium";
  latest.sources[0].company.version = "opaque:other-client";
  x.store.install(latest, x.store.token());
  expect(x.store.state.fields.get(x.interest)).toMatchObject({
    draftValue: "medium",
    baseValue: "medium",
    baseVersion: "opaque:other-client",
    outcome,
  });
  await x.edit.save(x.interest);
  expect(x.port.send).toHaveBeenCalledOnce();
});
it("NFR3.1: committed後のdirty追加入力は最新snapshotで破棄・rebaseしない", async () => {
  const x = await setup();
  x.store.edit(x.interest, "high");
  await x.edit.save(x.interest);
  x.store.edit(x.interest, "low");
  const latest = structuredClone(x.value);
  latest.sources[0].company.interestLevel = "medium";
  latest.sources[0].company.version = "opaque:other-client";
  x.store.install(latest, x.store.token());
  expect(x.store.state.fields.get(x.interest)).toMatchObject({
    draftValue: "low",
    baseValue: "high",
    baseVersion: "opaque:saved",
    latest: { value: "medium", version: "opaque:other-client" },
  });
  expect(x.port.send).toHaveBeenCalledOnce();
});
it("BR1.2: A→B→A旧loginのCOMMIT応答はunknownへ保管し同ID照会で継続", async () => {
  const x = await setup();
  let finish!: () => void;
  const original = x.port.send.getMockImplementation()!;
  x.port.send.mockImplementationOnce(async (request) => {
    await new Promise<void>((resolve) => {
      finish = resolve;
    });
    return original(request);
  });
  x.store.edit(x.reason, "変更");
  const pending = x.edit.save(x.reason);
  x.store.setOwner(OWNER_B);
  x.store.setOwner(OWNER_A);
  finish();
  await pending;
  expect(x.store.state.fields.get(x.reason)).toMatchObject({
    status: "unknown",
  });
  expect(x.store.state.fields.get(x.reason).outcome).toBeUndefined();
  expect(x.port.readMemo).not.toHaveBeenCalled();
});
it("BR4.4: 送信中の破棄は送信値を保持しCOMMIT後に旧値のdirtyを作らない", async () => {
  const x = await setup();
  let finish!: () => void;
  const original = x.port.send.getMockImplementation()!;
  x.port.send.mockImplementationOnce(async (request) => {
    await new Promise<void>((resolve) => {
      finish = resolve;
    });
    return original(request);
  });
  x.store.edit(x.reason, "変更");
  const pending = x.edit.save(x.reason);
  x.store.edit(x.reason, "未送信追加");
  x.store.discard();
  finish();
  await pending;
  expect(x.store.state.fields.get(x.reason)).toMatchObject({
    draftValue: "変更",
    baseValue: "変更",
    status: "committed",
  });
  expect(x.store.hasDirty()).toBe(false);
});
it("BR1.2: latest取得中A→B→Aでも旧loginのlatestを採用しない", async () => {
  const x = await setup();
  let finish!: (value: Awaited<ReturnType<typeof x.port.readMemo>>) => void;
  x.port.readMemo.mockImplementationOnce(
    () =>
      new Promise((resolve) => {
        finish = resolve;
      }),
  );
  x.store.state.fields.get(x.reason).status = "conflict";
  const pending = x.edit.refreshLatest(x.reason);
  x.store.setOwner(OWNER_B);
  x.store.setOwner(OWNER_A);
  finish({
    ...x.source.memo,
    version: "late",
    comparisonReason: "旧login結果",
  });
  await pending;
  expect(x.store.state.fields.get(x.reason).latest).toBeUndefined();
});
async function setup() {
  const sm = await import(sessionTarget).catch(() => null),
    em = await import(editTarget).catch(() => null);
  expect(sm && em, "U3欄別保存が実装されている").toBeTruthy();
  const store = new sm!.ComparisonSession();
  store.setOwner(OWNER_A);
  const value = snapshot(1),
    source = value.sources[0];
  store.select(selection(value));
  store.install(value, store.token());
  const prepare = new ComparisonClient();
  const port = {
    prepareInterest: prepare.prepareInterest.bind(prepare),
    prepareReason: prepare.prepareReason.bind(prepare),
    send: vi.fn(async (request: { body: string; path: string }) => {
      const body = JSON.parse(request.body),
        isMemo = request.path.includes("/memos/");
      return {
        operationId: body.operationId,
        action: isMemo ? "memo_update" : "company_update",
        companyId: source.company.companyId,
        memoId: isMemo ? source.memo.memoId : null,
        resultingVersion: "opaque:saved",
        committedAt: instant,
      };
    }),
    lookup: vi.fn(async () => ({ state: "unknown" })),
    readCompany: vi.fn(async () => ({
      ...source.company,
      version: "opaque:saved",
      interestLevel: "high",
    })),
    readMemo: vi.fn(async (): Promise<typeof source.memo> => ({
      ...source.memo,
      version: "opaque:saved",
      comparisonReason: "変更",
    })),
  };
  const edit = new em!.ComparisonEdits(store, port),
    interest = store.ensureField(source, "interest"),
    reason = store.ensureField(source, "reason");
  return { store, value, source, port, edit, interest, reason };
}
it("BR4.1: 企業志望度だけを別版で保存", async () => {
  const x = await setup();
  x.store.edit(x.interest, "high");
  await x.edit.save(x.interest);
  expect(JSON.parse(x.port.send.mock.calls[0][0].body)).toMatchObject({
    expectedVersion: x.source.company.version,
    changes: { interestLevel: "high" },
  });
  expect(x.store.state.fields.get(x.interest).status).toBe("committed");
});
it("BR4.1: 理由だけをmemo版で保存", async () => {
  const x = await setup();
  x.store.edit(x.reason, "変更");
  await x.edit.save(x.reason);
  expect(JSON.parse(x.port.send.mock.calls[0][0].body)).toMatchObject({
    expectedVersion: x.source.memo.version,
    changes: { comparisonReason: "変更" },
  });
});
it("NFR2.3: 別欄の未保存draft/baseを保つ", async () => {
  const x = await setup();
  x.store.edit(x.reason, "未送信");
  x.store.edit(x.interest, "high");
  await x.edit.save(x.interest);
  expect(x.store.state.fields.get(x.reason)).toMatchObject({
    draftValue: "未送信",
    baseVersion: x.source.memo.version,
  });
});
it("BR4.2: 同欄連打は1要求", async () => {
  const x = await setup();
  x.store.edit(x.reason, "変更");
  await Promise.all([x.edit.save(x.reason), x.edit.save(x.reason)]);
  expect(x.port.send).toHaveBeenCalledOnce();
});
it("NFR2.5: committed後の再表示/同内容保存は新POSTなし", async () => {
  const x = await setup();
  x.store.edit(x.reason, "変更");
  await x.edit.save(x.reason);
  x.store.ensureField(x.source, "reason");
  await x.edit.save(x.reason);
  expect(x.port.send).toHaveBeenCalledOnce();
  expect(x.store.state.fields.get(x.reason).outcome.operationId).toBeDefined();
});
it("NFR2.5: 送信後の追加入力を成功で消さない", async () => {
  const x = await setup();
  let finish!: () => void;
  const original = x.port.send.getMockImplementation()!;
  x.port.send.mockImplementationOnce(async (r) => {
    await new Promise<void>((resolve) => {
      finish = resolve;
    });
    return original(r);
  });
  x.store.edit(x.reason, "変更");
  const pending = x.edit.save(x.reason);
  x.store.edit(x.reason, "追加入力");
  finish();
  await pending;
  expect(x.store.state.fields.get(x.reason)).toMatchObject({
    draftValue: "追加入力",
    baseValue: "変更",
    status: "committed",
  });
  expect(x.store.hasUnsaved()).toBe(true);
});
it("NFR2.5: commit後GET失敗は保存成功と別表示・再POSTなし", async () => {
  const x = await setup();
  x.port.readMemo.mockRejectedValueOnce(new ClientFailure("unavailable"));
  x.store.edit(x.reason, "変更");
  await x.edit.save(x.reason);
  expect(x.store.state.fields.get(x.reason)).toMatchObject({
    status: "committed",
    readbackState: "error",
  });
  await x.edit.save(x.reason);
  expect(x.port.send).toHaveBeenCalledOnce();
});
it("BR4.2: unknownは凍結ID/body保持・自動再送なし", async () => {
  const x = await setup();
  x.port.send.mockRejectedValueOnce(new ClientFailure("unavailable", 0, true));
  x.store.edit(x.reason, "変更");
  await x.edit.save(x.reason);
  expect(x.store.state.fields.get(x.reason).status).toBe("unknown");
  await x.edit.save(x.reason);
  expect(x.port.send).toHaveBeenCalledOnce();
});
it("BR4.2: lookup unknown後の明示retryは同じbody/ID", async () => {
  const x = await setup();
  x.port.send.mockRejectedValueOnce(new ClientFailure("unavailable", 0, true));
  x.store.edit(x.reason, "変更");
  await x.edit.save(x.reason);
  x.store.edit(x.reason, "次のdraft");
  await x.edit.lookup(x.reason);
  await x.edit.retry(x.reason);
  expect(x.port.send.mock.calls[1][0]).toEqual(x.port.send.mock.calls[0][0]);
  expect(x.store.state.fields.get(x.reason).draftValue).toBe("次のdraft");
});
it("BR4.2: lookup committedは新書込なしで確定", async () => {
  const x = await setup();
  x.port.send.mockRejectedValueOnce(new ClientFailure("unavailable", 0, true));
  x.store.edit(x.reason, "変更");
  await x.edit.save(x.reason);
  const request = x.port.send.mock.calls[0][0],
    outcome = {
      operationId: JSON.parse(request.body).operationId,
      action: "memo_update",
      companyId: x.source.company.companyId,
      memoId: x.source.memo.memoId,
      resultingVersion: "opaque:saved",
      committedAt: instant,
    };
  x.port.lookup.mockResolvedValueOnce({ state: "committed", outcome } as never);
  await x.edit.lookup(x.reason);
  expect(x.store.state.fields.get(x.reason).status).toBe("committed");
  expect(x.port.send).toHaveBeenCalledOnce();
});
it.each(["action", "companyId", "memoId", "resultingVersion"])(
  "NFR1.4: lookup committedの不正%sは成功にしない",
  async (field) => {
    const x = await setup();
    x.port.send.mockRejectedValueOnce(
      new ClientFailure("unavailable", 0, true),
    );
    x.store.edit(x.reason, "変更");
    await x.edit.save(x.reason);
    const request = x.port.send.mock.calls[0][0],
      outcome = {
        operationId: JSON.parse(request.body).operationId,
        action: "memo_update",
        companyId: x.source.company.companyId,
        memoId: x.source.memo.memoId,
        resultingVersion: "opaque:saved",
        committedAt: instant,
        [field]:
          field === "resultingVersion"
            ? null
            : field === "action"
              ? "company_update"
              : id(),
      };
    x.port.lookup.mockResolvedValueOnce({
      state: "committed",
      outcome,
    } as never);
    await x.edit.lookup(x.reason);
    expect(x.store.state.fields.get(x.reason).status).toBe("unknown");
  },
);
it("BR4.3: 競合のlatest取得はbase/draftを保持し明示rebaseでだけ更新", async () => {
  const x = await setup();
  x.port.send.mockRejectedValueOnce(new ClientFailure("version_conflict", 409));
  x.store.edit(x.reason, "保持");
  await x.edit.save(x.reason);
  await x.edit.refreshLatest(x.reason);
  expect(x.store.state.fields.get(x.reason)).toMatchObject({
    status: "conflict",
    draftValue: "保持",
    baseVersion: x.source.memo.version,
    latest: { version: "opaque:saved", value: "変更" },
  });
  x.edit.rebase(x.reason);
  expect(x.store.state.fields.get(x.reason)).toMatchObject({
    draftValue: "保持",
    baseVersion: "opaque:saved",
  });
  await x.edit.save(x.reason);
  expect(JSON.parse(x.port.send.mock.calls[1][0].body).operationId).not.toBe(
    JSON.parse(x.port.send.mock.calls[0][0].body).operationId,
  );
});
it("BR4.3: latest取得失敗もdraftを残す", async () => {
  const x = await setup();
  x.port.send.mockRejectedValueOnce(new ClientFailure("version_conflict", 409));
  x.port.readMemo.mockRejectedValueOnce(new ClientFailure("not_found", 404));
  x.store.edit(x.reason, "保持");
  await x.edit.save(x.reason);
  await x.edit.refreshLatest(x.reason);
  expect(x.store.state.fields.get(x.reason).draftValue).toBe("保持");
  expect(() => x.edit.rebase(x.reason)).toThrow();
});
it("BR1.2: 旧ownerのlate結果を新ownerへ通知しない", async () => {
  const x = await setup();
  x.store.edit(x.reason, "変更");
  const pending = x.edit.save(x.reason);
  x.store.setOwner(OWNER_B);
  await pending;
  expect(x.store.state.fields.size).toBe(0);
  expect(x.store.state.snapshot).toBeNull();
});
it("NFR7.2: 上限超過は送信せず入力保持", async () => {
  const x = await setup();
  x.store.edit(x.reason, "😀".repeat(5001));
  await x.edit.save(x.reason);
  expect(x.port.send).not.toHaveBeenCalled();
  expect(x.store.state.fields.get(x.reason).draftValue).toBe("😀".repeat(5001));
});

it("C-R1 AC6.4.3: メモ404後の直接saveも新operation/PATCH0でbase/draft保持", async () => {
  const x = await setup();
  x.store.edit(x.reason, "保持");
  const field = x.store.state.fields.get(x.reason), before = structuredClone(field);
  x.port.readMemo.mockRejectedValueOnce(new ClientFailure("not_found", 404));
  await x.edit.refreshLatest(x.reason);
  await x.edit.save(x.reason);
  expect(x.port.send).not.toHaveBeenCalled();
  expect(field.intent).toBeUndefined();
  expect(field).toMatchObject({ baseValue: before.baseValue, baseVersion: before.baseVersion, draftValue: "保持", status: before.status });
  expect(x.store.isFieldAvailable(field)).toBe(false);
});
it("C-R2 AC6.5.4: 企業404は所属理由も停止し無関係企業へ波及なし", async () => {
  const x = await setup(), other = snapshot(1);
  const otherKey = x.store.ensureField(other.sources[0], "interest");
  x.store.edit(x.interest, "high"); x.store.edit(x.reason, "保持");
  x.port.readCompany.mockRejectedValueOnce(new ClientFailure("not_found", 404));
  await x.edit.refreshLatest(x.interest);
  await x.edit.save(x.interest); await x.edit.save(x.reason);
  expect(x.port.send).not.toHaveBeenCalled();
  expect(x.store.isFieldAvailable(x.store.state.fields.get(otherKey))).toBe(true);
  expect(x.store.state.fields.get(x.reason).draftValue).toBe("保持");
});
it("C-R3 AC6.3.1: 409→latest503はconflictと凍結要求を保持し確定なし", async () => {
  const x = await setup();
  x.store.edit(x.reason, "保持");
  x.port.send.mockRejectedValueOnce(new ClientFailure("version_conflict", 409));
  await x.edit.save(x.reason);
  const field = x.store.state.fields.get(x.reason), request = structuredClone(field.intent.request);
  x.port.readMemo.mockRejectedValueOnce(new ClientFailure("unavailable", 503));
  await x.edit.refreshLatest(x.reason); await x.edit.save(x.reason);
  expect(field).toMatchObject({ status: "conflict", baseVersion: x.source.memo.version, baseValue: null, draftValue: "保持", readbackState: "error", intent: { request } });
  expect(field.outcome).toBeUndefined();
  expect(x.port.send).toHaveBeenCalledOnce();
  expect(x.store.isFieldAvailable(field)).toBe(true);
});
it("C-R4 BR4.2: commit→GET404でも確定を保持し新規保存だけ停止", async () => {
  const x = await setup();
  x.port.readMemo.mockRejectedValueOnce(new ClientFailure("not_found", 404));
  x.store.edit(x.reason, "変更"); await x.edit.save(x.reason);
  const field = x.store.state.fields.get(x.reason), outcome = structuredClone(field.outcome);
  x.store.edit(x.reason, "追加入力"); await x.edit.save(x.reason);
  expect(field).toMatchObject({ status: "committed", outcome, baseVersion: "opaque:saved", readbackState: "error", draftValue: "追加入力" });
  expect(x.store.isFieldAvailable(field)).toBe(false);
  expect(x.port.send).toHaveBeenCalledOnce();
});
it("C-R5 BR4.2: unknown＋404も同IDlookup/明示retryを維持し新意図なし", async () => {
  const x = await setup();
  x.port.send.mockRejectedValueOnce(new ClientFailure("unavailable", 0, true));
  x.store.edit(x.reason, "変更"); await x.edit.save(x.reason);
  const field = x.store.state.fields.get(x.reason), request = structuredClone(field.intent.request);
  x.port.readMemo.mockRejectedValueOnce(new ClientFailure("not_found", 404));
  await x.edit.refreshLatest(x.reason);
  x.store.select([], () => true);
  await x.edit.save(x.reason);
  expect(x.port.send).toHaveBeenCalledOnce();
  await x.edit.lookup(x.reason); await x.edit.retry(x.reason);
  expect(x.port.send).toHaveBeenCalledTimes(2);
  expect(x.port.send.mock.calls[1][0]).toEqual(request);
  expect(x.port.lookup).toHaveBeenCalledWith(JSON.parse(request.body).operationId);
  expect(field.status).toBe("committed");
  const y = await setup();
  y.port.send.mockRejectedValueOnce(new ClientFailure("unavailable", 0, true));
  y.store.edit(y.reason, "変更"); await y.edit.save(y.reason);
  const pending = y.store.state.fields.get(y.reason);
  y.port.readMemo.mockRejectedValue(new ClientFailure("not_found", 404));
  await y.edit.refreshLatest(y.reason);
  const outcome = { operationId: JSON.parse(pending.intent.request.body).operationId, action: "memo_update", companyId: y.source.company.companyId, memoId: y.source.memo.memoId, resultingVersion: "confirmed", committedAt: instant };
  y.port.lookup.mockResolvedValueOnce({ state: "committed", outcome } as never);
  await y.edit.lookup(y.reason);
  expect(pending).toMatchObject({ status: "committed", outcome, readbackState: "error" });
  expect(y.port.send).toHaveBeenCalledOnce();
});
it("C-R6 BR5.1: 対象検証した個別GETだけ解除し他欄/全体出力を有効化しない", async () => {
  const x = await setup();
  x.store.invalidateReferences(x.store.beginRequest());
  x.store.edit(x.interest, "high");
  await x.edit.refreshLatest(x.interest); await x.edit.save(x.interest);
  expect(x.port.send).toHaveBeenCalledOnce();
  expect(x.store.isFieldAvailable(x.store.state.fields.get(x.reason))).toBe(false);
  expect(x.store.state.status).not.toBe("ready");
  x.port.readMemo.mockResolvedValueOnce({ ...x.source.memo, companyId: id() });
  await x.edit.refreshLatest(x.reason);
  expect(x.store.isFieldAvailable(x.store.state.fields.get(x.reason))).toBe(false);
});
it("C-R7 BR1.2: 旧世代latest成功/404を無視し一時通信失敗を消失にしない", async () => {
  const x = await setup();
  let finish!: (value: Awaited<ReturnType<typeof x.port.readMemo>>) => void;
  x.port.readMemo.mockImplementationOnce(() => new Promise(resolve => { finish = resolve; }));
  const oldSuccess = x.edit.refreshLatest(x.reason);
  x.store.invalidateReferences(x.store.beginRequest());
  finish(x.source.memo); await oldSuccess;
  expect(x.store.isFieldAvailable(x.store.state.fields.get(x.reason))).toBe(false);
  let fail!: (value: unknown) => void;
  x.port.readMemo.mockImplementationOnce(() => new Promise((_, reject) => { fail = reject; }));
  const oldFailure = x.edit.refreshLatest(x.reason);
  x.store.beginRequest(); x.store.install(x.value, x.store.token());
  fail(new ClientFailure("not_found", 404)); await oldFailure;
  expect(x.store.isFieldAvailable(x.store.state.fields.get(x.reason))).toBe(true);
  x.port.readMemo.mockRejectedValueOnce(new ClientFailure("unavailable", 503));
  await x.edit.refreshLatest(x.reason);
  expect(x.store.isFieldAvailable(x.store.state.fields.get(x.reason))).toBe(true);
});
