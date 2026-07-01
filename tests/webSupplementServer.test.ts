import { describe, expect, it, vi } from "vitest";

import {
  extractWebSupplementResponseText,
  runWebSupplement,
  WebSupplementError,
} from "../src/lib/server/webSupplement";
import type { OpenAiResponsesClient } from "../src/lib/server/openaiClient";

const webSupplementJson = JSON.stringify({
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

describe("server web supplement", () => {
  it("concatenates multiple Responses API text blocks", () => {
    const midpoint = Math.floor(webSupplementJson.length / 2);

    expect(
      extractWebSupplementResponseText({
        output: [
          { content: [{ text: webSupplementJson.slice(0, midpoint) }] },
          { content: [{ text: webSupplementJson.slice(midpoint) }] },
        ],
      }),
    ).toBe(webSupplementJson);
  });

  it("maps invalid JSON output to validation_failed", async () => {
    const client: OpenAiResponsesClient = {
      createResponse: vi.fn().mockResolvedValue({ output_text: "not-json" }),
    };

    await expect(
      runWebSupplement("青葉フューチャーリンク株式会社", {
        env: {
          WEB_SUPPLEMENT_ENABLED: "true",
          WEB_SUPPLEMENT_PROVIDER: "openai",
          OPENAI_API_KEY: "test-key",
          OPENAI_WEB_SUPPLEMENT_MODEL: "test-model",
        },
        client,
      }),
    ).rejects.toMatchObject(new WebSupplementError("validation_failed"));
  });

  it("passes an abort signal to the OpenAI client", async () => {
    const createResponse = vi
      .fn()
      .mockResolvedValue({ output_text: webSupplementJson });
    const client: OpenAiResponsesClient = { createResponse };

    await expect(
      runWebSupplement("青葉フューチャーリンク株式会社", {
        env: {
          WEB_SUPPLEMENT_ENABLED: "true",
          WEB_SUPPLEMENT_PROVIDER: "openai",
          OPENAI_API_KEY: "test-key",
          OPENAI_WEB_SUPPLEMENT_MODEL: "test-model",
        },
        client,
      }),
    ).resolves.toMatchObject({ companyName: "青葉フューチャーリンク株式会社" });

    expect(createResponse).toHaveBeenCalledWith(
      expect.objectContaining({ model: "test-model" }),
      expect.any(AbortSignal),
    );
  });
});
