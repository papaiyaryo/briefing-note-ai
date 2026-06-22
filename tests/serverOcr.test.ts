import { describe, expect, it } from "vitest";

import { runOcr } from "../src/lib/server/ocr";
import { DEMO_OCR_TEXT } from "../src/lib/sampleData";

describe("runOcr", () => {
  it("returns demo OCR text when the provider is dummy", async () => {
    const result = await runOcr(
      { bytes: new Uint8Array([1, 2, 3]), mimeType: "image/png" },
      { env: { OCR_PROVIDER: "dummy" } },
    );

    expect(result.text).toBe(DEMO_OCR_TEXT);
  });

  it("passes image input to the OpenAI responses client when provider is openai", async () => {
    const requestBodies: unknown[] = [];
    const result = await runOcr(
      { bytes: new Uint8Array([1, 2, 3]), mimeType: "image/png" },
      {
        env: { OCR_PROVIDER: "openai", OPENAI_API_KEY: "test-key" },
        client: {
          async createResponse(body) {
            requestBodies.push(body);
            return { output_text: "読み取り結果" };
          },
        },
      },
    );

    expect(result.text).toBe("読み取り結果");
    expect(JSON.stringify(requestBodies[0])).toContain(
      "data:image/png;base64,AQID",
    );
  });

  it("extracts text from the raw Responses API output array", async () => {
    const result = await runOcr(
      { bytes: new Uint8Array([1, 2, 3]), mimeType: "image/png" },
      {
        env: { OCR_PROVIDER: "openai", OPENAI_API_KEY: "test-key" },
        client: {
          async createResponse() {
            return {
              output: [
                {
                  type: "message",
                  content: [{ type: "output_text", text: "配列形の結果" }],
                },
              ],
            };
          },
        },
      },
    );

    expect(result.text).toBe("配列形の結果");
  });
});
