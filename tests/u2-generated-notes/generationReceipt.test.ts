import { describe, expect, it } from "vitest";
import * as receipts from "../../src/lib/server/workspace/generationReceipt";
import { owner, otherOwner, operationId } from "./fixtures";
const keys = {
  active: "new",
  keys: { new: Buffer.alloc(32, 3), old: Buffer.alloc(32, 4) },
};
const issue = (...args: unknown[]) =>
  (
    receipts as unknown as {
      issueGenerationReceipt: (...args: unknown[]) => string;
    }
  ).issueGenerationReceipt(...args);
describe("server C2 provenance / BR3.4 SD2", () => {
  it("issues actual dummy provider bound to owner and UUID", () => {
    const token = issue(owner, "dummy", keys, operationId);
    expect(
      receipts.verifyGenerationReceipt(token, owner, "dummy", keys),
    ).toEqual({
      purpose: "memo-generation",
      version: 1,
      keyId: "new",
      userId: owner,
      generationId: operationId,
      providerOrigin: "dummy",
    });
  });
  it("uses active key and keeps old-key verification", () => {
    const token = issue(owner, "openai", { ...keys, active: "old" });
    expect(
      receipts.verifyGenerationReceipt(token, owner, "openai", keys).keyId,
    ).toBe("old");
  });
  it("does not allow another owner or rewritten provider", () => {
    const token = issue(owner, "dummy", keys);
    expect(() =>
      receipts.verifyGenerationReceipt(token, otherOwner, "dummy", keys),
    ).toThrow();
    expect(() =>
      receipts.verifyGenerationReceipt(token, owner, "openai", keys),
    ).toThrow();
  });
  it("rejects tampering and a mismatched key", () => {
    const token = issue(owner, "dummy", keys);
    expect(() =>
      receipts.verifyGenerationReceipt(token + "x", owner, "dummy", keys),
    ).toThrow();
    expect(() =>
      receipts.verifyGenerationReceipt(token, owner, "dummy", {
        active: "new",
        keys: { new: Buffer.alloc(32, 9) },
      }),
    ).toThrow();
  });
  it("does not issue for invalid principal/provider/generation", () => {
    expect(() => issue("invalid", "dummy", keys)).toThrow();
    expect(() => issue(owner, "fake", keys)).toThrow();
    expect(() => issue(owner, "dummy", keys, "invalid")).toThrow();
  });
  it("does not issue with invalid keyring or leak keys", () => {
    expect(() =>
      issue(owner, "dummy", { active: "missing", keys: {} }),
    ).toThrow();
    const token = issue(owner, "dummy", keys);
    expect(token).not.toContain(keys.keys.new.toString("base64"));
    expect(
      JSON.parse(Buffer.from(token.split(".")[0], "base64url").toString()),
    ).not.toHaveProperty("keys");
  });
});
