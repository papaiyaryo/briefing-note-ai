import { z } from "zod";

export const interviewReviewItemSchema = z.object({
  content: z.string().min(1),
  basis: z.string().min(1),
  confidence: z.enum(["confirmed", "requires_check"]),
});

export const interviewReviewSchema = z.object({
  motivationPoints: z.array(interviewReviewItemSchema),
  reverseQuestions: z.array(interviewReviewItemSchema),
  companyUnderstanding: z.array(interviewReviewItemSchema),
  selfConnectionPoints: z.array(interviewReviewItemSchema),
});

export type InterviewReviewItem = z.infer<typeof interviewReviewItemSchema>;
export type InterviewReviewStructured = z.infer<typeof interviewReviewSchema>;

const itemJsonSchema = {
  type: "object",
  additionalProperties: false,
  required: ["content", "basis", "confidence"],
  properties: {
    content: { type: "string" },
    basis: { type: "string" },
    confidence: { type: "string", enum: ["confirmed", "requires_check"] },
  },
} as const;

export const interviewReviewJsonSchema = {
  type: "object",
  additionalProperties: false,
  required: [
    "motivationPoints",
    "reverseQuestions",
    "companyUnderstanding",
    "selfConnectionPoints",
  ],
  properties: {
    motivationPoints: { type: "array", items: itemJsonSchema },
    reverseQuestions: { type: "array", items: itemJsonSchema },
    companyUnderstanding: { type: "array", items: itemJsonSchema },
    selfConnectionPoints: { type: "array", items: itemJsonSchema },
  },
} as const;
