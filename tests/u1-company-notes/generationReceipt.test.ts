import { describe, expect, it } from "vitest";
import { verifyGenerationReceipt } from "../../src/lib/server/workspace/generationReceipt";
import { fixtureReceipt, receiptKeys } from "./runtimeFixture";
import { OWNER_A, OWNER_B } from "./fixtures";
describe("生成出自 / BR5.1", () => {
  it("署名付きdummy出自を本人へ結び付ける", () =>
    expect(
      verifyGenerationReceipt(fixtureReceipt(), OWNER_A, "dummy", receiptKeys)
        .providerOrigin,
    ).toBe("dummy"));
  it("別本人を拒否", () =>
    expect(() =>
      verifyGenerationReceipt(fixtureReceipt(), OWNER_B, "dummy", receiptKeys),
    ).toThrow());
  it("dummyをopenaiへ変更できない", () =>
    expect(() =>
      verifyGenerationReceipt(fixtureReceipt(), OWNER_A, "openai", receiptKeys),
    ).toThrow());
  it("署名の改変を拒否", () => {
    const r = fixtureReceipt();
    expect(() =>
      verifyGenerationReceipt(
        r.slice(0, -2) + "xx",
        OWNER_A,
        "dummy",
        receiptKeys,
      ),
    ).toThrow();
  });
  it("未知鍵を拒否", () =>
    expect(() =>
      verifyGenerationReceipt(fixtureReceipt(), OWNER_A, "dummy", {
        active: "other",
        keys: { other: Buffer.alloc(32, 3) },
      }),
    ).toThrow());
  it("署名が短い要求を拒否", () =>
    expect(() =>
      verifyGenerationReceipt("e30.x", OWNER_A, "dummy", receiptKeys),
    ).toThrow());
  it("openaiも署名と本人の一致が必要", () =>
    expect(
      verifyGenerationReceipt(
        fixtureReceipt(OWNER_A, "openai"),
        OWNER_A,
        "openai",
        receiptKeys,
      ).providerOrigin,
    ).toBe("openai"));
  it("不正形式を成功出自にしない", () =>
    expect(() =>
      verifyGenerationReceipt("malformed", OWNER_A, "dummy", receiptKeys),
    ).toThrow());
});
