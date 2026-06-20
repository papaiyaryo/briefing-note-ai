import type { LlmProvider } from "./contracts";

// env を引数で受けることで単体テストを決定的にする（実 env に依存しない）。
function resolveProvider(
  explicit: string | undefined,
  hasApiKey: boolean,
): LlmProvider {
  if (explicit === "openai") return "openai";
  if (explicit === "dummy") return "dummy";
  return hasApiKey ? "openai" : "dummy";
}

export function getOcrProvider(env = process.env): LlmProvider {
  return resolveProvider(env.OCR_PROVIDER, Boolean(env.OPENAI_API_KEY));
}

export function getStructureProvider(env = process.env): LlmProvider {
  return resolveProvider(env.STRUCTURE_PROVIDER, Boolean(env.OPENAI_API_KEY));
}
