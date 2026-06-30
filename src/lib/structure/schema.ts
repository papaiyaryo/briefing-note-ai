import { z } from "zod";

export const companyMemoSchema = z.object({
  overview: z.object({
    companyName: z.string(),
    eventName: z.string(),
    eventDate: z.string(),
    speakers: z.string(),
  }),
  facts: z.array(z.string()),
  emphasizedPoints: z.array(z.string()),
  business: z.array(z.string()),
  strengths: z.array(z.string()),
  idealCandidate: z.array(z.string()),
  impressions: z.array(z.string()),
  concerns: z.array(z.string()),
  questions: z.array(z.string()),
  esPoints: z.array(z.string()),
  nextResearch: z.array(z.string()),
});

export type CompanyMemoStructured = z.infer<typeof companyMemoSchema>;

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
