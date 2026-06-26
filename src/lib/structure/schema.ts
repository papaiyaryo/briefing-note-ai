export interface CompanyMemoStructured {
  overview: {
    companyName: string;
    eventName: string;
    eventDate: string;
    speakers: string;
  };
  facts: string[];
  emphasizedPoints: string[];
  business: string[];
  strengths: string[];
  idealCandidate: string[];
  impressions: string[];
  concerns: string[];
  questions: string[];
  esPoints: string[];
  nextResearch: string[];
}

const stringArraySchema = { type: "array", items: { type: "string" } } as const;

export const companyMemoJsonSchema = {
  type: "object",
  additionalProperties: false,
  required: [
    "overview",
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
  ],
  properties: {
    overview: {
      type: "object",
      additionalProperties: false,
      required: ["companyName", "eventName", "eventDate", "speakers"],
      properties: {
        companyName: { type: "string" },
        eventName: { type: "string" },
        eventDate: { type: "string" },
        speakers: { type: "string" },
      },
    },
    facts: stringArraySchema,
    emphasizedPoints: stringArraySchema,
    business: stringArraySchema,
    strengths: stringArraySchema,
    idealCandidate: stringArraySchema,
    impressions: stringArraySchema,
    concerns: stringArraySchema,
    questions: stringArraySchema,
    esPoints: stringArraySchema,
    nextResearch: stringArraySchema,
  },
} as const;

// Structured Outputs に渡す JSON Schema と同じ構造を検証する軽量オブジェクト。
// zod 依存は package.json に追加予定だが、CI/ローカルの依存取得制約下でも純粋検証を保つ。
export const companyMemoSchema = {
  safeParse(value: unknown):
    | { success: true; data: CompanyMemoStructured }
    | { success: false } {
    if (!isCompanyMemoStructured(value)) return { success: false };
    return { success: true, data: value };
  },
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === "string");
}

export function isCompanyMemoStructured(
  value: unknown,
): value is CompanyMemoStructured {
  if (!isRecord(value) || !isRecord(value.overview)) return false;
  const overview = value.overview;
  const overviewOk = ["companyName", "eventName", "eventDate", "speakers"].every(
    (key) => typeof overview[key] === "string",
  );
  if (!overviewOk) return false;

  return [
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
  ].every((key) => isStringArray(value[key]));
}
