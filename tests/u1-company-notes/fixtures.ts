import { randomUUID } from "node:crypto";

export const OWNER_A = "11111111-1111-4111-8111-111111111111";
export const OWNER_B = "22222222-2222-4222-8222-222222222222";
export const id = () => randomUUID();
export const emptyStructure = () => ({
  overview: { companyName: "", eventName: "", eventDate: "", speakers: "" },
  facts: [],
  emphasizedPoints: [],
  business: [],
  strengths: [],
  idealCandidate: [],
  impressions: [],
  concerns: [],
  questions: [],
  esPoints: [],
  nextResearch: [],
});
export const manualCandidate = () => ({
  origin: "manual" as const,
  providerOrigin: null,
  markdown: "本人のメモ\n",
  structuredContent: null,
  correctedOcr: null,
  event: null,
  adoptedWebSources: [],
  comparisonReason: null,
});
