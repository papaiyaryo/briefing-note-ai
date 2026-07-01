import type { LlmProvider } from "./contracts";

type ProviderEnv = {
  OPENAI_API_KEY?: string;
  OCR_PROVIDER?: string;
  STRUCTURE_PROVIDER?: string;
  WEB_SUPPLEMENT_PROVIDER?: string;
};

function resolveProvider(
  explicit: string | undefined,
  hasApiKey: boolean,
): LlmProvider {
  if (explicit === "openai") return "openai";
  if (explicit === "dummy") return "dummy";

  return hasApiKey ? "openai" : "dummy";
}

export function getOcrProvider(
  env: ProviderEnv = process.env as ProviderEnv,
): LlmProvider {
  return resolveProvider(env.OCR_PROVIDER, Boolean(env.OPENAI_API_KEY));
}

export function getStructureProvider(
  env: ProviderEnv = process.env as ProviderEnv,
): LlmProvider {
  return resolveProvider(env.STRUCTURE_PROVIDER, Boolean(env.OPENAI_API_KEY));
}

export function getWebSupplementProvider(
  env: ProviderEnv = process.env as ProviderEnv,
): LlmProvider {
  return resolveProvider(
    env.WEB_SUPPLEMENT_PROVIDER,
    Boolean(env.OPENAI_API_KEY),
  );
}
