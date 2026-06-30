import type { ApiErrorCode, LlmProvider } from "../openai/contracts";

export type ApiStage = "ocr" | "structure";

export interface ApiEventMeta {
  stage: ApiStage;
  code: ApiErrorCode | "ok";
  durationMs: number;
  provider: LlmProvider;
}

export function logApiEvent(meta: ApiEventMeta): void {
  console.info(
    JSON.stringify({
      event: "api.request",
      stage: meta.stage,
      code: meta.code,
      durationMs: Math.max(0, Math.round(meta.durationMs)),
      provider: meta.provider,
    }),
  );
}
