import type { ApiErrorCode } from "../openai/contracts";
import { webSupplementResultSchema, type WebSupplementResult } from "./schema";

export type WebSupplementValidationResult =
  | { ok: true; result: WebSupplementResult }
  | { ok: false; code: ApiErrorCode };

export function normalizeWebSupplementResult(
  result: WebSupplementResult,
): WebSupplementResult {
  return {
    companyName: result.companyName,
    items: result.items.map((item: WebSupplementResult["items"][number]) => ({
      ...item,
      needsVerification:
        item.needsVerification ||
        item.confidence !== "high" ||
        item.sourceType !== "official",
    })),
  };
}

export function validateWebSupplementResult(
  value: unknown,
): WebSupplementValidationResult {
  const parsed = webSupplementResultSchema.safeParse(value);
  if (!parsed.success) return { ok: false, code: "validation_failed" };
  return { ok: true, result: normalizeWebSupplementResult(parsed.data) };
}
