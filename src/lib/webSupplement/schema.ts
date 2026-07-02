import { z } from "zod";

const isoDateOrDateTimeSchema = z.string().refine(
  (value) => {
    if (!/^\d{4}-\d{2}-\d{2}(?:T.*)?$/.test(value)) return false;
    const timestamp = Date.parse(value);
    return Number.isFinite(timestamp);
  },
  { message: "retrievedAt must be an ISO date or datetime" },
);

export const webSupplementItemSchema = z.object({
  title: z.string().min(1),
  summary: z.string().min(1),
  sourceUrl: z.string().url(),
  retrievedAt: isoDateOrDateTimeSchema,
  confidence: z.enum(["high", "medium", "low"]),
  needsVerification: z.boolean(),
  sourceType: z.enum(["official", "non_official"]),
});

export const webSupplementResultSchema = z.object({
  companyName: z.string().min(1),
  items: z.array(webSupplementItemSchema),
});

export type WebSupplementItem = z.infer<typeof webSupplementItemSchema>;
export type WebSupplementResult = z.infer<typeof webSupplementResultSchema>;

const itemJsonSchema = {
  type: "object",
  additionalProperties: false,
  required: [
    "title",
    "summary",
    "sourceUrl",
    "retrievedAt",
    "confidence",
    "needsVerification",
    "sourceType",
  ],
  properties: {
    title: { type: "string" },
    summary: { type: "string" },
    sourceUrl: { type: "string" },
    retrievedAt: {
      type: "string",
      pattern: "^\\d{4}-\\d{2}-\\d{2}(?:T.*)?$",
      description:
        "ISO 8601 retrieval date or datetime, for example 2026-07-01.",
    },
    confidence: { type: "string", enum: ["high", "medium", "low"] },
    needsVerification: { type: "boolean" },
    sourceType: { type: "string", enum: ["official", "non_official"] },
  },
} as const;

export const webSupplementJsonSchema = {
  type: "object",
  additionalProperties: false,
  required: ["companyName", "items"],
  properties: {
    companyName: { type: "string" },
    items: { type: "array", items: itemJsonSchema },
  },
} as const;
