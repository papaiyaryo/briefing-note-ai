import type { GeneratedCandidate } from "../workspace/contracts";
import type { CompanyMemoStructured } from "../structure/schema";
import { createMemoSchema } from "../workspace/schema";
const validationId = "00000000-0000-4000-8000-000000000000";
/** Editing may temporarily be invalid. Keep only editable text, never File/blob objects. */
export function copyEditableCandidate(
  value: GeneratedCandidate,
): GeneratedCandidate {
  const string = (value: unknown) => (typeof value === "string" ? value : "");
  const source = value.structuredContent;
  const structuredContent = {
    overview: {
      companyName: string(source.overview.companyName),
      eventName: string(source.overview.eventName),
      eventDate: string(source.overview.eventDate),
      speakers: string(source.overview.speakers),
    },
  } as CompanyMemoStructured;
  for (const key of [
    "facts",
    "emphasizedPoints",
    "business",
    "strengths",
    "idealCandidate",
    "impressions",
    "concerns",
    "questions",
    "esPoints",
    "nextResearch",
  ] as const)
    structuredContent[key] = source[key].filter(
      (item) => typeof item === "string",
    );
  return {
    origin: "generated",
    providerOrigin: value.providerOrigin,
    generationReceipt: string(value.generationReceipt),
    markdown: string(value.markdown),
    correctedOcr: string(value.correctedOcr),
    structuredContent,
    event: {
      companyName: string(value.event.companyName),
      eventName: string(value.event.eventName),
      eventDate: string(value.event.eventDate),
    },
    adoptedWebSources: value.adoptedWebSources
      .filter((item) => item.status === "adopted")
      .map((item) => ({
        id: string(item.id),
        category: string(item.category),
        content: string(item.content),
        sourceUrl: string(item.sourceUrl),
        fetchedAt: string(item.fetchedAt),
        confidence: item.confidence,
        status: "adopted",
      })),
    comparisonReason:
      value.comparisonReason === null ? null : string(value.comparisonReason),
  };
}
/** Allowlist the existing C2: temporary image data never crosses this boundary. */
export function mapGeneratedCandidate(input: unknown): GeneratedCandidate {
  if (!input || typeof input !== "object")
    throw new Error("候補を確認してください。");
  const value = input as Record<string, unknown>;
  if (!Array.isArray(value.adoptedWebSources))
    throw new Error("出典を確認してください。");
  const sources = value.adoptedWebSources
    .filter((item) => item?.status === "adopted")
    .map((item) => ({
      id: item.id,
      category: item.category,
      content: item.content,
      sourceUrl: item.sourceUrl,
      fetchedAt: item.fetchedAt,
      confidence: item.confidence,
      status: item.status,
    }));
  const result = createMemoSchema.parse({
    operationId: validationId,
    memoId: validationId,
    candidate: {
      origin: "generated",
      providerOrigin: value.providerOrigin,
      generationReceipt: value.generationReceipt,
      markdown: value.markdown,
      structuredContent: value.structuredContent,
      correctedOcr: value.correctedOcr,
      event: value.event,
      adoptedWebSources: sources,
      comparisonReason: value.comparisonReason ?? null,
    },
  }).candidate;
  if (result.origin !== "generated") throw new Error("生成候補が必要です。");
  return result;
}
