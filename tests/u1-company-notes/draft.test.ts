import { describe, expect, it } from "vitest";
import { DraftVault, RequestGeneration } from "../../src/lib/workspace/draft";
describe("owner-bound memory drafts and request generations", () => {
  it("競合保持入力は同じ本人だけが元baselineとともに復帰できる", () => {
    const v = new DraftVault();
    v.switchOwner("revision3-A");
    v.put("company", { name: "元の入力" }, "original-version");
    expect(v.recover("company", "latest-version")).toEqual({ value: { name: "元の入力" }, baseVersion: "original-version", needsRebase: true });
    v.switchOwner(null);
    expect(v.recover("company", "latest-version")).toBeNull();
    v.switchOwner("revision3-B");
    expect(v.get("company")).toBeNull();
    v.switchOwner("revision3-A");
    expect(v.get("company")).toEqual({ value: { name: "元の入力" }, baseVersion: "original-version" });
  });
  it("saving only Markdown retains unsaved structure and reason at the new version", () => {
    const v = new DraftVault();
    v.switchOwner("A");
    v.put(
      "memo",
      {
        markdown: "edited",
        structuredContent: { facts: ["unsaved"] },
        comparisonReason: "unsaved reason",
      },
      "v1",
    );
    v.reconcile(
      "memo",
      {
        markdown: "edited",
        structuredContent: { facts: [] },
        comparisonReason: null,
      },
      "v2",
      { markdown: "edited" },
    );
    expect(v.get("memo")).toEqual({
      value: {
        markdown: "edited",
        structuredContent: { facts: ["unsaved"] },
        comparisonReason: "unsaved reason",
      },
      baseVersion: "v2",
    });
  });
  it("edits made during pending save survive its response", () => {
    const v = new DraftVault();
    v.switchOwner("A");
    v.put(
      "memo",
      { markdown: "typed after submit", comparisonReason: null },
      "v1",
    );
    v.reconcile(
      "memo",
      { markdown: "submitted", comparisonReason: null },
      "v2",
      { markdown: "submitted" },
    );
    expect(v.get("memo")?.value).toMatchObject({
      markdown: "typed after submit",
    });
  });
  it("new memo drafts move to the committed stable ID without losing other edits", () => {
    const v = new DraftVault();
    v.switchOwner("A");
    v.put("new", { markdown: "sent", comparisonReason: "later" }, "new");
    v.reconcile(
      "new",
      { markdown: "sent", comparisonReason: null },
      "v1",
      { markdown: "sent", comparisonReason: null },
      "memo-id",
    );
    expect(v.get("new")).toBeNull();
    expect(v.get("memo-id")?.value).toMatchObject({
      comparisonReason: "later",
    });
  });
  it("all fields confirmed equal clear dirty state; other owners do not affect navigation", () => {
    const v = new DraftVault();
    v.switchOwner("A");
    v.put("x", { markdown: "sent" }, "v1");
    expect(v.hasDirty()).toBe(true);
    v.reconcile("x", { markdown: "sent" }, "v2", { markdown: "sent" });
    expect(v.hasDirty()).toBe(false);
    v.switchOwner("B");
    v.put("x", { markdown: "B" }, "v1");
    v.switchOwner("A");
    expect(v.hasDirty()).toBe(false);
  });
  it("dirty edits are retained in memory until explicit discard", () => {
    const v = new DraftVault();
    v.switchOwner("A");
    v.put("memo1", { markdown: "本人の下書き" }, "v1");
    expect(v.get("memo1")?.value).toEqual({ markdown: "本人の下書き" });
    v.discard("memo1");
    expect(v.get("memo1")).toBeNull();
  });
  it("logout hides draft and another owner cannot recover it", () => {
    const v = new DraftVault();
    v.switchOwner("A");
    v.put("memo1", { markdown: "A" }, "v1");
    v.switchOwner(null);
    expect(v.get("memo1")).toBeNull();
    v.switchOwner("B");
    expect(v.get("memo1")).toBeNull();
    v.switchOwner("A");
    expect(v.get("memo1")?.value).toEqual({ markdown: "A" });
  });
  it("same-owner recovery requires explicit rebase against latest", () => {
    const v = new DraftVault();
    v.switchOwner("A");
    v.put("memo1", { markdown: "input" }, "v1");
    expect(v.recover("memo1", "v2")?.needsRebase).toBe(true);
    expect(v.get("memo1")?.baseVersion).toBe("v1");
  });
  it("unknown operation retains the exact serialized request", () => {
    const v = new DraftVault();
    v.switchOwner("A");
    const request = {
      path: "/api/v1/companies",
      method: "POST" as const,
      body: '{"operationId":"same"}',
    };
    v.markPending("new", request);
    request.body = "changed";
    expect(v.pending("new")?.body).toContain("same");
    v.resolve("new");
    expect(v.pending("new")).toBeNull();
  });
  it("cannot replace a pending write with changed request", () => {
    const v = new DraftVault();
    v.switchOwner("A");
    v.markPending("x", {
      path: "/api/v1/companies",
      method: "POST",
      body: "first",
    });
    expect(() =>
      v.markPending("x", {
        path: "/api/v1/companies",
        method: "POST",
        body: "changed",
      }),
    ).toThrow();
  });
  it("late response from a prior target is rejected", () => {
    const g = new RequestGeneration();
    const old = g.next();
    const current = g.next();
    expect(old.signal.aborted).toBe(true);
    expect(g.accepts(old)).toBe(false);
    expect(g.accepts(current)).toBe(true);
  });
  it("logout invalidates the current response", () => {
    const g = new RequestGeneration();
    const token = g.next();
    g.invalidate();
    expect(token.signal.aborted).toBe(true);
    expect(g.accepts(token)).toBe(false);
  });
  it("memory vault instances do not restore across reloads", () => {
    const a = new DraftVault();
    a.switchOwner("A");
    a.put("x", { markdown: "only memory" }, "v1");
    const b = new DraftVault();
    b.switchOwner("A");
    expect(b.get("x")).toBeNull();
  });
});
