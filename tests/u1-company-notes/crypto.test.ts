import { describe, expect, it } from "vitest";
import { sealTokens, openTokens } from "../../src/lib/server/auth/crypto";
import { OWNER_A, OWNER_B } from "./fixtures";
const keys = {
  active: "new",
  keys: { old: Buffer.alloc(32, 1), new: Buffer.alloc(32, 2) },
};
const context = { sessionHash: "a".repeat(64), userId: OWNER_A };
const tokens = {
  accessToken: "dummy-access",
  refreshToken: "dummy-refresh",
  expiresAt: 1234,
};
describe("AES-GCM / NFR1.5", () => {
  it("tokenを暗号化して本人sessionで復号", () => {
    const sealed = sealTokens(tokens, context, keys);
    expect(JSON.stringify(sealed)).not.toContain(tokens.accessToken);
    expect(openTokens(sealed, context, keys)).toEqual(tokens);
  });
  it("nonceを毎回変える", () => {
    expect(sealTokens(tokens, context, keys).nonce).not.toBe(
      sealTokens(tokens, context, keys).nonce,
    );
  });
  it("別本人AADを拒否", () =>
    expect(() =>
      openTokens(
        sealTokens(tokens, context, keys),
        { ...context, userId: OWNER_B },
        keys,
      ),
    ).toThrow());
  it("別sessionAADを拒否", () =>
    expect(() =>
      openTokens(
        sealTokens(tokens, context, keys),
        { ...context, sessionHash: "b".repeat(64) },
        keys,
      ),
    ).toThrow());
  it("tag改変後の平文を返さない", () => {
    const sealed = sealTokens(tokens, context, keys);
    expect(() =>
      openTokens(
        { ...sealed, tag: Buffer.alloc(16).toString("base64url") },
        context,
        keys,
      ),
    ).toThrow();
  });
  it("旧鍵を保持して読取、新規は新鍵", () => {
    const old = sealTokens(tokens, context, { ...keys, active: "old" });
    expect(openTokens(old, context, keys)).toEqual(tokens);
    expect(sealTokens(tokens, context, keys).keyId).toBe("new");
  });
  it("未知鍵と不足長鍵を拒否", () => {
    const sealed = sealTokens(tokens, context, keys);
    expect(() =>
      openTokens({ ...sealed, keyId: "removed" }, context, keys),
    ).toThrow();
    expect(() =>
      sealTokens(tokens, context, {
        active: "bad",
        keys: { bad: Buffer.alloc(16) },
      }),
    ).toThrow();
  });
  it("不正envelopeと追加キーを拒否", () => {
    expect(() => openTokens({}, context, keys)).toThrow();
    expect(() =>
      openTokens(
        { ...sealTokens(tokens, context, keys), extra: "x" },
        context,
        keys,
      ),
    ).toThrow();
  });
});
