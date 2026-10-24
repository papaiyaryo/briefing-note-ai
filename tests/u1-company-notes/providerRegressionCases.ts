import { afterEach, describe, expect, it, vi } from "vitest";
import { runStructure } from "../../src/lib/server/structure";
import { runInterviewReview } from "../../src/lib/server/interviewReview";
import { buildDummyInterviewReview } from "../../src/lib/interviewReview/dummy";
import { emptyStructure } from "./fixtures";
describe("protected existing provider processing with fake transport", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });
  const info = { companyName: "架空", eventName: "説明会", eventDate: "" };
  it("dummy structure needs no external secret and keeps facts separate", async () => {
    vi.stubEnv("STRUCTURE_PROVIDER", "dummy");
    vi.stubEnv("OPENAI_API_KEY", "");
    const result = await runStructure("架空の本人OCR", info);
    expect(result.overview.companyName).toBe("架空");
    expect(result).toHaveProperty("impressions");
    expect(result).toHaveProperty("emphasizedPoints");
  });
  it.each(["output_text", "nested"])(
    "validates structure from %s response without real APIs",
    async (format) => {
      vi.stubEnv("STRUCTURE_PROVIDER", "openai");
      vi.stubEnv("OPENAI_API_KEY", "dummy-provider-key");
      const memo = emptyStructure();
      const transport = vi.fn(async (input: unknown, init?: RequestInit) => {
        expect(input).toBe("https://api.openai.com/v1/responses");
        expect(init?.method).toBe("POST");
        return Response.json(
          format === "output_text"
            ? { output_text: JSON.stringify(memo) }
            : { output: [{ content: [{ text: JSON.stringify(memo) }] }] },
        );
      });
      vi.stubGlobal("fetch", transport);
      expect(await runStructure("架空OCR", info)).toEqual(memo);
      expect(transport).toHaveBeenCalledOnce();
      const input = JSON.parse(String(transport.mock.calls[0]?.[1]?.body));
      expect(input.text.format.strict).toBe(true);
    },
  );
  it("rejects invalid structured model output", async () => {
    vi.stubEnv("STRUCTURE_PROVIDER", "openai");
    vi.stubEnv("OPENAI_API_KEY", "dummy-provider-key");
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => Response.json({ output_text: "{}" })),
    );
    await expect(runStructure("架空OCR", info)).rejects.toMatchObject({
      code: "validation_failed",
    });
  });
  it("review validates JSON and sends Web as a separate input", async () => {
    const memo = emptyStructure();
    const review = buildDummyInterviewReview(memo);
    const createResponse = vi.fn(async (body: unknown) => {
      expect(body).toHaveProperty("input");
      return { output_text: JSON.stringify(review) };
    });
    const result = await runInterviewReview(memo, [], "本人の印象", {
      env: {
        INTERVIEW_REVIEW_PROVIDER: "openai",
        OPENAI_INTERVIEW_REVIEW_MODEL: "dummy-model",
      },
      client: { createResponse },
    });
    expect(result).toEqual(review);
    const body = createResponse.mock.calls[0][0] as {
      input: { content: string }[];
    };
    expect(JSON.parse(body.input[1].content)).toMatchObject({
      memo,
      webSupplements: [],
      motivationMemo: "本人の印象",
    });
  });
  it.each(["not-json", "{}", ""])(
    "review rejects invalid result %s",
    async (output) => {
      await expect(
        runInterviewReview(emptyStructure(), [], "", {
          env: {
            INTERVIEW_REVIEW_PROVIDER: "openai",
            OPENAI_INTERVIEW_REVIEW_MODEL: "dummy-model",
          },
          client: { createResponse: async () => ({ output_text: output }) },
        }),
      ).rejects.toMatchObject({ code: "validation_failed" });
    },
  );
});
