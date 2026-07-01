import { z } from "zod";

export const webSupplementItemSchema = z.object({
  title: z.string().min(1),
  summary: z.string().min(1),
  sourceUrl: z.string().url(),
  retrievedAt: z.string().min(1),
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
    retrievedAt: { type: "string" },
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
