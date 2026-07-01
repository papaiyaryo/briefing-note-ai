import { describe, expect, it } from "vitest";

import { buildDummyWebSupplement } from "../src/lib/webSupplement/dummy";
import { validateWebSupplementResult } from "../src/lib/webSupplement/validate";

describe("web supplement validation", () => {
  it("requires every item to include source and retrieval metadata", () => {
    const result = validateWebSupplementResult({
      companyName: "青葉フューチャーリンク株式会社",
      items: [
        {
          title: "採用情報",
          summary: "公式採用ページを確認する候補です。",
          sourceUrl: "https://example.com/recruit",
          retrievedAt: "2026-07-01",
          confidence: "high",
          needsVerification: false,
          sourceType: "official",
        },
      ],
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.result.items[0].sourceUrl).toBe(
        "https://example.com/recruit",
      );
      expect(result.result.items[0].retrievedAt).toBe("2026-07-01");
    }
  });

  it("rejects invalid retrieval dates", () => {
    const result = validateWebSupplementResult({
      companyName: "青葉フューチャーリンク株式会社",
      items: [
        {
          title: "採用情報",
          summary: "公式採用ページを確認する候補です。",
          sourceUrl: "https://example.com/recruit",
          retrievedAt: "yesterday",
          confidence: "high",
          needsVerification: false,
          sourceType: "official",
        },
      ],
    });

    expect(result).toEqual({ ok: false, code: "validation_failed" });
  });

  it("marks medium confidence and non-official sources as needing verification", () => {
    const result = validateWebSupplementResult({
      companyName: "青葉フューチャーリンク株式会社",
      items: [
        {
          title: "ニュース候補",
          summary: "非公式ソースの候補です。",
          sourceUrl: "https://example.com/news",
          retrievedAt: "2026-07-01",
          confidence: "medium",
          needsVerification: false,
          sourceType: "non_official",
        },
      ],
    });

    expect(result.ok).toBe(true);
    if (result.ok) expect(result.result.items[0].needsVerification).toBe(true);
  });

  it("builds dummy candidates without network access", () => {
    const result = buildDummyWebSupplement("青葉フューチャーリンク株式会社");

    expect(result.companyName).toBe("青葉フューチャーリンク株式会社");
    expect(result.items[0].sourceUrl).toMatch(/^https:\/\//);
    expect(result.items[0].needsVerification).toBe(true);
  });
});
