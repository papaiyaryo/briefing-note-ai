import type { GeneratedCandidate } from "../../src/lib/workspace/contracts";
export const owner = "11111111-1111-4111-8111-111111111111";
export const otherOwner = "22222222-2222-4222-8222-222222222222";
export const companyId = "33333333-3333-4333-8333-333333333333";
export const operationId = "44444444-4444-4444-8444-444444444444";
export const memoId = "55555555-5555-4555-8555-555555555555";
export function candidate(): GeneratedCandidate {
  return {
    origin: "generated",
    providerOrigin: "dummy",
    generationReceipt: "dummy-proof",
    markdown: "  # 架空の説明会\n\n要確認  ",
    correctedOcr: "訂正した架空OCR",
    event: {
      companyName: "架空生成名",
      eventName: "説明会",
      eventDate: "2026-10-16",
    },
    structuredContent: {
      overview: {
        companyName: "架空生成名",
        eventName: "説明会",
        eventDate: "2026-10-16",
        speakers: "要確認",
      },
      facts: ["説明会の事実"],
      emphasizedPoints: ["社員の強調"],
      business: [],
      strengths: [],
      idealCandidate: [],
      impressions: ["個人の印象"],
      concerns: [],
      questions: ["要確認"],
      esPoints: [],
      nextResearch: [],
    },
    adoptedWebSources: [
      {
        id: "web-1",
        category: "business",
        content: "Web補足",
        sourceUrl: "https://example.test/source",
        fetchedAt: "2026-10-16T00:00:00Z",
        confidence: "requires_check",
        status: "adopted",
      },
    ],
    comparisonReason: null,
  };
}
