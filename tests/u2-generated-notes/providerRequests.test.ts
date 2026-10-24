import { afterEach, describe, expect, it, vi } from "vitest";
import { runOcr } from "../../src/lib/server/ocr";
import { runStructure } from "../../src/lib/server/structure";
import { runWebSupplement } from "../../src/lib/server/webSupplement";
import { runInterviewReview } from "../../src/lib/server/interviewReview";
import {
  getOpenAiTimeoutMs,
  createOpenAiClient,
} from "../../src/lib/server/openaiClient";
import { buildDummyWebSupplement } from "../../src/lib/webSupplement/dummy";
import { buildDummyInterviewReview } from "../../src/lib/interviewReview/dummy";
import * as requests from "../../src/lib/server/generation/request";
import type { OpenAiResponsesClient } from "../../src/lib/server/openaiClient";
import { candidate } from "./fixtures";
const env = {
  OPENAI_API_KEY: "dummy-key",
  OCR_PROVIDER: "openai",
  STRUCTURE_PROVIDER: "openai",
  WEB_SUPPLEMENT_PROVIDER: "openai",
  INTERVIEW_REVIEW_PROVIDER: "openai",
  WEB_SUPPLEMENT_ENABLED: "true",
  OPENAI_WEB_SUPPLEMENT_MODEL: "existing-web-model",
  OPENAI_INTERVIEW_REVIEW_MODEL: "existing-review-model",
};
const memo = candidate().structuredContent;
type Options = {
  env: typeof env;
  client: OpenAiResponsesClient;
  signal?: AbortSignal;
};
const runners: {
  name: string;
  output: unknown;
  run: (options: Options) => Promise<unknown>;
}[] = [
  {
    name: "ocr",
    output: { output_text: "架空OCR" },
    run: (o) =>
      runOcr({ bytes: new Uint8Array([1]), mimeType: "image/png" }, o),
  },
  {
    name: "structure",
    output: { output_text: JSON.stringify(memo) },
    run: (o) =>
      (
        runStructure as unknown as (
          text: string,
          event: typeof memo.overview,
          options: Options,
        ) => Promise<unknown>
      )("架空OCR", memo.overview, o),
  },
  {
    name: "web",
    output: { output_text: JSON.stringify(buildDummyWebSupplement("架空")) },
    run: (o) => runWebSupplement("架空", o),
  },
  {
    name: "review",
    output: { output_text: JSON.stringify(buildDummyInterviewReview(memo)) },
    run: (o) => runInterviewReview(memo, undefined, undefined, o),
  },
];
afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});
describe("finite provider request / NFR2.1 NFR4.4 PD1", () => {
  it.each(runners)(
    "$name explicitly sends store:false",
    async ({ run, output }) => {
      const createResponse = vi.fn().mockResolvedValue(output);
      await run({ env, client: { createResponse } });
      expect(createResponse).toHaveBeenCalledWith(
        expect.objectContaining({ store: false }),
        expect.any(AbortSignal),
      );
    },
  );
  it("caps environment timeout at 30 seconds", () => {
    expect(getOpenAiTimeoutMs({ ...env, OPENAI_TIMEOUT_MS: "999999" })).toBe(
      30000,
    );
    expect(getOpenAiTimeoutMs({ ...env, OPENAI_TIMEOUT_MS: "15" })).toBe(15);
  });
  it("clears timers on successful and failing requests", async () => {
    vi.useFakeTimers();
    const client = {
      createResponse: vi.fn().mockResolvedValue({ output_text: "架空" }),
    };
    await runOcr(
      { bytes: new Uint8Array([1]), mimeType: "image/png" },
      { env, client },
    );
    expect(vi.getTimerCount()).toBe(0);
    client.createResponse.mockRejectedValueOnce(new Error("dummy-failure"));
    await expect(
      runOcr(
        { bytes: new Uint8Array([1]), mimeType: "image/png" },
        { env, client },
      ),
    ).rejects.toThrow();
    expect(vi.getTimerCount()).toBe(0);
  });
  it.each(runners)(
    "$name rejects cancelled work before provider dispatch",
    async ({ run }) => {
      const controller = new AbortController();
      controller.abort();
      const createResponse = vi.fn();
      await expect(
        run({ env, client: { createResponse }, signal: controller.signal }),
      ).rejects.toThrow();
      expect(createResponse).not.toHaveBeenCalled();
    },
  );
  it("enforces provider cap even when transport ignores abort", async () => {
    vi.useFakeTimers();
    const client = {
      createResponse: vi.fn(() => new Promise<unknown>(() => {})),
    };
    const pending = runOcr(
      { bytes: new Uint8Array([1]), mimeType: "image/png" },
      { env: { ...env, OPENAI_TIMEOUT_MS: "999999" }, client },
    );
    const rejected = expect(pending).rejects.toThrow();
    await vi.advanceTimersByTimeAsync(30000);
    await rejected;
    expect(vi.getTimerCount()).toBe(0);
  });
  it("cancels request at server40sec and releases timer/listeners", async () => {
    vi.useFakeTimers();
    let signal: AbortSignal | undefined;
    const controller = new AbortController();
    const pending = requests.withGenerationDeadline(controller.signal, (s) => {
      signal = s;
      return new Promise(() => {});
    });
    const rejected = expect(pending).rejects.toThrow();
    await vi.advanceTimersByTimeAsync(40000);
    await rejected;
    expect(signal?.aborted).toBe(true);
    expect(vi.getTimerCount()).toBe(0);
  });
  it("forwards browser cancellation and rejects late server results", async () => {
    vi.useFakeTimers();
    const controller = new AbortController();
    let done!: (value: string) => void;
    const pending = requests.withGenerationDeadline(
      controller.signal,
      () =>
        new Promise<string>((r) => {
          done = r;
        }),
    );
    const rejected = expect(pending).rejects.toThrow();
    controller.abort();
    done("late");
    await rejected;
    expect(vi.getTimerCount()).toBe(0);
  });
  it("keeps external transport errors free of response text", async () => {
    const fetcher = vi
      .fn()
      .mockResolvedValue(new Response("PRIVATE_OCR_AND_KEY", { status: 500 }));
    vi.stubGlobal("fetch", fetcher);
    const client = createOpenAiClient(env);
    await expect(
      client.createResponse({ model: "existing", store: false }),
    ).rejects.toMatchObject({ status: 500 });
    try {
      await client.createResponse({});
    } catch (e) {
      expect(String(e)).not.toContain("PRIVATE_OCR_AND_KEY");
    }
  });
});
