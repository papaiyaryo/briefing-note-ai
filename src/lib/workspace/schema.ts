import { z } from "zod";
import { codePointLength, isDateOnly, isSafeUrl, utf8Size } from "./validation";

const text = (max: number) =>
  z
    .string()
    .refine(
      (value) => codePointLength(value) <= max,
      "文字数の上限を超えています",
    );
const optionalText = (max: number) =>
  text(max)
    .nullable()
    .transform((value) => (value === "" ? null : value));
export const idSchema = z.uuid();
export const dateSchema = z
  .string()
  .refine(isDateOnly, "実在する日付を入力してください");
const optionalDate = z.union([
  dateSchema,
  z.literal("").transform(() => null),
  z.null(),
]);
const urlSchema = text(2048).refine(
  isSafeUrl,
  "資格情報のないhttp/https URLを入力してください",
);
const optionalUrl = z.union([
  urlSchema,
  z.literal("").transform(() => null),
  z.null(),
]);
export const selectionStatuses = [
  "not_applied",
  "considering",
  "applied",
  "screening",
  "interview",
  "offer",
  "withdrawn",
  "rejected",
] as const;
const companyShape = {
  name: z
    .string()
    .transform((value) => value.trim())
    .pipe(text(200))
    .refine((value) => value.length > 0, "企業名は必須です"),
  industry: optionalText(200),
  interestLevel: z.enum(["high", "medium", "low", "undecided"]).nullable(),
  personalNote: optionalText(5000),
  selectionStatus: z.enum(selectionStatuses),
  nextSelectionDate: optionalDate,
  applicationDeadline: optionalDate,
  officialUrl: optionalUrl,
};
export const companyFieldsSchema = z.strictObject(companyShape);
export const createCompanySchema = z.strictObject({
  operationId: idSchema,
  companyId: idSchema,
  fields: z.strictObject({
    ...companyShape,
    industry: companyShape.industry.default(null),
    interestLevel: companyShape.interestLevel.default(null),
    personalNote: companyShape.personalNote.default(null),
    selectionStatus: companyShape.selectionStatus.default("not_applied"),
    nextSelectionDate: optionalDate.default(null),
    applicationDeadline: optionalDate.default(null),
    officialUrl: optionalUrl.default(null),
  }),
});
const list = z.array(text(5000)).max(100);
export const structuredContentSchema = z
  .strictObject({
    overview: z.strictObject({
      companyName: text(500),
      eventName: text(500),
      eventDate: z
        .string()
        .refine((value) => value === "" || isDateOnly(value)),
      speakers: text(500),
    }),
    facts: list,
    emphasizedPoints: list,
    business: list,
    strengths: list,
    idealCandidate: list,
    impressions: list,
    concerns: list,
    questions: list,
    esPoints: list,
    nextResearch: list,
  })
  .refine(
    (value) => utf8Size(value) <= 256 * 1024,
    "構造化項目は256KiB以下にしてください",
  );
const eventSchema = z.strictObject({
  companyName: text(500),
  eventName: text(500),
  eventDate: z.string().refine((value) => value === "" || isDateOnly(value)),
});
const webSourceSchema = z.strictObject({
  id: text(200).min(1),
  category: text(200),
  content: text(5000),
  sourceUrl: urlSchema,
  fetchedAt: z.iso.datetime({ offset: true }),
  confidence: z.enum(["high", "medium", "low", "requires_check"]),
  status: z.literal("adopted"),
});
const memoShape = {
  markdown: text(50000).refine(
    (value) => value.trim().length > 0,
    "本文を入力してください",
  ),
  structuredContent: structuredContentSchema.nullable(),
  correctedOcr: optionalText(50000),
  event: eventSchema.nullable(),
  adoptedWebSources: z.array(webSourceSchema).max(50),
  comparisonReason: optionalText(5000),
};
export const memoFieldsSchema = z.strictObject(memoShape);
const manualSchema = z.strictObject({
  ...memoShape,
  origin: z.literal("manual"),
  providerOrigin: z.null(),
});
const generatedSchema = z.strictObject({
  ...memoShape,
  origin: z.literal("generated"),
  providerOrigin: z.enum(["dummy", "openai"]),
  structuredContent: structuredContentSchema,
  correctedOcr: text(50000),
  event: eventSchema,
  generationReceipt: text(4096).min(1),
});
export const createMemoSchema = z.strictObject({
  operationId: idSchema,
  memoId: idSchema,
  candidate: z.discriminatedUnion("origin", [manualSchema, generatedSchema]),
});
const nonEmpty = (value: object) => Object.keys(value).length > 0;
export const updateCompanySchema = z.strictObject({
  operationId: idSchema,
  expectedVersion: idSchema,
  changes: companyFieldsSchema.partial().refine(nonEmpty, "変更項目が必要です"),
});
export const updateMemoSchema = z.strictObject({
  operationId: idSchema,
  expectedVersion: idSchema,
  changes: memoFieldsSchema.partial().refine(nonEmpty, "変更項目が必要です"),
});
export const deleteTargetSchema = z.strictObject({
  companyId: idSchema,
  memoId: idSchema.nullable(),
});
export const deleteRequestSchema = z.strictObject({
  operationId: idSchema,
  confirmationId: idSchema,
});
export const comparisonSelectionSchema = z.strictObject({
  selected: z
    .array(z.strictObject({ companyId: idSchema, memoId: idSchema }))
    .min(1)
    .max(20)
    .refine(
      (value) => new Set(value.map((x) => x.companyId)).size === value.length,
    ),
});
