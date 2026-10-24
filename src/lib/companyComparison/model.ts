import { z } from "zod";
import { COMPARISON_POINTS, INTEREST_LEVEL_LABELS } from "../comparison";
import type {
  ComparisonSelection,
  ComparisonSnapshot,
  Memo,
} from "../workspace/contracts";
import {
  companyFieldsSchema,
  memoFieldsSchema,
  comparisonSelectionSchema,
  idSchema,
} from "../workspace/schema";
import { isSafeUrl } from "../workspace/validation";

const metadata = {
  version: z.string().min(1),
  createdAt: z.iso.datetime({ offset: true }),
  updatedAt: z.iso.datetime({ offset: true }),
};
export const companyResponseSchema = companyFieldsSchema.extend({
  companyId: idSchema,
  ...metadata,
});
export const memoResponseSchema = memoFieldsSchema
  .extend({
    memoId: idSchema,
    companyId: idSchema,
    ...metadata,
    origin: z.enum(["manual", "generated"]),
    providerOrigin: z.enum(["dummy", "openai"]).nullable(),
  })
  .refine((m) =>
    m.origin === "manual"
      ? m.providerOrigin === null
      : m.providerOrigin !== null,
  );
const snapshotSchema = z.strictObject({
  snapshotVersion: z.string().min(1),
  sources: z
    .array(
      z.strictObject({
        company: companyResponseSchema,
        memo: memoResponseSchema,
      }),
    )
    .min(1)
    .max(20),
});
export function validateSelection(selected: unknown): ComparisonSelection[] {
  return comparisonSelectionSchema.parse({ selected }).selected;
}
export function parseSnapshot(
  value: unknown,
  selected: ComparisonSelection[],
): ComparisonSnapshot {
  const expected = validateSelection(selected),
    parsed = snapshotSchema.parse(value);
  if (parsed.sources.length !== expected.length)
    throw new Error("比較参照が一致しません。");
  parsed.sources.forEach(({ company, memo }, index) => {
    if (
      company.companyId !== expected[index].companyId ||
      memo.memoId !== expected[index].memoId ||
      memo.companyId !== company.companyId ||
      memo.structuredContent === null
    )
      throw new Error("比較参照が一致しません。");
  });
  return parsed as ComparisonSnapshot;
}
export function comparisonRows(snapshot: ComparisonSnapshot) {
  return COMPARISON_POINTS.map((point) => ({
    ...point,
    values: snapshot.sources.map(({ memo }) =>
      memo.structuredContent[point.key].length
        ? memo.structuredContent[point.key]
        : ["未記載"],
    ),
  }));
}
export function originLabel(memo: Pick<Memo, "origin" | "providerOrigin">) {
  return memo.origin === "manual"
    ? "手入力"
    : memo.providerOrigin === "dummy"
      ? "生成 dummy（検証用・デモ）"
      : "生成 openai";
}
export function markdownText(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll("\\", "\\\\")
    .replaceAll("|", "\\|")
    .replaceAll("[", "\\[")
    .replaceAll("]", "\\]")
    .replaceAll("`", "\\`")
    .replace(/\r\n|\r|\n/g, "<br>");
}
export function comparisonMarkdown(snapshot: ComparisonSnapshot): string {
  const header = [
    "比較観点",
    ...snapshot.sources.map((s) => markdownText(s.company.name)),
  ];
  const rows = comparisonRows(snapshot).map((row) => [
    row.label,
    ...row.values.map((values) => values.map(markdownText).join("<br>")),
  ]);
  rows.push([
    "企業志望度",
    ...snapshot.sources.map((s) =>
      s.company.interestLevel === null
        ? "未設定"
        : INTEREST_LEVEL_LABELS[s.company.interestLevel],
    ),
  ]);
  rows.push([
    "選択メモの比較理由",
    ...snapshot.sources.map((s) =>
      markdownText(s.memo.comparisonReason ?? "未記載"),
    ),
  ]);
  const refs = snapshot.sources.flatMap(({ company, memo }) => [
    `### ${markdownText(company.name)}`,
    `- 企業ID: ${company.companyId} / 企業版: ${markdownText(company.version)}`,
    `- メモID: ${memo.memoId} / メモ版: ${markdownText(memo.version)}`,
    `- 出自: ${originLabel(memo)}`,
    `- イベント: ${markdownText(memo.event?.eventName ?? memo.structuredContent.overview.eventName)} / ${markdownText(memo.event?.eventDate ?? memo.structuredContent.overview.eventDate)}`,
    "#### 採用Web（紙由来情報とは別区分）",
    ...memo.adoptedWebSources.map((source) => {
      const url = isSafeUrl(source.sourceUrl)
        ? `<${new URL(source.sourceUrl).href.replaceAll("<", "%3C").replaceAll(">", "%3E")}>`
        : "不正URL";
      return `- ${markdownText(source.category)}: ${markdownText(source.content)} / ${url} / 取得日時 ${markdownText(source.fetchedAt)} / id ${markdownText(source.id)} / confidence ${source.confidence} / ${source.status}`;
    }),
  ]);
  return [
    "# 保存企業の比較",
    "",
    ...[header, header.map(() => "---"), ...rows].map(
      (row) => `| ${row.join(" | ")} |`,
    ),
    "",
    "## 保存参照と出自",
    ...refs,
    "",
    "※ 未記載は弱点やゼロ評価を意味しません。比較理由と志望度は本人の記入です。",
  ].join("\n");
}
